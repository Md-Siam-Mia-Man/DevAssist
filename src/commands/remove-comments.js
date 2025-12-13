const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const strip = require("strip-comments");
const { loadConfig } = require("../utils/config-loader");
const { walkDir } = require("../utils/file-handler");

function getLanguage(ext) {
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "c":
    case "cpp":
    case "cs":
    case "java":
    case "swift":
    case "go":
    case "kt":
    case "rs":
    case "scala":
      return "javascript"; // C-style comments
    case "py":
    case "rb":
    case "pl":
    case "sh":
    case "yaml":
    case "yml":
    case "dockerfile":
      return "python"; // Hash-style comments
    case "html":
    case "xml":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "php":
      return "php";
    case "sql":
      return "sql";
    default:
      return null;
  }
}

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
  let skippedCount = 0;

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

    const language = getLanguage(ext);

    // If we don't know the language, we should NOT assume JS, as it risks corrupting data (e.g. URLs in text files).
    // The previous implementation defaulted to JS which caused issues.
    if (!language) {
        // If the user explicitly asked for this file (via files argument), we might warn them.
        // But in bulk mode, we should skip.
        // For now, silently skip unsupported extensions to be safe.
        return;
    }

    try {
        const content = fs.readFileSync(filePath, "utf8");
        const stripOptions = { language };

        const stripped = strip(content, stripOptions);

        if (content !== stripped) {
            fs.writeFileSync(filePath, stripped, "utf8");
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
