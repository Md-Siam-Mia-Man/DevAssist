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

const program = new Command();

program
  .name("devassist")
  .version(packageJson.version)
  .description(
    kleur.cyan().bold("A toolkit to bridge developer workflows with AI."),
  );

// --- EXPORT Command ---
program
  .command("export")
  .description(
    "Export project structure and file contents into a single file for AI context.",
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
  .action(handleExport);

// --- CHUNK Command ---
program
  .command("chunk <file>")
  .description("Split a large file into smaller, AI-friendly chunks.")
  .option("-l, --max-lines <number>", "Maximum number of lines per chunk", 150)
  .option("-o, --output <file>", "Specify an output file to save the chunks")
  .action(handleChunk);

// --- DIFF Command ---
program
  .command("diff <file> [commit]")
  .description(
    "Show a git-style diff of a file against a specific commit (default: HEAD).",
  )
  .action(handleDiff);

// --- ERROR Command ---
program
  .command("error <logfile>")
  .description("Extract an error and its code context from a log file.")
  .option(
    "-c, --context <number>",
    "Number of lines of code to show around the error line",
    10,
  )
  .action(handleError);

// --- COMMIT Command ---
program
  .command("commit")
  .description(
    "Generate a context bundle of staged git changes for an AI to write a commit message.",
  )
  .option(
    "--full",
    "Include full file content for more context, not just the diff.",
  )
  .action(handleCommit);

// --- REMOVE COMMENTS Command ---
program
  .command("remove-comments [pattern]")
  .alias("rc")
  .description(
    "Remove all comments from files (supports any language/framework).",
  )
  .action(handleRemoveComments);

program.parse(process.argv);
