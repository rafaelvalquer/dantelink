import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = [
  path.join(root, "src"),
  path.resolve(root, "..", "server", "src"),
];
const extensions = new Set([".js", ".jsx", ".css", ".html", ".md"]);
const mojibakePattern = /[ÃÂ�]/u;
const ignoredDirectories = new Set(["node_modules", "dist", ".git"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const findings = [];

for (const scanRoot of scanRoots) {
  const files = await collectFiles(scanRoot);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/u);

    lines.forEach((line, index) => {
      if (mojibakePattern.test(line)) {
        findings.push({
          file: path.relative(root, file),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }
}

if (findings.length) {
  console.error("Possíveis textos com encoding quebrado encontrados:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.text}`);
  }
  process.exit(1);
}

console.log("check:text ok - nenhum mojibake comum encontrado.");
