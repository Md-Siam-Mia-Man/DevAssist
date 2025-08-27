// context-exporter.js
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const projectDir = path.resolve(__dirname);
const outputFile = path.join(projectDir, "Code.txt"); // plain text file

const includeExt = [".html", ".css", ".js", ".json", ".py"];
const ignoreDirs = ["node_modules", ".git"];
const ignoreFiles = ["package-lock.json", "Code.txt", "screenshot.png"];

// exclude this script itself
const thisFileName = path.basename(__filename);
ignoreFiles.push(thisFileName);
// --- End Configuration ---

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkDir(filePath, callback);
      }
    } else if (stat.isFile()) {
      if (
        !ignoreFiles.includes(file) &&
        includeExt.includes(path.extname(file))
      ) {
        callback(filePath);
      }
    }
  });
}

function drawTree(dir, prefix = "") {
  let result = "";
  const files = fs
    .readdirSync(dir)
    .filter((f) => !ignoreDirs.includes(f) && !ignoreFiles.includes(f));
  const lastIndex = files.length - 1;

  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const isLast = index === lastIndex;
    const connector = isLast ? "└── " : "├── ";

    if (fs.statSync(filePath).isDirectory()) {
      result += `${prefix}${connector}[DIR] ${file}\n`;
      result += drawTree(filePath, prefix + (isLast ? "    " : "│   "));
    } else {
      result += `${prefix}${connector}${file}\n`;
    }
  });

  return result;
}

function exportFiles() {
  const collectedFiles = [];

  walkDir(projectDir, (filePath) => {
    const relativePath = path.relative(projectDir, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const stats = fs.statSync(filePath);
    const lineCount = content.split("\n").length;

    collectedFiles.push({ relativePath, content, stats, lineCount });
  });

  // reset file
  fs.writeFileSync(outputFile, `# Project Export: ${path.basename(projectDir)}\n\n`);

  // --- Structure ---
  const tree = `└── ${path.basename(projectDir)}\n${drawTree(projectDir)}`;
  fs.appendFileSync(outputFile, "## Project Structure\n\n");
  fs.appendFileSync(outputFile, "```plaintext\n");
  fs.appendFileSync(outputFile, `${tree}\n`);
  fs.appendFileSync(outputFile, "```\n\n");

  // --- Files ---
  fs.appendFileSync(outputFile, "## File Contents\n\n");
  collectedFiles.forEach(({ relativePath, content }) => {
    fs.appendFileSync(outputFile, `### ${relativePath}\n\n`);
    fs.appendFileSync(outputFile, "```plaintext\n");
    fs.appendFileSync(outputFile, content);
    fs.appendFileSync(outputFile, "\n```\n\n");
  });

  console.log(`✅ Code + Project structure exported to ${outputFile}`);
}

exportFiles();
