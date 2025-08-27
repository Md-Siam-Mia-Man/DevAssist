const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { drawTree, walkDir } = require("../utils/file-handler");

async function handleExport(options) {
  console.log(kleur.yellow("Starting project export..."));

  const config = loadConfig();
  const projectDir = process.cwd();
  const outputFile = path.resolve(projectDir, options.output);

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
      !includePatterns.some((p) => filePath.startsWith(p))
    ) {
      return;
    }
    if (excludePatterns.some((p) => filePath.startsWith(p))) {
      return;
    }

    const relativePath = path.relative(projectDir, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    collectedFiles.push({ relativePath, content });
  });

  fs.writeFileSync(
    outputFile,
    `# Project Export: ${path.basename(projectDir)}\n\n`
  );

  const tree = `/${path.basename(projectDir)}\n${drawTree(
    projectDir,
    config,
    "",
    includePatterns
  )}`;
  fs.appendFileSync(outputFile, "## Project Structure\n\n");
  fs.appendFileSync(outputFile, "```plaintext\n");
  fs.appendFileSync(outputFile, `${tree}\n`);
  fs.appendFileSync(outputFile, "```\n\n");

  fs.appendFileSync(outputFile, "## File Contents\n\n");
  collectedFiles.forEach(({ relativePath, content }) => {
    fs.appendFileSync(outputFile, `### ${relativePath}\n\n`);
    fs.appendFileSync(
      outputFile,
      "```" + `${path.extname(relativePath).substring(1)}\n`
    );
    fs.appendFileSync(outputFile, content);
    fs.appendFileSync(outputFile, "\n```\n\n");
  });

  console.log(
    kleur.green(`✅ Project exported successfully to ${kleur.bold(outputFile)}`)
  );
}

module.exports = { handleExport };
