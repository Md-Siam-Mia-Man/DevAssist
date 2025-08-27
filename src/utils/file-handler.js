const fs = require("fs").promises; // Correct way to import the promises API
const fsSync = require("fs"); // For synchronous operations
const path = require("path");

function drawTree(dir, config, prefix = "", includedFiles = null) {
  let result = "";
  const files = fsSync
    .readdirSync(dir)
    .filter(
      (f) => !config.ignoreDirs.includes(f) && !config.ignoreFiles.includes(f)
    );
  const lastIndex = files.length - 1;

  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const isLast = index === lastIndex;
    const connector = isLast ? "└── " : "├── ";

    // If a whitelist is provided, check against it
    if (
      includedFiles &&
      !includedFiles.some((inc) => filePath.startsWith(inc))
    ) {
      if (!fsSync.statSync(filePath).isDirectory()) return;
      if (!includedFiles.some((inc) => inc.startsWith(filePath))) return;
    }

    if (fsSync.statSync(filePath).isDirectory()) {
      result += `${prefix}${connector}${file}/\n`;
      result += drawTree(
        filePath,
        config,
        prefix + (isLast ? "    " : "│   "),
        includedFiles
      );
    } else {
      result += `${prefix}${connector}${file}\n`;
    }
  });

  return result;
}

async function walkDir(dir, config, callback, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!config.ignoreDirs.includes(entry.name)) {
        await walkDir(fullPath, config, callback, baseDir);
      }
    } else if (entry.isFile()) {
      if (
        !config.ignoreFiles.includes(entry.name) &&
        config.includeExt.includes(path.extname(entry.name))
      ) {
        await callback(fullPath);
      }
    }
  }
}

module.exports = { drawTree, walkDir };
