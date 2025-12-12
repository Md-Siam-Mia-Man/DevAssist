const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { listFiles, walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");

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

  const fileList = listFiles(projectDir, config, projectDir, includePatterns);

  outputContent += "<project_structure>\n";
  outputContent += fileList.join("\n") + "\n";
  outputContent += "</project_structure>\n\n";

  outputContent += "<files>\n";
  collectedFiles.forEach(({ relativePath, content }) => {
    outputContent += `<file path="${relativePath}">\n`;
    outputContent += content + "\n";
    outputContent += "</file>\n\n";
  });
  outputContent += "</files>\n";

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
