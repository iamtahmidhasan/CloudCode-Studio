import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from './db';
import type { Project, FileItem, FolderItem, ProjectTemplate } from '@/types';

export const SEED_TEMPLATES: Record<
  ProjectTemplate,
  { name: string; description: string; files: Array<{ name: string; path: string; language: FileItem['language']; content: string }> }
> = {
  web: {
    name: 'Interactive Web Playground',
    description: 'HTML5, Modern CSS, and JavaScript with live preview and console logging',
    files: [
      {
        name: 'index.html',
        path: '/Home/Projects/project-a/index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project A - Web Playground</title>
  <link rel="stylesheet" href="./styles/style.css">
</head>
<body>
  <div class="card">
    <div class="badge">Workspace Root</div>
    <h1>project-a Sandbox</h1>
    <p class="subtitle">Edit HTML, CSS, and JS with instant browser execution and console output capture.</p>

    <div class="counter-box">
      <span class="label">Click Counter</span>
      <div id="count" class="counter-value">0</div>
      <div class="btn-group">
        <button id="decrement-btn" class="btn secondary">- Decrement</button>
        <button id="reset-btn" class="btn outline">Reset</button>
        <button id="increment-btn" class="btn primary">+ Increment</button>
      </div>
    </div>

    <div class="actions">
      <button id="log-demo-btn" class="btn ghost">Generate Console Logs</button>
    </div>

    <div id="status-badge" class="status">Sandbox Ready</div>
  </div>

  <script src="./scripts/app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: '/Home/Projects/project-a/styles/style.css',
        language: 'css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #f8fafc;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 36px 32px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(to right, #ffffff, #c7d2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 28px;
}

.counter-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}

.label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.counter-value {
  font-size: 3rem;
  font-weight: 800;
  color: #38bdf8;
  line-height: 1.2;
  margin-bottom: 16px;
  transition: transform 0.15s ease;
}

.counter-value.bump {
  transform: scale(1.15);
}

.btn-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #38bdf8;
  color: #0f172a;
}
.btn.primary:hover {
  background: #7dd3fc;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #334155;
  color: #f1f5f9;
}
.btn.secondary:hover {
  background: #475569;
}

.btn.outline {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
}
.btn.outline:hover {
  border-color: #cbd5e1;
  color: #f8fafc;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  width: 100%;
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.actions {
  margin-bottom: 16px;
}

.status {
  font-size: 0.75rem;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.status::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}`,
      },
      {
        name: 'app.js',
        path: '/Home/Projects/project-a/scripts/app.js',
        language: 'javascript',
        content: `// Interactive Playground Script for project-a
console.log("🚀 Project A script running from /Home/Projects/project-a/scripts/app.js");

let count = 0;
const countEl = document.getElementById("count");
const incBtn = document.getElementById("increment-btn");
const decBtn = document.getElementById("decrement-btn");
const resetBtn = document.getElementById("reset-btn");
const logBtn = document.getElementById("log-demo-btn");
const statusEl = document.getElementById("status-badge");

function updateDisplay() {
  if (countEl) {
    countEl.textContent = count;
    countEl.classList.add("bump");
    setTimeout(() => countEl.classList.remove("bump"), 150);
  }
}

incBtn?.addEventListener("click", () => {
  count++;
  updateDisplay();
  console.log(\`[project-a] Counter: \${count}\`);
});

decBtn?.addEventListener("click", () => {
  count--;
  updateDisplay();
  console.log(\`[project-a] Counter: \${count}\`);
});

resetBtn?.addEventListener("click", () => {
  count = 0;
  updateDisplay();
  console.info("[project-a] Reset to zero.");
});

logBtn?.addEventListener("click", () => {
  console.log("ℹ️ Log from project-a:", { timestamp: Date.now(), count });
  if (statusEl) {
    statusEl.textContent = "Logs sent to Console Panel!";
    setTimeout(() => {
      statusEl.textContent = "Sandbox Ready";
    }, 2500);
  }
});
`,
      },
      {
        name: 'main.js',
        path: '/Home/Projects/project-b/main.js',
        language: 'javascript',
        content: `// Project B - Entry Point
console.log("📦 Project B initialized at /Home/Projects/project-b/main.js");

function calculateStats(items) {
  return {
    total: items.length,
    timestamp: new Date().toISOString()
  };
}

console.log("Project B stats:", calculateStats([10, 20, 30]));
`,
      },
      {
        name: 'index.html',
        path: '/Home/Templates/starter/index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Starter Template</title>
</head>
<body>
  <h1>Starter Template</h1>
  <p>Ready to build something amazing.</p>
</body>
</html>`,
      },
    ],
  },
  typescript: {
    name: 'TypeScript Algorithm Demo',
    description: 'Typed interfaces, functions, and console execution',
    files: [
      {
        name: 'index.ts',
        path: '/index.ts',
        language: 'typescript',
        content: `// TypeScript Browser Execution Demo
interface Student {
  id: number;
  name: string;
  grade: number;
  tags: string[];
}

const students: Student[] = [
  { id: 1, name: "Alice Walker", grade: 94, tags: ["honor-roll", "math"] },
  { id: 2, name: "Bob Martinez", grade: 82, tags: ["science"] },
  { id: 3, name: "Charlie Chen", grade: 98, tags: ["honor-roll", "computer-science"] },
  { id: 4, name: "Diana Prince", grade: 89, tags: ["physics"] },
];

function analyzeCohort(list: Student[]) {
  console.log("📊 Analyzing student cohort...");

  const totalScore = list.reduce((sum, s) => sum + s.grade, 0);
  const averageScore = totalScore / list.length;
  const honorRoll = list.filter((s) => s.grade >= 90);

  console.log(\`Total Students: \${list.length}\`);
  console.log(\`Class Average: \${averageScore.toFixed(2)}%\`);
  console.log("Honor Roll Students:", honorRoll.map((s) => \`\${s.name} (\${s.grade}%)\`));

  return { averageScore, honorRollCount: honorRoll.length };
}

const result = analyzeCohort(students);
console.log("✅ Analysis complete:", JSON.stringify(result));
`,
      },
    ],
  },
  python: {
    name: 'Python Data Science Demo',
    description: 'Run Python 3 via WebAssembly Pyodide directly in your browser',
    files: [
      {
        name: 'main.py',
        path: '/main.py',
        language: 'python',
        content: `# Python 3 In-Browser Demo (Pyodide Web Worker)
import sys
import math

print(f"🐍 Python {sys.version.split()[0]} running client-side in WebAssembly!")

# Fibonacci Generator
def fibonacci(n: int):
    a, b = 0, 1
    seq = []
    for _ in range(n):
        seq.append(a)
        a, b = b, a + b
    return seq

# Matrix transposition using list comprehension
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
transposed = [[row[i] for row in matrix] for i in range(3)]

fib_10 = fibonacci(10)
print(f"📈 First 10 Fibonacci numbers: {fib_10}")
print(f"🔄 Original Matrix: {matrix}")
print(f"✨ Transposed Matrix: {transposed}")

# Math calculations
circle_area = lambda r: math.pi * (r ** 2)
print(f"🎯 Area of circle with radius 5: {circle_area(5):.4f}")
print("🎉 Execution completed successfully without any remote servers!")
`,
      },
    ],
  },
  cpp: {
    name: 'C++ Algorithm Demo',
    description: 'C++ standard stream I/O and algorithm logic',
    files: [
      {
        name: 'main.cpp',
        path: '/main.cpp',
        language: 'cpp',
        content: `// C++ In-Browser Execution Demo
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "⚡ C++ Browser Execution Sandbox" << std::endl;
    std::cout << "-----------------------------------" << std::endl;

    std::vector<int> numbers = { 42, 17, 89, 5, 63, 28, 91 };
    
    std::cout << "Original vector: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    // Sorting
    std::sort(numbers.begin(), numbers.end());
    std::cout << "Sorted vector:   ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    // Calculations
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    double avg = static_cast<double>(sum) / numbers.size();

    std::cout << "Min element: " << numbers.front() << std::endl;
    std::cout << "Max element: " << numbers.back() << std::endl;
    std::cout << "Sum:         " << sum << std::endl;
    std::cout << "Average:     " << avg << std::endl;

    std::cout << "✅ C++ execution demonstration completed." << std::endl;
    return 0;
}
`,
      },
    ],
  },
  empty: {
    name: 'Empty Project',
    description: 'A clean project with an index file',
    files: [
      {
        name: 'index.js',
        path: '/index.js',
        language: 'javascript',
        content: `// Start writing code here\nconsole.log("Hello from browser IDE!");\n`,
      },
    ],
  },
};

async function updateFolderAndFileDescendantPaths(
  folderId: string,
  folderPath: string,
  allFolders: FolderItem[],
  allFiles: FileItem[]
): Promise<void> {
  const childFolders = allFolders.filter((c) => c.parentId === folderId);
  for (const child of childFolders) {
    const childPath = `${folderPath}/${child.name}`;
    await db.folders.update(child.id, { path: childPath, updatedAt: Date.now() });
    child.path = childPath;
    await updateFolderAndFileDescendantPaths(child.id, childPath, allFolders, allFiles);
  }

  const childFiles = allFiles.filter((f) => f.folderId === folderId);
  for (const file of childFiles) {
    const filePath = `${folderPath}/${file.name}`;
    await db.files.update(file.id, { path: filePath, updatedAt: Date.now() });
    file.path = filePath;
  }
}

export async function ensureHomeHierarchyForProject(projectId: string): Promise<void> {
  const project = await db.projects.get(projectId);
  if (!project) return;

  const now = Date.now();
  const allFolders = await db.folders.where('projectId').equals(projectId).toArray();
  const allFiles = await db.files.where('projectId').equals(projectId).toArray();

  // 1. Ensure Home folder exists with parentId: null, path: '/Home'
  let homeFolder = allFolders.find(
    (f) => f.name.toLowerCase() === 'home' && (!f.parentId || f.path === '/Home')
  );
  if (!homeFolder) {
    homeFolder = allFolders.find((f) => f.name.toLowerCase() === 'home');
  }

  if (!homeFolder) {
    const homeFolderId = `folder-home-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    homeFolder = {
      id: homeFolderId,
      projectId,
      parentId: null,
      name: 'Home',
      path: '/Home',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(homeFolder);
    allFolders.push(homeFolder);
  } else if (homeFolder.parentId !== null || homeFolder.path !== '/Home') {
    await db.folders.update(homeFolder.id, { parentId: null, path: '/Home', updatedAt: now });
    homeFolder.parentId = null;
    homeFolder.path = '/Home';
  }

  const homeId = homeFolder.id;

  // 2. Move any other existing root folders (parentId === null) to be under Home
  for (const folder of allFolders) {
    if (folder.id !== homeId && folder.parentId === null) {
      const newPath = `/Home/${folder.name}`;
      await db.folders.update(folder.id, {
        parentId: homeId,
        path: newPath,
        updatedAt: now,
      });
      folder.parentId = homeId;
      folder.path = newPath;

      // Update descendant paths recursively
      await updateFolderAndFileDescendantPaths(folder.id, newPath, allFolders, allFiles);
    }
  }

  // 3. For Web projects (or projects with web files), ensure the full dummy hierarchy exists under Home:
  // Home/
  // ├── Projects/
  // │   ├── project-a/
  // │   │   ├── index.html
  // │   │   ├── styles/style.css
  // │   │   └── scripts/app.js
  // │   └── project-b/
  // │       └── main.js
  // └── Templates/
  //     └── starter/
  //         └── index.html

  // Check or create Projects folder
  let projectsFolder = allFolders.find(
    (f) => f.parentId === homeId && f.name.toLowerCase() === 'projects'
  );
  if (!projectsFolder) {
    const projectsId = `folder-proj-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    projectsFolder = {
      id: projectsId,
      projectId,
      parentId: homeId,
      name: 'Projects',
      path: '/Home/Projects',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(projectsFolder);
    allFolders.push(projectsFolder);
  }

  // Check or create Templates folder
  let templatesFolder = allFolders.find(
    (f) => f.parentId === homeId && f.name.toLowerCase() === 'templates'
  );
  if (!templatesFolder) {
    const templatesId = `folder-templ-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    templatesFolder = {
      id: templatesId,
      projectId,
      parentId: homeId,
      name: 'Templates',
      path: '/Home/Templates',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(templatesFolder);
    allFolders.push(templatesFolder);
  }

  // Check or create project-a folder under Projects
  let projectAFolder = allFolders.find(
    (f) => f.parentId === projectsFolder!.id && f.name.toLowerCase() === 'project-a'
  );
  if (!projectAFolder) {
    const projectAId = `folder-proja-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    projectAFolder = {
      id: projectAId,
      projectId,
      parentId: projectsFolder!.id,
      name: 'project-a',
      path: '/Home/Projects/project-a',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(projectAFolder);
    allFolders.push(projectAFolder);
  }

  // Check or create styles folder under project-a
  let stylesFolder = allFolders.find(
    (f) => f.parentId === projectAFolder!.id && f.name.toLowerCase() === 'styles'
  );
  if (!stylesFolder) {
    const stylesId = `folder-styles-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    stylesFolder = {
      id: stylesId,
      projectId,
      parentId: projectAFolder!.id,
      name: 'styles',
      path: '/Home/Projects/project-a/styles',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(stylesFolder);
    allFolders.push(stylesFolder);
  }

  // Check or create scripts folder under project-a
  let scriptsFolder = allFolders.find(
    (f) => f.parentId === projectAFolder!.id && f.name.toLowerCase() === 'scripts'
  );
  if (!scriptsFolder) {
    const scriptsId = `folder-scripts-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    scriptsFolder = {
      id: scriptsId,
      projectId,
      parentId: projectAFolder!.id,
      name: 'scripts',
      path: '/Home/Projects/project-a/scripts',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(scriptsFolder);
    allFolders.push(scriptsFolder);
  }

  // Check or create project-b folder under Projects
  let projectBFolder = allFolders.find(
    (f) => f.parentId === projectsFolder!.id && f.name.toLowerCase() === 'project-b'
  );
  if (!projectBFolder) {
    const projectBId = `folder-projb-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    projectBFolder = {
      id: projectBId,
      projectId,
      parentId: projectsFolder!.id,
      name: 'project-b',
      path: '/Home/Projects/project-b',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(projectBFolder);
    allFolders.push(projectBFolder);
  }

  // Check or create starter folder under Templates
  let starterFolder = allFolders.find(
    (f) => f.parentId === templatesFolder!.id && f.name.toLowerCase() === 'starter'
  );
  if (!starterFolder) {
    const starterId = `folder-starter-${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    starterFolder = {
      id: starterId,
      projectId,
      parentId: templatesFolder!.id,
      name: 'starter',
      path: '/Home/Templates/starter',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(starterFolder);
    allFolders.push(starterFolder);
  }

  // Now ensure dummy files exist in their respective dummy folders:
  // 1) /Home/Projects/project-a/index.html
  let indexFile = allFiles.find(
    (f) => f.folderId === projectAFolder!.id && f.name === 'index.html'
  );
  if (!indexFile) {
    const tmplFile = SEED_TEMPLATES.web.files.find((f) => f.name === 'index.html' && f.path.includes('project-a'));
    if (tmplFile) {
      const fileId = `file-proja-html-${now}`;
      indexFile = {
        id: fileId,
        projectId,
        folderId: projectAFolder!.id,
        name: 'index.html',
        path: '/Home/Projects/project-a/index.html',
        language: 'html',
        content: tmplFile.content,
        createdAt: now,
        updatedAt: now,
      };
      await db.files.add(indexFile);
      allFiles.push(indexFile);
    }
  }

  // 2) /Home/Projects/project-a/styles/style.css
  let cssFile = allFiles.find(
    (f) => f.folderId === stylesFolder!.id && f.name === 'style.css'
  );
  if (!cssFile) {
    const tmplFile = SEED_TEMPLATES.web.files.find((f) => f.name === 'style.css');
    if (tmplFile) {
      cssFile = {
        id: `file-proja-css-${now}`,
        projectId,
        folderId: stylesFolder!.id,
        name: 'style.css',
        path: '/Home/Projects/project-a/styles/style.css',
        language: 'css',
        content: tmplFile.content,
        createdAt: now,
        updatedAt: now,
      };
      await db.files.add(cssFile);
      allFiles.push(cssFile);
    }
  }

  // 3) /Home/Projects/project-a/scripts/app.js
  let jsFile = allFiles.find(
    (f) => f.folderId === scriptsFolder!.id && f.name === 'app.js'
  );
  if (!jsFile) {
    const tmplFile = SEED_TEMPLATES.web.files.find((f) => f.name === 'app.js');
    if (tmplFile) {
      jsFile = {
        id: `file-proja-js-${now}`,
        projectId,
        folderId: scriptsFolder!.id,
        name: 'app.js',
        path: '/Home/Projects/project-a/scripts/app.js',
        language: 'javascript',
        content: tmplFile.content,
        createdAt: now,
        updatedAt: now,
      };
      await db.files.add(jsFile);
      allFiles.push(jsFile);
    }
  }

  // 4) /Home/Projects/project-b/main.js
  let mainJsFile = allFiles.find(
    (f) => f.folderId === projectBFolder!.id && f.name === 'main.js'
  );
  if (!mainJsFile) {
    const tmplFile = SEED_TEMPLATES.web.files.find((f) => f.name === 'main.js');
    if (tmplFile) {
      mainJsFile = {
        id: `file-projb-js-${now}`,
        projectId,
        folderId: projectBFolder!.id,
        name: 'main.js',
        path: '/Home/Projects/project-b/main.js',
        language: 'javascript',
        content: tmplFile.content,
        createdAt: now,
        updatedAt: now,
      };
      await db.files.add(mainJsFile);
      allFiles.push(mainJsFile);
    }
  }

  // 5) /Home/Templates/starter/index.html
  let starterHtmlFile = allFiles.find(
    (f) => f.folderId === starterFolder!.id && f.name === 'index.html'
  );
  if (!starterHtmlFile) {
    const tmplFile = SEED_TEMPLATES.web.files.find((f) => f.name === 'index.html' && f.path.includes('starter'));
    if (tmplFile) {
      starterHtmlFile = {
        id: `file-starter-html-${now}`,
        projectId,
        folderId: starterFolder!.id,
        name: 'index.html',
        path: '/Home/Templates/starter/index.html',
        language: 'html',
        content: tmplFile.content,
        createdAt: now,
        updatedAt: now,
      };
      await db.files.add(starterHtmlFile);
      allFiles.push(starterHtmlFile);
    }
  }

  // Clean up legacy loose root files if the project-a files exist:
  const looseFiles = allFiles.filter((f) => f.folderId === null);
  for (const lf of looseFiles) {
    if (lf.name === 'index.html' || lf.name === 'style.css' || lf.name === 'app.js') {
      await db.files.delete(lf.id);
    }
  }

  // Ensure expandedFolderIds includes Home, Projects, project-a, Templates
  const ws = await db.workspace.get('current');
  if (ws) {
    const expanded = new Set(ws.expandedFolderIds || []);
    expanded.add(homeFolder.id);
    expanded.add(projectsFolder!.id);
    expanded.add(projectAFolder!.id);
    expanded.add(templatesFolder!.id);

    let activeFileId = ws.activeFileId;
    const fileExists = activeFileId ? await db.files.get(activeFileId) : null;
    if (!fileExists && indexFile) {
      activeFileId = indexFile.id;
    }

    const openFileIds = ws.openFileIds || [];
    const validOpenFileIds = (
      await Promise.all(openFileIds.map(async (id) => ((await db.files.get(id)) ? id : null)))
    ).filter(Boolean) as string[];

    if (activeFileId && !validOpenFileIds.includes(activeFileId)) {
      validOpenFileIds.push(activeFileId);
    }

    // Default activeWorkspaceRootId to projectAFolder so that opening the editor opens project-a directly, hiding parent folders!
    const activeWorkspaceRootId = ws.activeWorkspaceRootId || projectAFolder!.id;
    const activeWorkspaceName = ws.activeWorkspaceName || projectAFolder!.name;

    await db.workspace.update('current', {
      expandedFolderIds: Array.from(expanded),
      activeFileId,
      activeWorkspaceRootId,
      activeWorkspaceName,
      openFileIds: validOpenFileIds.length > 0 ? validOpenFileIds : (activeFileId ? [activeFileId] : []),
    });
  }
}

export async function seedInitialDataIfNeeded(): Promise<{ activeProjectId: string; activeFileId: string }> {
  // Check if projects table has any data
  const projectCount = await db.projects.count();
  if (projectCount > 0) {
    const lastWorkspace = await db.workspace.get('current');
    const allProjects = await db.projects.toArray();
    const activeProject =
      allProjects.find((p) => p.id === lastWorkspace?.activeProjectId) ||
      allProjects.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];

    // Ensure all web projects (and active project) have their dummy folders moved under Home
    for (const proj of allProjects) {
      if (proj.template === 'web' || proj.id === activeProject.id) {
        await ensureHomeHierarchyForProject(proj.id);
      }
    }

    const updatedWorkspace = await db.workspace.get('current');
    const projectFiles = await db.files.where('projectId').equals(activeProject.id).toArray();
    const activeFile =
      projectFiles.find((f) => f.id === updatedWorkspace?.activeFileId) || projectFiles[0];

    return {
      activeProjectId: activeProject.id,
      activeFileId: activeFile ? activeFile.id : '',
    };
  }

  // First time seed: initialize Web, TypeScript, Python, and C++ projects
  const now = Date.now();
  let defaultActiveProjectId = '';
  let defaultActiveFileId = '';

  const templateKeys: ProjectTemplate[] = ['web', 'typescript', 'python', 'cpp'];

  for (let i = 0; i < templateKeys.length; i++) {
    const templateKey = templateKeys[i];
    const template = SEED_TEMPLATES[templateKey];
    const projectId = `proj-${templateKey}-${now}`;

    const project: Project = {
      id: projectId,
      name: template.name,
      description: template.description,
      template: templateKey,
      createdAt: now + i * 10,
      updatedAt: now + i * 10,
      lastOpenedAt: templateKey === 'web' ? now + 100 : now,
    };

    await db.projects.add(project);

    let firstFileIdForProject = '';
    const folderMap = new Map<string, string>();
    for (let j = 0; j < template.files.length; j++) {
      const fileData = template.files[j];
      let folderId: string | null = null;

      if (fileData.path && fileData.path.includes('/')) {
        const parts = fileData.path.split('/').filter(Boolean);
        if (parts.length > 1) {
          parts.pop(); // remove filename
          let currentPath = '';
          let parentId: string | null = null;
          for (const part of parts) {
            currentPath += '/' + part;
            let existingFolderId = folderMap.get(currentPath);
            if (!existingFolderId) {
              existingFolderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
              folderMap.set(currentPath, existingFolderId);
              await db.folders.add({
                id: existingFolderId,
                projectId,
                parentId,
                name: part,
                path: currentPath,
                createdAt: now + j,
                updatedAt: now + j,
              });
            }
            parentId = existingFolderId;
          }
          folderId = parentId;
        }
      }

      const fileId = `file-${templateKey}-${j}-${now}`;
      const file: FileItem = {
        id: fileId,
        projectId,
        folderId,
        name: fileData.name,
        path: fileData.path,
        language: fileData.language,
        content: fileData.content,
        createdAt: now + i * 10 + j,
        updatedAt: now + i * 10 + j,
      };
      await db.files.add(file);
      if (j === 0) firstFileIdForProject = fileId;
    }

    if (templateKey === 'web') {
      defaultActiveProjectId = projectId;
      defaultActiveFileId = firstFileIdForProject;
    }
  }

  // Seed default settings & workspace
  await db.settings.put(DEFAULT_SETTINGS);
  await db.workspace.put({
    ...DEFAULT_WORKSPACE,
    activeProjectId: defaultActiveProjectId,
    activeFileId: defaultActiveFileId,
    openFileIds: [defaultActiveFileId],
    lastUpdatedAt: now,
  });

  if (defaultActiveProjectId) {
    await ensureHomeHierarchyForProject(defaultActiveProjectId);
  }

  return {
    activeProjectId: defaultActiveProjectId,
    activeFileId: defaultActiveFileId,
  };
}
