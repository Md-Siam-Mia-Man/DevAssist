const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { minimatch } = require("minimatch");

function isIgnored(filePath, config, baseDir = process.cwd()) {
  const relativePath = path.relative(baseDir, filePath);
  const baseName = path.basename(filePath);

  if (config.ignoreFiles.includes(baseName)) {
    return true;
  }
  if (config.ignoreExt.includes(path.extname(baseName))) {
    return true;
  }

  const pathParts = relativePath.split(path.sep);
  if (pathParts.some((part) => config.ignoreDirs.includes(part))) {
    return true;
  }

  if (
    config.ignorePatterns.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    )
  ) {
    return true;
  }

  return false;
}

function drawTree(dir, config, prefix = "", includedFiles = null) {
  let result = "";
  const files = fsSync
    .readdirSync(dir)
    .filter((f) => !isIgnored(path.join(dir, f), config));

  const lastIndex = files.length - 1;

  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const isLast = index === lastIndex;
    const connector = isLast ? "└── " : "├── ";

    if (
      includedFiles &&
      !includedFiles.some((inc) => filePath === inc || filePath.startsWith(inc + path.sep))
    ) {
      if (!fsSync.statSync(filePath).isDirectory()) return;
      if (!includedFiles.some((inc) => inc === filePath || inc.startsWith(filePath + path.sep))) return;
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

    if (isIgnored(fullPath, config, baseDir)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDir(fullPath, config, callback, baseDir);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (
        config.includeExt.includes(ext) ||
        config.includeExt.includes(entry.name)
      ) {
        await callback(fullPath);
      }
    }
  }
}

module.exports = { drawTree, walkDir };
