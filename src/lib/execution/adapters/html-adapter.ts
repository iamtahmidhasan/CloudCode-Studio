import type { FileItem, ConsoleMessage, ExecutionResult } from '@/types';
import type { ExecutionAdapter } from '../types';
import { resolveWorkspaceRelativePath } from '@/lib/explorer/tree-utils';

export function buildHtmlPreviewDocument(
  files: FileItem[],
  activeFile?: FileItem,
  rootFolderPath: string = ''
): string {
  // Find primary HTML file or fallback to active file
  const htmlFile =
    (activeFile && activeFile.language === 'html' ? activeFile : null) ||
    files.find((f) => f.language === 'html') ||
    { path: '/index.html', content: '<div>No HTML file found</div>' };

  const cssFiles = files.filter((f) => f.language === 'css');
  const jsFiles = files.filter((f) => f.language === 'javascript');

  const consoleInterceptor = `
<script>
(function() {
  function serialize(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'function') return arg.toString();
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  }

  function postLog(type, args) {
    try {
      var serialized = Array.prototype.slice.call(args).map(serialize);
      window.parent.postMessage({
        source: 'ide-preview-sandbox',
        type: type,
        args: serialized,
        timestamp: Date.now()
      }, '*');
    } catch(e) {}
  }

  ['log', 'info', 'warn', 'error'].forEach(function(level) {
    var original = console[level];
    console[level] = function() {
      postLog(level, arguments);
      if (original) {
        original.apply(console, arguments);
      }
    };
  });

  window.onerror = function(message, source, lineno, colno, error) {
    var errorMsg = message;
    if (lineno) {
      errorMsg += ' (' + lineno + ':' + (colno || 0) + ')';
    }
    postLog('error', [errorMsg]);
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var msg = reason instanceof Error ? reason.message : String(reason);
    postLog('error', ['Unhandled Promise Rejection: ' + msg]);
  });
})();
</script>
`;

  let content = htmlFile.content || '<!DOCTYPE html><html><head></head><body></body></html>';

  // Inject console interceptor into <head> or at start
  if (content.includes('<head>')) {
    content = content.replace('<head>', `<head>${consoleInterceptor}`);
  } else {
    content = `${consoleInterceptor}${content}`;
  }

  const handledFiles = new Set<string>();

  // 1. Resolve and replace <link rel="stylesheet" href="...">
  content = content.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi,
    (match, href1, href2) => {
      const href = href1 || href2;
      if (!href) return match;

      const resolved = resolveWorkspaceRelativePath(htmlFile.path, href, rootFolderPath);
      if (!resolved) {
        return `<script>console.warn("[Security Boundary] Resource blocked or outside workspace root: ${href}");</script>`;
      }

      const matchedFile = cssFiles.find((f) => f.path === resolved || f.name === href.split('/').pop());
      if (matchedFile) {
        handledFiles.add(matchedFile.id);
        return `<style data-source="${href}">\n/* Injected: ${matchedFile.name} */\n${matchedFile.content}\n</style>`;
      }

      return `<script>console.warn("[Preview] Stylesheet not found within workspace: ${href}");</script>`;
    }
  );

  // 2. Resolve and replace <script src="...">
  content = content.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src) => {
      if (!src) return match;

      const resolved = resolveWorkspaceRelativePath(htmlFile.path, src, rootFolderPath);
      if (!resolved) {
        return `<script>console.warn("[Security Boundary] Script blocked or outside workspace root: ${src}");</script>`;
      }

      const matchedFile = jsFiles.find((f) => f.path === resolved || f.name === src.split('/').pop());
      if (matchedFile) {
        handledFiles.add(matchedFile.id);
        return `<script data-source="${src}">\ntry {\n${matchedFile.content}\n} catch(err) {\n  console.error(err);\n}\n</script>`;
      }

      return `<script>console.warn("[Preview] Script not found within workspace: ${src}");</script>`;
    }
  );

  // 3. Inject any remaining unhandled CSS files (for instant styling without manual <link> tags)
  const remainingCss = cssFiles.filter((f) => !handledFiles.has(f.id));
  if (remainingCss.length > 0) {
    const combinedCss = remainingCss.map((f) => `/* ${f.name} */\n${f.content}`).join('\n\n');
    const styleTag = `<style id="ide-injected-styles">\n${combinedCss}\n</style>`;
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${styleTag}\n</head>`);
    } else {
      content = `${styleTag}\n${content}`;
    }
  }

  // 4. Inject any remaining unhandled JS files
  const remainingJs = jsFiles.filter((f) => !handledFiles.has(f.id));
  if (remainingJs.length > 0) {
    const combinedJs = remainingJs.map((f) => `/* ${f.name} */\n${f.content}`).join('\n\n');
    const scriptTag = `<script id="ide-injected-scripts">\ntry {\n${combinedJs}\n} catch(err) {\n  console.error(err);\n}\n</script>`;
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      content = `${content}\n${scriptTag}`;
    }
  }

  return content;
}

export class HtmlExecutionAdapter implements ExecutionAdapter {
  async run(
    files: FileItem[],
    activeFile: FileItem,
    onMessage?: (msg: ConsoleMessage) => void
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const messages: ConsoleMessage[] = [];

    const sysMsg: ConsoleMessage = {
      id: `sys-${Date.now()}`,
      type: 'system',
      args: ['[HTML Sandbox] Building and rendering preview document...'],
      timestamp: Date.now(),
    };
    messages.push(sysMsg);
    onMessage?.(sysMsg);

    try {
      buildHtmlPreviewDocument(files);
      const readyMsg: ConsoleMessage = {
        id: `sys-${Date.now()}-ready`,
        type: 'system',
        args: ['[HTML Sandbox] Preview reloaded. Check the Preview tab.'],
        timestamp: Date.now(),
      };
      messages.push(readyMsg);
      onMessage?.(readyMsg);

      return {
        success: true,
        messages,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      const errMsg: ConsoleMessage = {
        id: `err-${Date.now()}`,
        type: 'error',
        args: [`[HTML Sandbox Error] ${errorStr}`],
        timestamp: Date.now(),
      };
      messages.push(errMsg);
      onMessage?.(errMsg);

      return {
        success: false,
        messages,
        error: errorStr,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }
}
