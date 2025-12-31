const path = require("path");

function generateMarkdownStructure(files, rootDir) {
  const tree = {};

  files.forEach((file) => {
    const relativePath = path.relative(rootDir, file);
    const parts = relativePath.split(path.sep);
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part];
    });
  });

  function buildMarkdown(node, depth = 0) {
    let output = "";
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = node[a] !== null;
      const bIsDir = node[b] !== null;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    keys.forEach((key) => {
        const indent = "  ".repeat(depth);
        if (node[key] === null) {
            output += `${indent}- ${key}\n`;
        } else {
            output += `${indent}- ${key}/\n`;
            output += buildMarkdown(node[key], depth + 1);
        }
    });

    return output;
  }

  return buildMarkdown(tree);
}

module.exports = { generateMarkdownStructure };
