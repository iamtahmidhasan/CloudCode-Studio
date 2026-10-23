import type { Monaco } from '@monaco-editor/react';
import type { editor, Position } from 'monaco-editor';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';

export const HTML5_BOILERPLATE = `<!DOCTYPE html>
<html lang="\${1:en}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${2:Document}</title>
</head>
<body>
  $0
</body>
</html>`;

let isEmmetInitialized = false;

export function setupEmmet(monaco: Monaco) {
  if (isEmmetInitialized) return;
  isEmmetInitialized = true;

  // 1. Enable emmet-monaco-es library for standard Emmet expansions (e.g. div.container>ul>li*3)
  try {
    emmetHTML(monaco, ['html']);
    emmetCSS(monaco, ['css']);
    emmetJSX(monaco, ['javascript', 'typescript']);
  } catch (err) {
    console.warn('Emmet-monaco-es registration notice:', err);
  }

  // 2. Register first-class HTML Emmet & boilerplate completion provider
  // Guarantees ! and html:5 appear at the very top of autocomplete and expand on Enter/Tab
  monaco.languages.registerCompletionItemProvider('html', {
    triggerCharacters: ['!', ':', '<', '.', '#', '>'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);

      // Find token right before cursor (e.g. '!', 'html:5', 'link:css', etc.)
      const match = textUntilPosition.match(/([a-zA-Z0-9!:-]+)$/);
      const typedWord = match ? match[1] : '';

      const startColumn = position.column - typedWord.length;
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: Math.max(1, startColumn),
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      const suggestions = [
        // ! -> HTML5 Boilerplate (Default VS Code Emmet behavior)
        {
          label: '!',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: HTML5_BOILERPLATE,
          detail: 'Emmet Abbreviation (HTML5 Boilerplate)',
          documentation: {
            value: 'Standard HTML5 boilerplate with <!DOCTYPE html>, head, viewport meta, title, and body.',
          },
          sortText: '00000_!',
          filterText: '!',
          range,
        },
        // html:5 -> HTML5 Boilerplate
        {
          label: 'html:5',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: HTML5_BOILERPLATE,
          detail: 'Emmet Abbreviation (HTML5 Boilerplate)',
          documentation: {
            value: 'Standard HTML5 boilerplate template',
          },
          sortText: '00001_html5',
          filterText: 'html:5',
          range,
        },
        // link:css
        {
          label: 'link:css',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<link rel="stylesheet" href="${1:style.css}">',
          detail: 'Emmet Abbreviation (<link rel="stylesheet">)',
          sortText: '00002_linkcss',
          range,
        },
        // link:favicon
        {
          label: 'link:favicon',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<link rel="shortcut icon" href="${1:favicon.ico}" type="image/x-icon">',
          detail: 'Emmet Abbreviation (Favicon link)',
          sortText: '00003_favicon',
          range,
        },
        // script:src
        {
          label: 'script:src',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<script src="${1:script.js}"></script>',
          detail: 'Emmet Abbreviation (<script src="...">)',
          sortText: '00004_scriptsrc',
          range,
        },
        // meta:vp
        {
          label: 'meta:vp',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
          detail: 'Emmet Abbreviation (Viewport meta tag)',
          sortText: '00005_metavp',
          range,
        },
        // form:post
        {
          label: 'form:post',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<form action="${1}" method="post">\n\t$0\n</form>',
          detail: 'Emmet Abbreviation (<form method="post">)',
          sortText: '00006_formpost',
          range,
        },
        // a
        {
          label: 'a',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<a href="${1:#}">${2:Link}</a>',
          detail: 'Emmet Abbreviation (Anchor link)',
          sortText: '00010_a',
          range,
        },
        // img
        {
          label: 'img',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<img src="${1}" alt="${2}">',
          detail: 'Emmet Abbreviation (Image tag)',
          sortText: '00011_img',
          range,
        },
        // button
        {
          label: 'button',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '<button type="${1:button}">${2:Button}</button>',
          detail: 'Emmet Abbreviation (Button)',
          sortText: '00012_button',
          range,
        },
      ];

      return {
        suggestions,
      };
    },
  });
}
