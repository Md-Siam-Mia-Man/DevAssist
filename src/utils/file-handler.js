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

function listFiles(dir, config, baseDir = dir, includedFiles = null) {
  let results = [];
  const list = fsSync.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);

    if (isIgnored(fullPath, config, baseDir)) {
      return;
    }

    const stat = fsSync.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(
        listFiles(fullPath, config, baseDir, includedFiles)
      );
    } else {
      if (includedFiles) {
        const isMatch = includedFiles.some(
          (inc) => fullPath === inc || fullPath.startsWith(inc + path.sep)
        );
        if (!isMatch) return;
      }
      results.push(path.relative(baseDir, fullPath));
    }
  });

  return results;
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

module.exports = { listFiles, walkDir };
