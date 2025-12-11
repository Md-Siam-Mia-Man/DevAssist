const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { drawTree, walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");

async function handleExport(options) {
  console.log(kleur.yellow("Starting project export..."));

  const config = loadConfig();
  const projectDir = process.cwd();
  const outputFile = path.resolve(projectDir, options.output);
  const framework = options.framework || detectFramework();

  config.ignoreFiles.push(path.basename(outputFile));

  const collectedFiles = [];
  let includePatterns = options.only
    ? options.only.split(",").map((p) => path.join(projectDir, p.trim()))
    : null;
  let excludePatterns = options.exclude
    ? options.exclude.split(",").map((p) => path.join(projectDir, p.trim()))
    : [];

  await walkDir(projectDir, config, (filePath) => {
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
    const content = fs.readFileSync(filePath, "utf8");
    collectedFiles.push({ relativePath, content });
  });

  let outputContent = `# Project Export: ${path.basename(projectDir)}\n\n`;

  if (framework !== "Unknown") {
    outputContent += `## Project Framework\n\n`;
    outputContent += `The primary detected framework for this project is: **${framework}**\n\n`;
  }

  const tree = `/${path.basename(projectDir)}\n${drawTree(
    projectDir,
    config,
    "",
    includePatterns
  )}`;
  outputContent += "## Project Structure\n\n";
  outputContent += "```plaintext\n";
  outputContent += `${tree}\n`;
  outputContent += "```\n\n";

  outputContent += "## File Contents\n\n";
  collectedFiles.forEach(({ relativePath, content }) => {
    outputContent += `### ${relativePath}\n\n`;
    outputContent += "```" + `${path.extname(relativePath).substring(1)}\n`;
    outputContent += content;
    outputContent += "\n```\n\n";
  });

  fs.writeFileSync(outputFile, outputContent);

  console.log(
    kleur.green(`✅ Project exported successfully to ${kleur.bold(outputFile)}`)
  );
}

module.exports = { handleExport };
