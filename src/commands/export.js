const fs = require("fs");
const path = require("path");
const os = require("os");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { listFiles, walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");
const inquirer = require("inquirer");
const { formatCode } = require("../utils/formatter");
const { generateMarkdownStructure } = require("../utils/structure-generator");
const { countTokens } = require("../utils/token-counter");
const { scanForSecrets, redactSecrets } = require("../utils/secret-scanner");
const { copyToClipboard } = require("../utils/clipboard");
const { summarizeContent } = require("../utils/summarizer");
const { execSync } = require("child_process");

async function handleExport(options) {
  console.log(kleur.blue(`\n🚀 Starting project export...`));
  console.log(kleur.dim("─".repeat(40)));

  let projectDir = process.cwd();
  let tempDir = null;

  // Remote Repository Handling
  if (options.url) {
      console.log(kleur.blue(`🌐 Detected remote repository URL. Cloning...`));
      try {
          tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "devassist-"));
          execSync(`git clone ${options.url} .`, { cwd: tempDir, stdio: 'ignore' });
          projectDir = tempDir;
          console.log(kleur.green(`✅ Cloned to temporary directory.`));
      } catch (e) {
          console.error(kleur.red(`❌ Failed to clone repository: ${e.message}`));
          return;
      }
  }

  const config = loadConfig();
  const outputFile = path.resolve(process.cwd(), options.output);

  console.log(kleur.cyan(`🔍 Detecting framework...`));
  const framework = options.framework || detectFramework();
  if (framework !== "Unknown") {
    console.log(kleur.cyan(`✨ Detected Framework: ${kleur.bold(framework)}`));
  } else {
    console.log(kleur.gray(`❔ Framework not detected (using generic settings)`));
  }

  config.ignoreFiles.push(path.basename(outputFile));

  let includePatterns = options.only
    ? options.only.split(",").map((p) => path.join(projectDir, p.trim()))
    : null;

  // Interactive Mode
  if (options.interactive) {
     console.log(kleur.blue(`🔮 Interactive mode: Select files to include.`));
     const allFiles = listFiles(projectDir, config, projectDir, null, options.gitignore === true);

     if (allFiles.length === 0) {
         console.log(kleur.yellow("⚠️  No files found to select from."));
         return;
     }

     const { selectedFiles } = await inquirer.prompt([
       {
         type: 'checkbox',
         name: 'selectedFiles',
         message: 'Select files to include in the export:',
         choices: allFiles,
         pageSize: 20
       }
     ]);

     if (selectedFiles.length === 0) {
         console.log(kleur.yellow("⚠️  No files selected. Exiting."));
         return;
     }

     includePatterns = selectedFiles.map(p => path.join(projectDir, p));
  }

  const collectedFiles = [];
  let excludePatterns = options.exclude
    ? options.exclude.split(",").map((p) => path.join(projectDir, p.trim()))
    : [];
  const useGitIgnore = options.gitignore === true;
  console.log(kleur.blue(`📂 Scanning files...`));

  await walkDir(
    projectDir,
    config,
    (filePath) => {
      if (
        includePatterns &&
        !includePatterns.some(
          (p) => filePath === p || filePath.startsWith(p + path.sep),
        )
      ) {
        return;
      }
      if (
        excludePatterns.some(
          (p) => filePath === p || filePath.startsWith(p + path.sep),
        )
      ) {
        return;
      }
      const relativePath = path.relative(projectDir, filePath);
      let content = fs.readFileSync(filePath, "utf8");

      // Secret Scanning
      const secrets = scanForSecrets(content, filePath);
      if (secrets.length > 0) {
        console.log(kleur.yellow(`⚠️  Potential secret detected in ${relativePath}: ${secrets.join(", ")}`));
        if (!options.noRedact) {
             content = redactSecrets(content);
             console.log(kleur.dim(`   (Redacted automatically)`));
        }
      }

      content = formatCode(content, filePath);

      if (options.summary) {
          content = summarizeContent(content, relativePath);
      }

      collectedFiles.push({ relativePath, content });
    },
    projectDir,
    useGitIgnore,
  );

  console.log(kleur.blue(`📦 processing ${collectedFiles.length} files...`));

  let outputContent = "";
  if (options.template) {
      outputContent += `${options.template}\n\n`;
      outputContent += `--- \n\n`;
  }

  outputContent += `# Project Export: ${path.basename(projectDir)}\n\n`;
  if (framework !== "Unknown") {
    outputContent += `## Project Framework\n\n`;
    outputContent += `The primary detected framework for this project is: **${framework}**\n\n`;
  }
  if (options.structure !== false) {
    const filePaths = collectedFiles.map((f) =>
      path.join(projectDir, f.relativePath),
    );
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
  console.log(kleur.green(`✅ Project exported successfully!`));
  console.log(`📁 Output: ${kleur.bold().underline(outputFile)}`);
  console.log(`📊 Stats:  ${collectedFiles.length} files included.`);

  if (options.tokens) {
      const tokens = countTokens(outputContent);
      console.log(`🧠 Tokens: ${kleur.bold(tokens.toLocaleString())} (approx. cost: $${((tokens / 1000) * 0.03).toFixed(4)})`);
  }

  if (options.clipboard) {
      await copyToClipboard(outputContent);
  }

  if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(kleur.dim(`🧹 Cleaned up temporary files.`));
  }

  console.log("");
}
module.exports = { handleExport };
