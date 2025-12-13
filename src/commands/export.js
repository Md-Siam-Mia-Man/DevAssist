const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { minimatch } = require("minimatch");
const { loadConfig } = require("../utils/config-loader");
const { walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");

async function handleExport(options) {
  console.log(kleur.yellow("Starting project export..."));

  const config = loadConfig();
  const projectDir = process.cwd();
  const outputFile = path.resolve(projectDir, options.output);
  const framework = options.framework || detectFramework();

  config.ignoreFiles.push(path.basename(outputFile));

  const collectedFiles = [];

  // Use minimatch for include/exclude patterns
  // We keep them as strings to check against relative paths
  let includePatterns = options.only
    ? options.only.split(",").map((p) => p.trim())
    : null;
  let excludePatterns = options.exclude
    ? options.exclude.split(",").map((p) => p.trim())
    : [];

  await walkDir(projectDir, config, (filePath) => {
    const relativePath = path.relative(projectDir, filePath);

    if (includePatterns) {
      const isIncluded = includePatterns.some((pattern) =>
        minimatch(relativePath, pattern, { dot: true }) ||
        relativePath.startsWith(pattern + path.sep) ||
        relativePath === pattern
      );
      if (!isIncluded) {
        return;
      }
    }

    if (excludePatterns.length > 0) {
       const isExcluded = excludePatterns.some((pattern) =>
        minimatch(relativePath, pattern, { dot: true }) ||
        relativePath.startsWith(pattern + path.sep) ||
        relativePath === pattern
      );
      if (isExcluded) {
        return;
      }
    }

    const content = fs.readFileSync(filePath, "utf8");
    collectedFiles.push({ relativePath, content });
  });

  // Generate XML Output
  let outputContent = `<project_structure>\n`;
  if (framework !== "Unknown") {
    outputContent += `  <framework>${framework}</framework>\n`;
  }

  outputContent += `  <files_list>\n`;
  collectedFiles.forEach(({ relativePath }) => {
     outputContent += `    <path>${relativePath}</path>\n`;
  });
  outputContent += `  </files_list>\n`;

  collectedFiles.forEach(({ relativePath, content }) => {
    outputContent += `  <file path="${relativePath}">\n`;
    outputContent += `<![CDATA[\n${content}\n]]>\n`;
    outputContent += `  </file>\n`;
  });

  outputContent += `</project_structure>`;

  fs.writeFileSync(outputFile, outputContent);

  console.log(
    kleur.green(`✅ Project exported successfully to ${kleur.bold(outputFile)}`)
  );
}

module.exports = { handleExport };
