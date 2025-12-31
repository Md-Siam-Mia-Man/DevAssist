const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { walkDir } = require("../utils/file-handler");
const { formatCode } = require("../utils/formatter");

async function handleRemoveComments(files, options) {
  console.log(kleur.blue(`\n🧹 Starting comment removal...`));
  console.log(kleur.dim("─".repeat(40)));

  const config = loadConfig();
  const projectDir = process.cwd();

  let includePatterns = [];
  if (files) {
    includePatterns.push(path.resolve(projectDir, files));
  }

  let processedCount = 0;
  let modifiedCount = 0;

  await walkDir(projectDir, config, (filePath) => {
    if (includePatterns.length > 0) {
       const isMatch = includePatterns.some(p => {
          return filePath === p || filePath.startsWith(p + path.sep);
       });
       if (!isMatch) return;
    }

    const ext = path.extname(filePath).slice(1).toLowerCase();

    // Explicitly exclude typically non-commented data files or those we can't safely handle
    if (['json', 'md', 'txt', 'lock'].includes(ext)) {
        return;
    }

    try {
        const content = fs.readFileSync(filePath, "utf8");
        const formatted = formatCode(content, filePath); // Reusing the formatter logic

        if (content !== formatted) {
            fs.writeFileSync(filePath, formatted, "utf8");
            console.log(kleur.green(`✔ Cleaned: ${path.relative(projectDir, filePath)}`));
            modifiedCount++;
        }
        processedCount++;
    } catch (err) {
        console.error(kleur.red(`✖ Error processing ${path.relative(projectDir, filePath)}: ${err.message}`));
    }
  });

  console.log(kleur.dim("─".repeat(40)));
  console.log(kleur.green(`✅ Comment removal complete!`));
  console.log(`📊 Stats:  ${processedCount} files scanned, ${modifiedCount} files modified.`);
  console.log("");
}

module.exports = { handleRemoveComments };
