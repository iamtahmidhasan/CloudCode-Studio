import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from './db';
import type { Project, FileItem, ProjectTemplate } from '@/types';

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
        path: '/index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Browser IDE Web Demo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="badge">Live Sandbox</div>
    <h1>Modern Web Playground</h1>
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

  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: '/style.css',
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
        name: 'script.js',
        path: '/script.js',
        language: 'javascript',
        content: `// Interactive Playground Script
console.log("🚀 Web Sandbox initialized successfully!");

let count = 0;
const countEl = document.getElementById("count");
const incBtn = document.getElementById("increment-btn");
const decBtn = document.getElementById("decrement-btn");
const resetBtn = document.getElementById("reset-btn");
const logBtn = document.getElementById("log-demo-btn");
const statusEl = document.getElementById("status-badge");

function updateDisplay() {
  countEl.textContent = count;
  countEl.classList.add("bump");
  setTimeout(() => countEl.classList.remove("bump"), 150);
}

incBtn.addEventListener("click", () => {
  count++;
  updateDisplay();
  console.log(\`[Counter] Incremented to: \${count}\`);
});

decBtn.addEventListener("click", () => {
  count--;
  updateDisplay();
  console.log(\`[Counter] Decremented to: \${count}\`);
});

resetBtn.addEventListener("click", () => {
  count = 0;
  updateDisplay();
  console.info("[Counter] Reset to zero.");
});

logBtn.addEventListener("click", () => {
  console.log("ℹ️ Standard log output with an object:", { timestamp: Date.now(), count });
  console.warn("⚠️ Warning log example: Keep an eye on memory usage.");
  console.error("❌ Error log example: Sample caught exception simulation.");
  statusEl.textContent = "Logs sent to IDE Console Panel!";
  setTimeout(() => {
    statusEl.textContent = "Sandbox Ready";
  }, 2500);
});
`,
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

export async function seedInitialDataIfNeeded(): Promise<{ activeProjectId: string; activeFileId: string }> {
  // Check if projects table has any data
  const projectCount = await db.projects.count();
  if (projectCount > 0) {
    const lastWorkspace = await db.workspace.get('current');
    const allProjects = await db.projects.toArray();
    const activeProject =
      allProjects.find((p) => p.id === lastWorkspace?.activeProjectId) ||
      allProjects.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];

    const projectFiles = await db.files.where('projectId').equals(activeProject.id).toArray();
    const activeFile =
      projectFiles.find((f) => f.id === lastWorkspace?.activeFileId) || projectFiles[0];

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
    for (let j = 0; j < template.files.length; j++) {
      const fileData = template.files[j];
      const fileId = `file-${templateKey}-${j}-${now}`;
      const file: FileItem = {
        id: fileId,
        projectId,
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

  return {
    activeProjectId: defaultActiveProjectId,
    activeFileId: defaultActiveFileId,
  };
}
