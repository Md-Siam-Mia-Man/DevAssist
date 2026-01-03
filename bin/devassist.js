#!/usr/bin/env node

const { Command } = require("commander");
const kleur = require("kleur");
const packageJson = require("../package.json");
const { handleExport } = require("../src/commands/export");
const { handleChunk } = require("../src/commands/chunk");
const { handleDiff } = require("../src/commands/diff");
const { handleError } = require("../src/commands/error");
const { handleCommit } = require("../src/commands/commit");
const { handleRemoveComments } = require("../src/commands/remove-comments");
const { handleWatch } = require("../src/commands/watch");

const program = new Command();

program
  .name("devassist")
  .version(packageJson.version)
  .description(
    kleur.cyan().bold("A toolkit to bridge developer workflows with AI."),
  );

// --- EXPORT Command ---
program
  .command("export [url]")
  .description(
    "📦 Export project structure and file contents into a single file for AI context.",
  )
  .option("-o, --output <file>", "Specify the output file name", "Code.txt")
  .option(
    "--only <patterns>",
    "Comma-separated list of files/dirs to include (e.g., 'src,package.json')",
  )
  .option(
    "--exclude <patterns>",
    "Comma-separated list of files/dirs to exclude (e.g., 'tests,dist')",
  )
  .option(
    "--framework <name>",
    "Manually specify the project's framework (e.g., 'React', 'Django')",
  )
  .option("--no-structure", "Do not export the project structure")
  .option("--gitignore", "Use .gitignore patterns to exclude files", false)
  .option("-t, --tokens", "Show estimated token count and cost")
  .option("-c, --clipboard", "Copy the output to the system clipboard")
  .option("-i, --interactive", "Select files interactively")
  .option("-s, --summary", "Summarize code (reduce functions/methods to signatures)")
  .option("--template <text>", "Prepend a prompt template/instruction")
  .option("--no-redact", "Disable automatic secret redaction")
  .action((url, options) => {
      // If url is not passed, it might be undefined or part of options if commander behaves oddly with optional args
      // But typically for optional args:
      // devassist export -> url=undefined, options={...}
      // devassist export http://... -> url="http://...", options={...}
      if (typeof url === 'object') {
          options = url;
          url = undefined;
      } else if (url) {
          options.url = url;
      }
      handleExport(options);
  });

// --- CHUNK Command ---
program
  .command("chunk <file>")
  .description("🔪 Split a large file into smaller, AI-friendly chunks.")
  .option("-l, --max-lines <number>", "Maximum number of lines per chunk", 150)
  .option("-o, --output <file>", "Specify an output file to save the chunks")
  .action(handleChunk);

// --- DIFF Command ---
program
  .command("diff <file> [commit]")
  .description(
    "⚡ Show a git-style diff of a file against a specific commit (default: HEAD).",
  )
  .option("-c, --clipboard", "Copy output to clipboard")
  .action(handleDiff);

// --- ERROR Command ---
program
  .command("error <logfile>")
  .description("🐛 Extract an error and its code context from a log file.")
  .option(
    "-c, --context <number>",
    "Number of lines of code to show around the error line",
    10,
  )
  .option("--clipboard", "Copy output to clipboard")
  .action(handleError);

// --- COMMIT Command ---
program
  .command("commit")
  .description(
    "📝 Generate a context bundle of staged git changes for an AI to write a commit message.",
  )
  .option(
    "--full",
    "Include full file content for more context, not just the diff.",
  )
  .action(handleCommit);

// --- REMOVE COMMENTS Command ---
program
  .command("remove-comments [files...]")
  .alias("rc")
  .description(
    "🧹 Remove all comments from files (supports any language/framework).",
  )
  .option("-i, --include <glob>", "Glob pattern to include files (comma-separated)")
  .option("-e, --exclude <glob>", "Glob pattern to exclude files (comma-separated)")
  .option("-d, --dry-run", "Show what files would be cleaned without modifying them")
  .option("-p, --preserve-protected", "Preserve protected comments (beginning with !)")
  .action(handleRemoveComments);

// --- WATCH Command ---
program
  .command("watch")
  .description("👀 Watch for changes and auto-export the project.")
  .option("-o, --output <file>", "Specify the output file name", "Code.txt")
  .option(
    "--only <patterns>",
    "Comma-separated list of files/dirs to include (e.g., 'src,package.json')",
  )
  .option(
    "--exclude <patterns>",
    "Comma-separated list of files/dirs to exclude (e.g., 'tests,dist')",
  )
  .option("--no-structure", "Do not export the project structure")
  .option("--gitignore", "Use .gitignore patterns to exclude files", false)
  .option("-t, --tokens", "Show estimated token count")
  .option("-c, --clipboard", "Copy the output to the system clipboard on every update")
  .action(handleWatch);

program.parse(process.argv);
