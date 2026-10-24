import type { Monaco } from '@monaco-editor/react';
import type { editor, Position, IRange } from 'monaco-editor';

interface SnippetDefinition {
  label: string;
  insertText: string;
  detail: string;
  documentation?: string;
  kind?: number;
  sortText?: string;
  filterText?: string;
}

let isSuggestionsInitialized = false;

// Helper to create suggestions array with natural VS Code sorting and exact prefix matching
function createSuggestions(
  monaco: Monaco,
  snippets: SnippetDefinition[],
  range: IRange
) {
  return snippets.map((s) => ({
    label: s.label,
    kind: s.kind ?? monaco.languages.CompletionItemKind.Snippet,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    insertText: s.insertText,
    detail: s.detail,
    documentation: s.documentation
      ? { value: s.documentation }
      : undefined,
    // Natural sorting by label (same as native VS Code snippets)
    sortText: s.sortText ?? s.label,
    filterText: s.filterText ?? s.label,
    range,
  }));
}

// ----------------------------------------------------
// 1. CSS SNIPPETS & SHORTCUTS (VS Code / Emmet style)
// ----------------------------------------------------
const CSS_SNIPPETS: SnippetDefinition[] = [
  // Flexbox & Grid
  { label: 'df', insertText: 'display: flex;\n$0', detail: 'display: flex;' },
  { label: 'flex', insertText: 'display: flex;\n$0', detail: 'display: flex;' },
  { label: 'dg', insertText: 'display: grid;\n$0', detail: 'display: grid;' },
  { label: 'grid', insertText: 'display: grid;\n$0', detail: 'display: grid;' },
  { label: 'db', insertText: 'display: block;\n$0', detail: 'display: block;' },
  { label: 'dib', insertText: 'display: inline-block;\n$0', detail: 'display: inline-block;' },
  { label: 'dn', insertText: 'display: none;\n$0', detail: 'display: none;' },
  {
    label: 'center',
    insertText: 'display: flex;\njustify-content: center;\nalign-items: center;\n$0',
    detail: 'Flex center both axes',
  },
  {
    label: 'grid-center',
    insertText: 'display: grid;\nplace-items: center;\n$0',
    detail: 'Grid place-items center',
  },
  { label: 'jcc', insertText: 'justify-content: center;\n$0', detail: 'justify-content: center;' },
  { label: 'jcsb', insertText: 'justify-content: space-between;\n$0', detail: 'justify-content: space-between;' },
  { label: 'jcsa', insertText: 'justify-content: space-around;\n$0', detail: 'justify-content: space-around;' },
  { label: 'jcse', insertText: 'justify-content: space-evenly;\n$0', detail: 'justify-content: space-evenly;' },
  { label: 'jcfs', insertText: 'justify-content: flex-start;\n$0', detail: 'justify-content: flex-start;' },
  { label: 'jcfe', insertText: 'justify-content: flex-end;\n$0', detail: 'justify-content: flex-end;' },
  { label: 'aic', insertText: 'align-items: center;\n$0', detail: 'align-items: center;' },
  { label: 'aifs', insertText: 'align-items: flex-start;\n$0', detail: 'align-items: flex-start;' },
  { label: 'aife', insertText: 'align-items: flex-end;\n$0', detail: 'align-items: flex-end;' },
  { label: 'fdc', insertText: 'flex-direction: column;\n$0', detail: 'flex-direction: column;' },
  { label: 'fdr', insertText: 'flex-direction: row;\n$0', detail: 'flex-direction: row;' },
  { label: 'f1', insertText: 'flex: 1;\n$0', detail: 'flex: 1;' },
  { label: 'fg', insertText: 'flex-grow: ${1:1};\n$0', detail: 'flex-grow: ...;' },
  { label: 'fwrap', insertText: 'flex-wrap: wrap;\n$0', detail: 'flex-wrap: wrap;' },
  { label: 'gap', insertText: 'gap: ${1:16px};\n$0', detail: 'gap: ...;' },
  { label: 'gtc', insertText: 'grid-template-columns: repeat(${1:3}, 1fr);\n$0', detail: 'grid-template-columns: repeat(...);' },
  { label: 'gtr', insertText: 'grid-template-rows: repeat(${1:2}, 1fr);\n$0', detail: 'grid-template-rows: repeat(...);' },

  // Positioning
  { label: 'pos:a', insertText: 'position: absolute;\n$0', detail: 'position: absolute;' },
  { label: 'poa', insertText: 'position: absolute;\n$0', detail: 'position: absolute;' },
  { label: 'pos:r', insertText: 'position: relative;\n$0', detail: 'position: relative;' },
  { label: 'por', insertText: 'position: relative;\n$0', detail: 'position: relative;' },
  { label: 'pos:f', insertText: 'position: fixed;\n$0', detail: 'position: fixed;' },
  { label: 'pof', insertText: 'position: fixed;\n$0', detail: 'position: fixed;' },
  { label: 'pos:s', insertText: 'position: sticky;\n$0', detail: 'position: sticky;' },
  { label: 'sticky', insertText: 'position: sticky;\n$0', detail: 'position: sticky;' },
  { label: 'top', insertText: 'top: ${1:0};\n$0', detail: 'top: ...;' },
  { label: 'bottom', insertText: 'bottom: ${1:0};\n$0', detail: 'bottom: ...;' },
  { label: 'left', insertText: 'left: ${1:0};\n$0', detail: 'left: ...;' },
  { label: 'right', insertText: 'right: ${1:0};\n$0', detail: 'right: ...;' },
  { label: 'inset', insertText: 'inset: ${1:0};\n$0', detail: 'inset: 0;' },
  { label: 'zi', insertText: 'z-index: ${1:10};\n$0', detail: 'z-index: ...;' },

  // Sizing & Box Model
  { label: 'w100', insertText: 'width: 100%;\n$0', detail: 'width: 100%;' },
  { label: 'h100', insertText: 'height: 100%;\n$0', detail: 'height: 100%;' },
  { label: 'wh100', insertText: 'width: 100%;\nheight: 100%;\n$0', detail: 'width & height: 100%;' },
  { label: 'w', insertText: 'width: ${1:100%};\n$0', detail: 'width: ...;' },
  { label: 'h', insertText: 'height: ${1:100%};\n$0', detail: 'height: ...;' },
  { label: 'maxw', insertText: 'max-width: ${1:1200px};\n$0', detail: 'max-width: ...;' },
  { label: 'maxh', insertText: 'max-height: ${1:100vh};\n$0', detail: 'max-height: ...;' },
  { label: 'minw', insertText: 'min-width: ${1:300px};\n$0', detail: 'min-width: ...;' },
  { label: 'minh', insertText: 'min-height: ${1:100vh};\n$0', detail: 'min-height: ...;' },
  { label: 'bxs', insertText: 'box-sizing: border-box;\n$0', detail: 'box-sizing: border-box;' },
  { label: 'm', insertText: 'margin: ${1:0};\n$0', detail: 'margin: ...;' },
  { label: 'm0auto', insertText: 'margin: 0 auto;\n$0', detail: 'margin: 0 auto;' },
  { label: 'mt', insertText: 'margin-top: ${1:16px};\n$0', detail: 'margin-top: ...;' },
  { label: 'mb', insertText: 'margin-bottom: ${1:16px};\n$0', detail: 'margin-bottom: ...;' },
  { label: 'ml', insertText: 'margin-left: ${1:16px};\n$0', detail: 'margin-left: ...;' },
  { label: 'mr', insertText: 'margin-right: ${1:16px};\n$0', detail: 'margin-right: ...;' },
  { label: 'p', insertText: 'padding: ${1:16px};\n$0', detail: 'padding: ...;' },
  { label: 'pt', insertText: 'padding-top: ${1:16px};\n$0', detail: 'padding-top: ...;' },
  { label: 'pb', insertText: 'padding-bottom: ${1:16px};\n$0', detail: 'padding-bottom: ...;' },
  { label: 'pl', insertText: 'padding-left: ${1:16px};\n$0', detail: 'padding-left: ...;' },
  { label: 'pr', insertText: 'padding-right: ${1:16px};\n$0', detail: 'padding-right: ...;' },

  // Background & Borders
  { label: 'bg', insertText: 'background: ${1:#ffffff};\n$0', detail: 'background: ...;' },
  { label: 'bgc', insertText: 'background-color: ${1:#ffffff};\n$0', detail: 'background-color: ...;' },
  { label: 'bgi', insertText: "background-image: url('${1}');\n$0", detail: "background-image: url('...')" },
  { label: 'bgp', insertText: 'background-position: center;\n$0', detail: 'background-position: center;' },
  { label: 'bgs', insertText: 'background-size: cover;\n$0', detail: 'background-size: cover;' },
  { label: 'bgr', insertText: 'background-repeat: no-repeat;\n$0', detail: 'background-repeat: no-repeat;' },
  { label: 'bd', insertText: 'border: ${1:1px} ${2:solid} ${3:#3c3c3c};\n$0', detail: 'border: 1px solid ...;' },
  { label: 'bdr', insertText: 'border-radius: ${1:8px};\n$0', detail: 'border-radius: ...;' },
  { label: 'bdr50', insertText: 'border-radius: 50%;\n$0', detail: 'border-radius: 50%; (Circle)' },
  { label: 'bsh', insertText: 'box-shadow: ${1:0 4px 6px -1px rgba(0, 0, 0, 0.1)};\n$0', detail: 'box-shadow: ...;' },

  // Typography
  { label: 'c', insertText: 'color: ${1:#ffffff};\n$0', detail: 'color: ...;' },
  { label: 'tac', insertText: 'text-align: center;\n$0', detail: 'text-align: center;' },
  { label: 'tal', insertText: 'text-align: left;\n$0', detail: 'text-align: left;' },
  { label: 'tar', insertText: 'text-align: right;\n$0', detail: 'text-align: right;' },
  { label: 'fs', insertText: 'font-size: ${1:16px};\n$0', detail: 'font-size: ...;' },
  { label: 'fw', insertText: 'font-weight: ${1:600};\n$0', detail: 'font-weight: ...;' },
  { label: 'ff', insertText: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n$0", detail: 'System font family' },
  { label: 'lh', insertText: 'line-height: ${1:1.5};\n$0', detail: 'line-height: ...;' },
  { label: 'tdn', insertText: 'text-decoration: none;\n$0', detail: 'text-decoration: none;' },
  { label: 'ttu', insertText: 'text-transform: uppercase;\n$0', detail: 'text-transform: uppercase;' },
  { label: 'truncate', insertText: 'overflow: hidden;\ntext-overflow: ellipsis;\nwhite-space: nowrap;\n$0', detail: 'Single-line text truncation' },

  // Transitions, Transforms, Animations
  { label: 'trans', insertText: 'transition: ${1:all} ${2:0.2s} ${3:ease};\n$0', detail: 'transition: all 0.2s ease;' },
  { label: 'tf', insertText: 'transform: ${1:translate(-50%, -50%)};\n$0', detail: 'transform: ...;' },
  { label: 'scale', insertText: 'transform: scale(${1:1.05});\n$0', detail: 'transform: scale(...);' },
  { label: 'rotate', insertText: 'transform: rotate(${1:45deg});\n$0', detail: 'transform: rotate(...);' },
  { label: 'anim', insertText: 'animation: ${1:name} ${2:1s} ${3:ease} ${4:infinite};\n$0', detail: 'animation: name 1s ease;' },
  {
    label: 'keyframes',
    insertText: '@keyframes ${1:animationName} {\n\t0% {\n\t\t${2:opacity: 0;}\n\t}\n\t100% {\n\t\t${3:opacity: 1;}\n\t}\n}\n$0',
    detail: '@keyframes definition',
  },
  {
    label: 'media',
    insertText: '@media (max-width: ${1:768px}) {\n\t$0\n}',
    detail: '@media responsive query',
  },
  {
    label: 'root',
    insertText: ':root {\n\t--${1:primary}: ${2:#007acc};\n\t$0\n}',
    detail: ':root CSS custom properties',
  },
  {
    label: 'reset',
    insertText: '* {\n\tbox-sizing: border-box;\n\tmargin: 0;\n\tpadding: 0;\n}\n$0',
    detail: 'Universal CSS box-sizing reset',
  },
  { label: 'cur', insertText: 'cursor: pointer;\n$0', detail: 'cursor: pointer;' },
  { label: 'ov', insertText: 'overflow: hidden;\n$0', detail: 'overflow: hidden;' },
  { label: 'ova', insertText: 'overflow: auto;\n$0', detail: 'overflow: auto;' },
  { label: 'op', insertText: 'opacity: ${1:0.8};\n$0', detail: 'opacity: ...;' },
  {
    label: 'glass',
    insertText: 'background: rgba(255, 255, 255, 0.1);\nbackdrop-filter: blur(10px);\n-webkit-backdrop-filter: blur(10px);\nborder: 1px solid rgba(255, 255, 255, 0.15);\nborder-radius: 12px;\n$0',
    detail: 'Glassmorphism UI style',
  },
];

// ----------------------------------------------------------------
// 2. JAVASCRIPT / TYPESCRIPT SNIPPETS & SHORTCUTS (VS Code style)
// ----------------------------------------------------------------
const JS_TS_SNIPPETS: SnippetDefinition[] = [
  // Logging & Console
  { label: 'clg', insertText: 'console.log($1);$0', detail: 'console.log(...)' },
  { label: 'log', insertText: 'console.log($1);$0', detail: 'console.log(...)' },
  { label: 'cerr', insertText: 'console.error($1);$0', detail: 'console.error(...)' },
  { label: 'cwarn', insertText: 'console.warn($1);$0', detail: 'console.warn(...)' },
  { label: 'ctable', insertText: 'console.table($1);$0', detail: 'console.table(...)' },
  { label: 'cdir', insertText: 'console.dir($1);$0', detail: 'console.dir(...)' },
  { label: 'ctime', insertText: "console.time('${1:timer}');\n$0\nconsole.timeEnd('${1:timer}');", detail: 'console.time / timeEnd benchmark' },

  // Functions
  { label: 'fn', insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', detail: 'function declaration' },
  { label: 'function', insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', detail: 'function declaration' },
  { label: 'afn', insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};', detail: 'arrow function statement' },
  { label: 'arrow', insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};', detail: 'arrow function statement' },
  { label: 'cafn', insertText: '(${1:params}) => {\n\t$0\n}', detail: 'anonymous arrow function' },
  { label: 'iife', insertText: '(() => {\n\t$0\n})();', detail: 'Immediately Invoked Function Expression' },
  { label: 'asfn', insertText: 'async function ${1:name}(${2:params}) {\n\t$0\n}', detail: 'async function declaration' },
  { label: 'asafn', insertText: 'const ${1:name} = async (${2:params}) => {\n\t$0\n};', detail: 'async arrow function' },

  // Control Flow
  { label: 'if', insertText: 'if (${1:condition}) {\n\t$0\n}', detail: 'if statement' },
  { label: 'ifelse', insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', detail: 'if / else statement' },
  { label: 'ife', insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', detail: 'if / else statement' },
  { label: 'ternary', insertText: '${1:condition} ? ${2:trueVal} : ${3:falseVal}', detail: 'ternary operator' },
  {
    label: 'switch',
    insertText: 'switch (${1:key}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}',
    detail: 'switch / case statement',
  },
  { label: 'for', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t$0\n}', detail: 'indexed for loop' },
  { label: 'forof', insertText: 'for (const ${1:item} of ${2:iterable}) {\n\t$0\n}', detail: 'for...of loop' },
  { label: 'forin', insertText: 'for (const ${1:key} in ${2:object}) {\n\t$0\n}', detail: 'for...in loop' },
  { label: 'while', insertText: 'while (${1:condition}) {\n\t$0\n}', detail: 'while loop' },
  { label: 'dowhile', insertText: 'do {\n\t$0\n} while (${1:condition});', detail: 'do...while loop' },
  {
    label: 'try',
    insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n\t$0\n}',
    detail: 'try / catch block',
  },
  {
    label: 'trycatch',
    insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n\t$0\n}',
    detail: 'try / catch block',
  },
  {
    label: 'tryfinally',
    insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n} finally {\n\t$0\n}',
    detail: 'try / catch / finally block',
  },

  // Array Higher-Order Functions
  { label: 'foreach', insertText: '${1:array}.forEach((${2:item}) => {\n\t$0\n});', detail: 'Array.forEach(...)' },
  { label: 'fe', insertText: '${1:array}.forEach((${2:item}) => {\n\t$0\n});', detail: 'Array.forEach(...)' },
  { label: 'map', insertText: '${1:array}.map((${2:item}) => {\n\treturn $0;\n});', detail: 'Array.map(...)' },
  { label: 'filter', insertText: '${1:array}.filter((${2:item}) => ${3:true});', detail: 'Array.filter(...)' },
  { label: 'reduce', insertText: '${1:array}.reduce((${2:acc}, ${3:cur}) => {\n\treturn $0;\n}, ${4:initial});', detail: 'Array.reduce(...)' },
  { label: 'find', insertText: '${1:array}.find((${2:item}) => ${3:true});', detail: 'Array.find(...)' },
  { label: 'some', insertText: '${1:array}.some((${2:item}) => ${3:true});', detail: 'Array.some(...)' },
  { label: 'every', insertText: '${1:array}.every((${2:item}) => ${3:true});', detail: 'Array.every(...)' },
  { label: 'sort', insertText: '${1:array}.sort((a, b) => ${2:a - b});', detail: 'Array.sort((a, b) => ...)' },

  // Promises & Timers
  { label: 'prom', insertText: 'new Promise((resolve, reject) => {\n\t$0\n});', detail: 'new Promise(...)' },
  { label: 'promise', insertText: 'new Promise((resolve, reject) => {\n\t$0\n});', detail: 'new Promise(...)' },
  { label: 'then', insertText: '.then((${1:res}) => {\n\t$0\n})', detail: '.then(res => ...)' },
  { label: 'catch', insertText: '.catch((${1:err}) => {\n\tconsole.error(${1:err});\n})', detail: '.catch(err => ...)' },
  { label: 'await', insertText: 'const ${1:data} = await ${2:promise};$0', detail: 'await promise' },
  { label: 'timeout', insertText: 'setTimeout(() => {\n\t$0\n}, ${1:1000});', detail: 'setTimeout(...)' },
  { label: 'st', insertText: 'setTimeout(() => {\n\t$0\n}, ${1:1000});', detail: 'setTimeout(...)' },
  { label: 'interval', insertText: 'setInterval(() => {\n\t$0\n}, ${1:1000});', detail: 'setInterval(...)' },
  { label: 'si', insertText: 'setInterval(() => {\n\t$0\n}, ${1:1000});', detail: 'setInterval(...)' },
  {
    label: 'fetch',
    insertText: "fetch('${1:https://api.example.com}')\n\t.then(res => res.json())\n\t.then(data => {\n\t\t$0\n\t})\n\t.catch(err => console.error(err));",
    detail: 'fetch API with .then() chain',
  },
  {
    label: 'fetchasync',
    insertText: "const res = await fetch('${1:https://api.example.com}');\nconst data = await res.json();\n$0",
    detail: 'fetch API with async/await',
  },

  // DOM Helpers
  { label: 'qs', insertText: "document.querySelector('${1:selector}')", detail: "document.querySelector('...')" },
  { label: 'qsa', insertText: "document.querySelectorAll('${1:selector}')", detail: "document.querySelectorAll('...')" },
  { label: 'gid', insertText: "document.getElementById('${1:id}')", detail: "document.getElementById('...')" },
  { label: 'ael', insertText: "${1:element}.addEventListener('${2:click}', (e) => {\n\t$0\n});", detail: "addEventListener('...', e => ...)" },
  { label: 'crel', insertText: "const ${1:el} = document.createElement('${2:div}');\n$0", detail: "document.createElement('...')" },

  // Modules & Objects
  { label: 'imp', insertText: "import ${1:module} from '${2:package}';", detail: 'ES import module' },
  { label: 'impn', insertText: "import { ${1:name} } from '${2:package}';", detail: 'ES named import' },
  { label: 'exp', insertText: 'export const ${1:name} = $0;', detail: 'export const ...' },
  { label: 'expd', insertText: 'export default ${1:name};', detail: 'export default ...' },
  { label: 'class', insertText: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t$0\n\t}\n}', detail: 'class declaration' },
  { label: 'jsonp', insertText: 'JSON.parse(${1:jsonString})', detail: 'JSON.parse(...)' },
  { label: 'jsons', insertText: 'JSON.stringify(${1:object}, null, 2)', detail: 'JSON.stringify(...)' },
  { label: 'keys', insertText: 'Object.keys(${1:object})', detail: 'Object.keys(...)' },
  { label: 'values', insertText: 'Object.values(${1:object})', detail: 'Object.values(...)' },
  { label: 'entries', insertText: 'Object.entries(${1:object})', detail: 'Object.entries(...)' },
];

// ----------------------------------------------------
// 3. PYTHON SNIPPETS & SHORTCUTS (VS Code style)
// ----------------------------------------------------
const PYTHON_SNIPPETS: SnippetDefinition[] = [
  {
    label: 'main',
    insertText: "if __name__ == '__main__':\n\t${1:main()}",
    detail: "if __name__ == '__main__':",
  },
  {
    label: 'ifmain',
    insertText: "if __name__ == '__main__':\n\t${1:main()}",
    detail: "if __name__ == '__main__':",
  },
  {
    label: 'def',
    insertText: 'def ${1:function_name}(${2:params}):\n\t"""${3:Docstring}"""\n\t${0:pass}',
    detail: 'def function declaration',
  },
  {
    label: 'fn',
    insertText: 'def ${1:function_name}(${2:params}):\n\t"""${3:Docstring}"""\n\t${0:pass}',
    detail: 'def function declaration',
  },
  {
    label: 'defm',
    insertText: 'def ${1:method_name}(self${2:, params}):\n\t$0',
    detail: 'def class method',
  },
  {
    label: 'class',
    insertText: 'class ${1:ClassName}:\n\t"""${2:Docstring}"""\n\tdef __init__(self${3:, params}):\n\t\tself.${4:attr} = ${4:attr}\n\t\t$0',
    detail: 'class with __init__',
  },
  { label: 'init', insertText: 'def __init__(self${1:, params}):\n\t$0', detail: '__init__ constructor' },
  { label: '__init__', insertText: 'def __init__(self${1:, params}):\n\t$0', detail: '__init__ constructor' },
  { label: 'str', insertText: 'def __str__(self):\n\treturn f"${1:ClassName}()"', detail: '__str__ method' },
  { label: 'repr', insertText: 'def __repr__(self):\n\treturn f"${1:ClassName}()"', detail: '__repr__ method' },
  { label: 'lambda', insertText: 'lambda ${1:x}: ${2:x}', detail: 'lambda anonymous function' },

  // Printing & Input
  { label: 'pr', insertText: 'print(${1:val})$0', detail: 'print(...)' },
  { label: 'print', insertText: 'print(${1:val})$0', detail: 'print(...)' },
  { label: 'input', insertText: '${1:val} = input("${2:Enter value: "})', detail: 'input(...) prompt' },
  {
    label: 'with',
    insertText: "with open('${1:filename.txt}', '${2:r}') as ${3:f}:\n\t${4:data = ${3:f}.read()}\n\t$0",
    detail: 'with open(...) file context',
  },
  {
    label: 'withwrite',
    insertText: "with open('${1:filename.txt}', 'w') as ${2:f}:\n\t${2:f}.write(${3:content})\n\t$0",
    detail: 'with open(...) write file',
  },

  // Control Flow
  { label: 'if', insertText: 'if ${1:condition}:\n\t$0', detail: 'if statement' },
  { label: 'ifelse', insertText: 'if ${1:condition}:\n\t$2\nelse:\n\t$0', detail: 'if / else statement' },
  { label: 'ife', insertText: 'if ${1:condition}:\n\t$2\nelse:\n\t$0', detail: 'if / else statement' },
  { label: 'elif', insertText: 'elif ${1:condition}:\n\t$0', detail: 'elif statement' },
  { label: 'for', insertText: 'for ${1:item} in ${2:iterable}:\n\t$0', detail: 'for ... in loop' },
  { label: 'fori', insertText: 'for ${1:i} in range(${2:n}):\n\t$0', detail: 'for i in range(n) loop' },
  { label: 'forenum', insertText: 'for ${1:i}, ${2:item} in enumerate(${3:iterable}):\n\t$0', detail: 'for i, item in enumerate(...)' },
  { label: 'forzip', insertText: 'for ${1:a}, ${2:b} in zip(${3:list1}, ${4:list2}):\n\t$0', detail: 'for a, b in zip(...)' },
  { label: 'while', insertText: 'while ${1:condition}:\n\t$0', detail: 'while loop' },
  {
    label: 'try',
    insertText: 'try:\n\t$1\nexcept ${2:Exception} as ${3:e}:\n\tprint(f"Error: {${3:e}}")\n\t$0',
    detail: 'try / except block',
  },
  {
    label: 'tryexcept',
    insertText: 'try:\n\t$1\nexcept ${2:Exception} as ${3:e}:\n\tprint(f"Error: {${3:e}}")\n\t$0',
    detail: 'try / except block',
  },
  {
    label: 'tryfinally',
    insertText: 'try:\n\t$1\nexcept ${2:Exception} as ${3:e}:\n\t$4\nfinally:\n\t$0',
    detail: 'try / except / finally block',
  },

  // Comprehensions
  { label: 'lc', insertText: '[${1:x} for ${1:x} in ${2:iterable}${3: if ${4:condition}}]', detail: 'list comprehension' },
  { label: 'dc', insertText: '{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:iterable}}', detail: 'dict comprehension' },
  { label: 'sc', insertText: '{${1:x} for ${1:x} in ${2:iterable}}', detail: 'set comprehension' },
  { label: 'gen', insertText: '(${1:x} for ${1:x} in ${2:iterable})', detail: 'generator expression' },

  // Imports
  { label: 'imp', insertText: 'import ${1:module}', detail: 'import statement' },
  { label: 'from', insertText: 'from ${1:module} import ${2:name}', detail: 'from ... import ...' },
  { label: 'json', insertText: 'import json\n${1:data} = json.loads(${2:json_str})\n$0', detail: 'import json & loads' },
  { label: 'jsondump', insertText: 'import json\n${1:json_str} = json.dumps(${2:data}, indent=2)\n$0', detail: 'import json & dumps' },
  { label: 'sys', insertText: 'import sys\n$0', detail: 'import sys' },
  { label: 'os', insertText: 'import os\n$0', detail: 'import os' },
  { label: 'math', insertText: 'import math\n$0', detail: 'import math' },
  { label: 'time', insertText: 'import time\n$0', detail: 'import time' },
  { label: 'datetime', insertText: 'from datetime import datetime\n$0', detail: 'from datetime import datetime' },
];

// Python standard keywords & builtins for natural completion
const PYTHON_BUILTINS = [
  'append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count', 'sort', 'reverse', 'copy',
  'keys', 'values', 'items', 'get', 'update', 'setdefault',
  'strip', 'split', 'join', 'replace', 'startswith', 'endswith', 'lower', 'upper', 'title', 'find', 'format',
  'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round',
  'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr', 'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple',
  'True', 'False', 'None', 'pass', 'break', 'continue', 'return', 'yield', 'raise', 'assert', 'global', 'nonlocal',
];

// ----------------------------------------------------
// 4. C++ SNIPPETS & SHORTCUTS (VS Code style)
// ----------------------------------------------------
const CPP_SNIPPETS: SnippetDefinition[] = [
  {
    label: 'main',
    insertText: '#include <iostream>\n\nint main() {\n\tstd::cout << "Hello, World!" << std::endl;\n\treturn 0;\n}\n',
    detail: 'C++ main() starter boilerplate',
  },
  {
    label: 'cpp',
    insertText: '#include <iostream>\n\nint main() {\n\tstd::cout << "Hello, World!" << std::endl;\n\treturn 0;\n}\n',
    detail: 'C++ main() starter boilerplate',
  },
  { label: 'inc', insertText: '#include <${1:iostream}>\n$0', detail: '#include <...>' },
  { label: 'include', insertText: '#include <${1:iostream}>\n$0', detail: '#include <...>' },
  { label: 'inc_vector', insertText: '#include <vector>\n$0', detail: '#include <vector>' },
  { label: 'inc_string', insertText: '#include <string>\n$0', detail: '#include <string>' },
  { label: 'inc_algorithm', insertText: '#include <algorithm>\n$0', detail: '#include <algorithm>' },
  { label: 'inc_map', insertText: '#include <map>\n$0', detail: '#include <map>' },
  { label: 'inc_cmath', insertText: '#include <cmath>\n$0', detail: '#include <cmath>' },
  { label: 'using', insertText: 'using namespace std;\n$0', detail: 'using namespace std;' },

  // I/O
  { label: 'cout', insertText: 'std::cout << ${1:"message"} << std::endl;$0', detail: 'std::cout << ... << std::endl;' },
  { label: 'cin', insertText: 'std::cin >> ${1:variable};$0', detail: 'std::cin >> ...;' },
  { label: 'cerr', insertText: 'std::cerr << ${1:"error"} << std::endl;$0', detail: 'std::cerr << ... << std::endl;' },

  // Loops & Control Flow
  { label: 'for', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}', detail: 'for index loop (0 to n)' },
  { label: 'fori', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}', detail: 'for index loop (0 to n)' },
  { label: 'forr', insertText: 'for (const auto& ${1:item} : ${2:container}) {\n\t$0\n}', detail: 'range-based for loop' },
  { label: 'for_it', insertText: 'for (auto ${1:it} = ${2:container}.begin(); ${1:it} != ${2:container}.end(); ++${1:it}) {\n\t$0\n}', detail: 'iterator for loop' },
  { label: 'while', insertText: 'while (${1:condition}) {\n\t$0\n}', detail: 'while loop' },
  { label: 'dowhile', insertText: 'do {\n\t$0\n} while (${1:condition});', detail: 'do...while loop' },
  { label: 'if', insertText: 'if (${1:condition}) {\n\t$0\n}', detail: 'if statement' },
  { label: 'ifelse', insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', detail: 'if / else statement' },
  { label: 'ife', insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', detail: 'if / else statement' },
  { label: 'switch', insertText: 'switch (${1:val}) {\n\tcase ${2:1}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', detail: 'switch statement' },
  {
    label: 'try',
    insertText: 'try {\n\t$1\n} catch (const std::exception& ${2:e}) {\n\tstd::cerr << ${2:e}.what() << std::endl;\n\t$0\n}',
    detail: 'try / catch block',
  },

  // Functions & Classes
  { label: 'fn', insertText: '${1:void} ${2:functionName}(${3:params}) {\n\t$0\n}', detail: 'function declaration' },
  { label: 'func', insertText: '${1:void} ${2:functionName}(${3:params}) {\n\t$0\n}', detail: 'function declaration' },
  {
    label: 'class',
    insertText: 'class ${1:ClassName} {\npublic:\n\t${1:ClassName}();\n\t~${1:ClassName}();\n\nprivate:\n\t$0\n};',
    detail: 'class definition',
  },
  { label: 'struct', insertText: 'struct ${1:StructName} {\n\t$0\n};', detail: 'struct definition' },
  { label: 'namespace', insertText: 'namespace ${1:name} {\n\t$0\n}', detail: 'namespace definition' },
  { label: 'template', insertText: 'template <typename ${1:T}>\n$0', detail: 'template declaration' },

  // STL Containers & Pointers
  { label: 'vec', insertText: 'std::vector<${1:int}> ${2:v};$0', detail: 'std::vector<T> v;' },
  { label: 'vector', insertText: 'std::vector<${1:int}> ${2:v};$0', detail: 'std::vector<T> v;' },
  { label: 'vec_init', insertText: 'std::vector<${1:int}> ${2:v} = {${3:1, 2, 3}};$0', detail: 'std::vector with initial values' },
  { label: 'str', insertText: 'std::string ${1:str} = "${2}";$0', detail: 'std::string' },
  { label: 'string', insertText: 'std::string ${1:str} = "${2}";$0', detail: 'std::string' },
  { label: 'pair', insertText: 'std::pair<${1:int}, ${2:int}> ${3:p};$0', detail: 'std::pair<T1, T2>' },
  { label: 'map', insertText: 'std::map<${1:std::string}, ${2:int}> ${3:m};$0', detail: 'std::map<Key, Val>' },
  { label: 'unordered_map', insertText: 'std::unordered_map<${1:std::string}, ${2:int}> ${3:m};$0', detail: 'std::unordered_map<Key, Val>' },
  { label: 'umap', insertText: 'std::unordered_map<${1:std::string}, ${2:int}> ${3:m};$0', detail: 'std::unordered_map<Key, Val>' },
  { label: 'set', insertText: 'std::set<${1:int}> ${2:s};$0', detail: 'std::set<T>' },
  { label: 'queue', insertText: 'std::queue<${1:int}> ${2:q};$0', detail: 'std::queue<T>' },
  { label: 'stack', insertText: 'std::stack<${1:int}> ${2:s};$0', detail: 'std::stack<T>' },
  { label: 'shared_ptr', insertText: 'std::shared_ptr<${1:Type}> ${2:ptr} = std::make_shared<${1:Type}>(${3});$0', detail: 'std::make_shared' },
  { label: 'unique_ptr', insertText: 'std::unique_ptr<${1:Type}> ${2:ptr} = std::make_unique<${1:Type}>(${3});$0', detail: 'std::make_unique' },

  // Algorithms
  { label: 'sort', insertText: 'std::sort(${1:v}.begin(), ${1:v}.end());$0', detail: 'std::sort(begin, end)' },
  { label: 'sort_desc', insertText: 'std::sort(${1:v}.begin(), ${1:v}.end(), std::greater<${2:int}>());$0', detail: 'std::sort descending' },
  { label: 'reverse', insertText: 'std::reverse(${1:v}.begin(), ${1:v}.end());$0', detail: 'std::reverse(begin, end)' },
  { label: 'find', insertText: 'auto ${1:it} = std::find(${2:v}.begin(), ${2:v}.end(), ${3:val});$0', detail: 'std::find' },
  { label: 'max_element', insertText: 'auto ${1:it} = std::max_element(${2:v}.begin(), ${2:v}.end());$0', detail: 'std::max_element' },
  { label: 'min_element', insertText: 'auto ${1:it} = std::min_element(${2:v}.begin(), ${2:v}.end());$0', detail: 'std::min_element' },
  { label: 'accumulate', insertText: 'int ${1:sum} = std::accumulate(${2:v}.begin(), ${2:v}.end(), 0);$0', detail: 'std::accumulate (Sum)' },
  { label: 'count', insertText: 'int ${1:cnt} = std::count(${2:v}.begin(), ${2:v}.end(), ${3:val});$0', detail: 'std::count' },
];

// C++ standard keywords & methods for natural completion
const CPP_BUILTINS = [
  'push_back', 'emplace_back', 'pop_back', 'size', 'empty', 'clear', 'insert', 'erase', 'front', 'back',
  'begin', 'end', 'rbegin', 'rend', 'c_str', 'length', 'substr', 'find', 'append',
  'std::cout', 'std::cin', 'std::cerr', 'std::endl', 'std::vector', 'std::string', 'std::pair', 'std::make_pair',
  'auto', 'const', 'constexpr', 'nullptr', 'static_cast', 'dynamic_cast', 'reinterpret_cast', 'sizeof',
  'return', 'break', 'continue', 'virtual', 'override', 'public', 'private', 'protected', 'inline',
];

export function setupCodeSuggestions(monaco: Monaco) {
  if (isSuggestionsInitialized) return;
  isSuggestionsInitialized = true;

  // 1. CSS Completion Provider
  monaco.languages.registerCompletionItemProvider('css', {
    triggerCharacters: [':', '@', '-'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);
      const match = textUntilPosition.match(/([a-zA-Z0-9:@_#-]+)$/);
      const typedWord = match ? match[1] : '';

      const startColumn = position.column - typedWord.length;
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: Math.max(1, startColumn),
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      return {
        suggestions: createSuggestions(monaco, CSS_SNIPPETS, range),
      };
    },
  });

  // 2. JavaScript & TypeScript Completion Providers
  const jsTsProvider = {
    triggerCharacters: ['@', '$'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);

      // Do NOT show top-level statement snippets (e.g. console.log, fn, if) when completing an object member (e.g. "obj.", "console.")
      const isMemberAccess = /\.\s*$/.test(textUntilPosition.replace(/[a-zA-Z0-9_$]+$/, ''));
      if (isMemberAccess) {
        return { suggestions: [] };
      }

      const match = textUntilPosition.match(/([a-zA-Z0-9_$]+)$/);
      const typedWord = match ? match[1] : '';

      const startColumn = position.column - typedWord.length;
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: Math.max(1, startColumn),
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      return {
        suggestions: createSuggestions(monaco, JS_TS_SNIPPETS, range),
      };
    },
  };

  monaco.languages.registerCompletionItemProvider('javascript', jsTsProvider);
  monaco.languages.registerCompletionItemProvider('typescript', jsTsProvider);

  // 3. Python Completion Provider
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['@'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);

      // Do NOT show top-level statement snippets or builtins (e.g. print, def) when completing an attribute (e.g. "self.", "obj.")
      const isMemberAccess = /\.\s*$/.test(textUntilPosition.replace(/[a-zA-Z0-9_]+$/, ''));
      if (isMemberAccess) {
        return { suggestions: [] };
      }

      const match = textUntilPosition.match(/([a-zA-Z0-9_]+)$/);
      const typedWord = match ? match[1] : '';

      const startColumn = position.column - typedWord.length;
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: Math.max(1, startColumn),
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      const snippetSuggestions = createSuggestions(monaco, PYTHON_SNIPPETS, range);

      const builtinSuggestions = PYTHON_BUILTINS.map((name) => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
        insertText: name,
        detail: `Python: ${name}`,
        sortText: name,
        filterText: name,
        range,
      }));

      return {
        suggestions: [...snippetSuggestions, ...builtinSuggestions],
      };
    },
  });

  // 4. C++ Completion Provider
  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['#', ':'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);

      // Do NOT show statement snippets when accessing members via . or ->
      const isMemberAccess = /(\.|\->)\s*$/.test(textUntilPosition.replace(/[a-zA-Z0-9_:#]+$/, ''));
      if (isMemberAccess) {
        return { suggestions: [] };
      }

      const match = textUntilPosition.match(/([a-zA-Z0-9_:#]+)$/);
      const typedWord = match ? match[1] : '';

      const startColumn = position.column - typedWord.length;
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: Math.max(1, startColumn),
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      const snippetSuggestions = createSuggestions(monaco, CPP_SNIPPETS, range);

      const builtinSuggestions = CPP_BUILTINS.map((name) => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
        insertText: name,
        detail: `C++: ${name}`,
        sortText: name,
        filterText: name,
        range,
      }));

      return {
        suggestions: [...snippetSuggestions, ...builtinSuggestions],
      };
    },
  });
}
