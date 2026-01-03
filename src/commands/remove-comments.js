const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { walkDir } = require("../utils/file-handler");
const { formatCode } = require("../utils/formatter");
const { minimatch } = require("minimatch");

async function handleRemoveComments(files, options) {
  console.log(kleur.blue(`\n🧹 Starting comment removal...`));
  console.log(kleur.dim("─".repeat(40)));

  if (options.dryRun) {
    console.log(kleur.yellow("ℹ DRY RUN MODE: No files will be modified."));
  }

  const config = loadConfig();
  const projectDir = process.cwd();

  console.log(kleur.blue(`🔍 Scanning directory...`));

  let includePatterns = [];

  if (files && files.length > 0) {
      files.forEach(f => includePatterns.push(f));
  }

  if (options.include) {
      options.include.split(',').forEach(p => includePatterns.push(p.trim()));
  }

  const excludePatterns = options.exclude ? options.exclude.split(',').map(p => p.trim()) : [];

  let processedCount = 0;
  let modifiedCount = 0;

  await walkDir(projectDir, config, (filePath) => {
    const relPath = path.relative(projectDir, filePath);

    if (includePatterns.length > 0) {
      const isMatch = includePatterns.some((p) => {
        return minimatch(relPath, p) || relPath.startsWith(p + path.sep) || relPath === p;
      });
      if (!isMatch) return;
    }

    if (excludePatterns.length > 0) {
        const isExcluded = excludePatterns.some(p => minimatch(relPath, p));
        if (isExcluded) return;
    }

    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (["json", "md", "txt", "lock", "png", "jpg", "jpeg", "gif", "ico"].includes(ext)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");

      const formatOptions = {
          preserveProtected: options.preserveProtected
      };

      const formatted = formatCode(content, filePath, formatOptions);

      if (content !== formatted) {
        if (!options.dryRun) {
            fs.writeFileSync(filePath, formatted, "utf8");
            console.log(
                kleur.green(`✨ Cleaned: ${relPath}`),
            );
        } else {
             console.log(
                kleur.yellow(`🔍 Would clean: ${relPath}`),
            );
        }
        modifiedCount++;
      }
      processedCount++;
    } catch (err) {
      console.error(
        kleur.red(
          `❌ Error processing ${relPath}: ${err.message}`,
        ),
      );
    }
  });

  console.log(kleur.dim("─".repeat(40)));
  console.log(kleur.green(`✅ Comment removal complete!`));
  console.log(
    `📊 Stats:  ${processedCount} files scanned, ${modifiedCount} files ${options.dryRun ? 'would be' : ''} modified.`,
  );
  console.log("");
}

module.exports = { handleRemoveComments };
