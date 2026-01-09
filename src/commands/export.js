const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const { loadConfig } = require("../utils/config-loader");
const { listFiles, walkDir } = require("../utils/file-handler");
const { detectFramework } = require("../utils/framework-detector");
const { formatCode } = require("../utils/formatter");
const { generateMarkdownStructure } = require("../utils/structure-generator");
const { countTokens } = require("../utils/token-counter");
const { copyToClipboard } = require("../utils/clipboard");
const { scanAndRedact } = require("../utils/secret-scanner");
const { summarizeCode } = require("../utils/summarizer");
const inquirer = require("inquirer");
const { execSync } = require("child_process");

async function handleExport(options) {
  // --- Remote Repository Export ---
  if (options.repo) {
    // Validate Repo URL
    if (!/^https?:\/\/github\.com\/[\w-]+\/[\w-.]+$/.test(options.repo)) {
        console.error(kleur.red("❌ Invalid GitHub Repository URL."));
        return;
    }

    console.log(kleur.blue(`\n🚀 Cloning remote repository: ${options.repo}...`));
    const tempDir = path.join(process.cwd(), ".devassist-temp-repo");
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    try {
        execSync(`git clone ${options.repo} ${tempDir} --depth 1`, { stdio: "inherit" });
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        // Call recursively without repo option to avoid infinite loop
        // We need to adjust output path to be absolute or relative to original Cwd
        let output = options.output;
        if (!path.isAbsolute(output)) {
             output = path.join(originalCwd, output);
        }

        await handleExport({ ...options, repo: undefined, output });

        process.chdir(originalCwd);
        fs.rmSync(tempDir, { recursive: true, force: true });
        return; // Exit after processing remote repo
    } catch (error) {
        console.error(kleur.red("❌ Failed to clone or process remote repository."));
        console.error(error);
        if (fs.existsSync(tempDir)) {
             fs.rmSync(tempDir, { recursive: true, force: true });
        }
        return;
    }
  }

  // --- Interactive Mode ---
  if (options.interactive) {
      console.log(kleur.blue(`\n🔮 Interactive Mode`));
      // Basic implementation: ask for output file and maybe exclusions
      // A full file tree selection is complex for inquirer, so we'll stick to basic options for now.
      const answers = await inquirer.prompt([
          {
              type: "input",
              name: "output",
              message: "Output filename:",
              default: options.output || "Code.txt"
          },
          {
              type: "input",
              name: "only",
              message: "Include only (comma separated patterns, optional):",
              default: options.only
          },
          {
              type: "input",
              name: "exclude",
              message: "Exclude patterns (comma separated, optional):",
              default: options.exclude
          },
          {
              type: "confirm",
              name: "clipboard",
              message: "Copy to clipboard?",
              default: false
          },
          {
              type: "confirm",
              name: "tokens",
              message: "Calculate tokens?",
              default: true
          }
      ]);

      // Merge answers into options
      options = { ...options, ...answers };
      // interactive mode handled, proceed with normal flow
  }

  console.log(kleur.blue(`\n🚀 Starting project export...`));
  console.log(kleur.dim("─".repeat(40)));
  const config = loadConfig();
  const projectDir = process.cwd();
  const outputFile = path.resolve(projectDir, options.output);

  console.log(kleur.cyan(`🔍 Detecting framework...`));
  const framework = options.framework || detectFramework();
  if (framework !== "Unknown") {
    console.log(kleur.cyan(`✨ Detected Framework: ${kleur.bold(framework)}`));
  } else {
    console.log(kleur.gray(`❔ Framework not detected (using generic settings)`));
  }

  config.ignoreFiles.push(path.basename(outputFile));
  const collectedFiles = [];
  let includePatterns = null;

  if (options.only) {
    includePatterns = [];
    const rawPatterns = options.only.split(",");
    for (const p of rawPatterns) {
      const trimmed = p.trim();
      const absPath = path.join(projectDir, trimmed);
      if (fs.existsSync(absPath)) {
        includePatterns.push(absPath);
      } else {
        console.log(
          kleur.yellow(`⚠️  Warning: Included path not found: ${trimmed} (Ignoring)`),
        );
      }
    }
  }

  let excludePatterns = [];
  if (options.exclude) {
    const rawPatterns = options.exclude.split(",");
    for (const p of rawPatterns) {
       const trimmed = p.trim();
       // For exclude, we don't necessarily need to check existence,
       // but strictly speaking, if it doesn't exist, excluding it is redundant.
       // However, often excludes are patterns (globs) in other tools.
       // Here it seems they are paths. Let's resolve them.
       // The original code resolved them to absolute paths.
       excludePatterns.push(path.join(projectDir, trimmed));
    }
  }

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

      // Secrets Redaction
      content = scanAndRedact(content, relativePath, true);

      // Summarization
      if (options.summary) {
          const ext = path.extname(filePath);
          content = summarizeCode(content, ext);
      } else {
          content = formatCode(content, filePath);
      }

      collectedFiles.push({ relativePath, content });
    },
    projectDir,
    useGitIgnore,
  );

  console.log(kleur.blue(`📦 processing ${collectedFiles.length} files...`));

  let outputContent = "";

  // Template Support
  if (options.template) {
      if (options.template === "refactor") {
          outputContent += "Please refactor the following code to improve quality and performance:\n\n";
      } else if (options.template === "test") {
          outputContent += "Write Jest unit tests for the following code, covering edge cases:\n\n";
      } else {
          outputContent += `${options.template}\n\n`;
      }
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

  // Token Counting
  if (options.tokens) {
      const count = countTokens(outputContent);
      console.log(kleur.magenta(`🧠 Estimated Tokens: ${count}`));
  }

  // Clipboard
  if (options.clipboard) {
      await copyToClipboard(outputContent);
  }

  console.log("");
}
module.exports = { handleExport };
