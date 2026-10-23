import type { Monaco } from '@monaco-editor/react';
import { VSCODE_DARK_PLUS, VSCODE_LIGHT_PLUS } from './monaco-theme';
import { setupEmmet } from './emmet-provider';

export function initializeMonaco(monaco: Monaco) {
  // Register Emmet and HTML snippet completion providers (! + Enter/Tab)
  setupEmmet(monaco);

  // Register themes
  monaco.editor.defineTheme('vscode-dark-plus', VSCODE_DARK_PLUS);
  monaco.editor.defineTheme('vscode-light-plus', VSCODE_LIGHT_PLUS);

  // Configure TypeScript / JavaScript language service defaults
  const tsDefaults = monaco.languages.typescript.typescriptDefaults;
  const jsDefaults = monaco.languages.typescript.javascriptDefaults;

  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTextFiles: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    strict: true,
    noImplicitAny: false,
    noLib: false,
    lib: ['esnext', 'dom', 'dom.iterable'],
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  };

  tsDefaults.setCompilerOptions(compilerOptions);
  jsDefaults.setCompilerOptions(compilerOptions);

  tsDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  jsDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // Configure HTML language service
  monaco.languages.html.htmlDefaults.setOptions({
    format: {
      wrapLineLength: 120,
      unformatted: 'wbr',
      indentInnerHtml: true,
      preserveNewLines: true,
      maxPreserveNewLines: 2,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: 'head, body, /html',
      wrapAttributes: 'auto',
    },
    suggest: {
      html5: true,
    },
  });

  // Configure CSS language service
  monaco.languages.css.cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: 'warning',
      vendorPrefix: 'warning',
      duplicateProperties: 'warning',
      emptyRules: 'warning',
      importStatement: 'ignore',
      boxModel: 'ignore',
      universalSelector: 'ignore',
      zeroUnits: 'ignore',
    },
  });
}
