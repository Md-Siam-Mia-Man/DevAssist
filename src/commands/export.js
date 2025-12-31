const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { listFiles, walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");
const { formatCode } = require("../utils/formatter");
const { generateMarkdownStructure } = require("../utils/structure-generator");

async function handleExport(options) {
  console.log(kleur.blue(`\n🚀 Starting project export...`));
  console.log(kleur.dim("─".repeat(40)));

  const config = loadConfig();
  const projectDir = process.cwd();
  const outputFile = path.resolve(projectDir, options.output);
  const framework = options.framework || detectFramework();

  if (framework !== "Unknown") {
      console.log(kleur.cyan(`ℹ️  Detected Framework: ${kleur.bold(framework)}`));
  }

  // Add output file to ignore list to avoid self-inclusion
  config.ignoreFiles.push(path.basename(outputFile));

  const collectedFiles = [];
  let includePatterns = options.only
    ? options.only.split(",").map((p) => path.join(projectDir, p.trim()))
    : null;
  let excludePatterns = options.exclude
    ? options.exclude.split(",").map((p) => path.join(projectDir, p.trim()))
    : [];

  // Use gitignore if requested (new CLI arg needed in bin/devassist.js or passed via options)
  // Assuming options.gitignore is passed (boolean)
  const useGitIgnore = options.gitignore === true;

  await walkDir(projectDir, config, (filePath) => {
    // Manual include/exclude patterns from CLI
    if (
      includePatterns &&
      !includePatterns.some((p) => filePath === p || filePath.startsWith(p + path.sep))
    ) {
      return;
    }
    if (excludePatterns.some((p) => filePath === p || filePath.startsWith(p + path.sep))) {
      return;
    }

    const relativePath = path.relative(projectDir, filePath);
    let content = fs.readFileSync(filePath, "utf8");

    // Format content
    content = formatCode(content, filePath);

    collectedFiles.push({ relativePath, content });
  }, projectDir, useGitIgnore);

  let outputContent = `# Project Export: ${path.basename(projectDir)}\n\n`;

  if (framework !== "Unknown") {
    outputContent += `## Project Framework\n\n`;
    outputContent += `The primary detected framework for this project is: **${framework}**\n\n`;
  }

  // Project Structure
  if (options.structure !== false) { // Default is true usually, unless --no-structure
      // We need to list files again to get the full structure (walkDir only processes included files)
      // Actually, listFiles also filters by ignore/include.
      // If we want structure of *exported* files, we can use collectedFiles.
      // If we want structure of *project*, we might want to list everything including those not matched by extension but not ignored?
      // Usually "Project Structure" implies the context of the files provided.
      // Let's use the collectedFiles for structure to be consistent with what's being exported.

      const filePaths = collectedFiles.map(f => path.join(projectDir, f.relativePath));
      const markdownStructure = generateMarkdownStructure(filePaths, projectDir);

      outputContent += "## Project Structure\n\n";
      outputContent += markdownStructure + "\n\n";
  }

  collectedFiles.forEach(({ relativePath, content }) => {
    outputContent += `## File: ${relativePath}\n`;
    const ext = path.extname(relativePath).slice(1);
    outputContent += "```" + (ext || "") + "\n";
    outputContent += content + "\n";
    outputContent += "```\n\n";
  });

  fs.writeFileSync(outputFile, outputContent);

  console.log(kleur.dim("─".repeat(40)));
  console.log(
    kleur.green(`✅ Project exported successfully!`)
  );
  console.log(`📁 Output: ${kleur.bold().underline(outputFile)}`);
  console.log(`📊 Stats:  ${collectedFiles.length} files included.`);
  console.log("");
}

module.exports = { handleExport };
