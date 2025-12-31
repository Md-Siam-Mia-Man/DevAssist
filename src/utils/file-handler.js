const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const ignore = require("ignore");

function loadGitIgnore(dir) {
    const gitIgnorePath = path.join(dir, ".gitignore");
    if (fsSync.existsSync(gitIgnorePath)) {
        return fsSync.readFileSync(gitIgnorePath, "utf8");
    }
    return "";
}

function createIgnoreFilter(config, baseDir, useGitIgnore = false) {
    const ig = ignore();

    // Add patterns from config
    if (config.ignoreDirs) {
        config.ignoreDirs.forEach(dir => ig.add(dir));
        config.ignoreDirs.forEach(dir => ig.add(`${dir}/`));
    }
    if (config.ignoreFiles) {
        config.ignoreFiles.forEach(file => ig.add(file));
    }
    if (config.ignoreExt) {
        config.ignoreExt.forEach(ext => ig.add(`*${ext}`));
    }
    if (config.ignorePatterns) {
        config.ignorePatterns.forEach(pattern => ig.add(pattern));
    }

    if (useGitIgnore) {
        const gitIgnoreContent = loadGitIgnore(baseDir);
        if (gitIgnoreContent) {
            ig.add(gitIgnoreContent);
        }
    }

    return ig;
}

function listFiles(dir, config, baseDir = dir, includedFiles = null, useGitIgnore = false) {
  const ig = createIgnoreFilter(config, baseDir, useGitIgnore);
  let results = [];

  function traverse(currentDir) {
      const list = fsSync.readdirSync(currentDir);

      list.forEach((file) => {
        const fullPath = path.join(currentDir, file);
        let relativePath = path.relative(baseDir, fullPath);

        // Ensure forward slashes for ignore package
        if (path.sep === '\\') {
            relativePath = relativePath.split(path.sep).join('/');
        }

        const stat = fsSync.statSync(fullPath);
        const isDirectory = stat.isDirectory();
        const checkPath = isDirectory ? relativePath + '/' : relativePath;

        if (relativePath && ig.ignores(checkPath)) {
             return;
        }

        if (isDirectory) {
          traverse(fullPath);
        } else {
             if (includedFiles) {
                const isMatch = includedFiles.some(
                  (inc) => fullPath === inc || fullPath.startsWith(inc + path.sep)
                );
                if (!isMatch) return;
             }
             // Apply includeExt filter
             const ext = path.extname(file);
             if (
                 config.includeExt.includes(ext) ||
                 config.includeExt.includes(file)
             ) {
                 results.push(relativePath);
             }
        }
      });
  }

  traverse(dir);
  return results;
}

async function walkDir(dir, config, callback, baseDir = dir, useGitIgnore = false) {
  const ig = createIgnoreFilter(config, baseDir, useGitIgnore);

  async function traverse(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        let relativePath = path.relative(baseDir, fullPath);

        // Ensure forward slashes for ignore package
        if (path.sep === '\\') {
            relativePath = relativePath.split(path.sep).join('/');
        }

        const isDirectory = entry.isDirectory();
        const checkPath = isDirectory ? relativePath + '/' : relativePath;

        if (relativePath && ig.ignores(checkPath)) {
            continue;
        }

        if (isDirectory) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
            // Apply includeExt filter
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

  await traverse(dir);
}

module.exports = { listFiles, walkDir };
