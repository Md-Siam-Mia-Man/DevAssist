const fs = require("fs");
const path = require("path");
const kleur = require("kleur");

function handleError(logfile, options) {
  const logPath = path.resolve(process.cwd(), logfile);
  if (!fs.existsSync(logPath)) {
    console.error(kleur.red(`Error: Log file not found at ${logPath}`));
    process.exit(1);
  }

  const logContent = fs.readFileSync(logPath, "utf8");

  // Improved regex to capture different file extensions and formats
  // Captures: file path, line number
  // Matches: "at Object.<anonymous> (/path/to/file.js:10:15)" or "at /path/to/file.js:10:15"
  const stackTraceRegex = /(?:at\s+(?:.+?\s+\()?(.*):(\d+):(\d+)\)?)/;
  const match = logContent.match(stackTraceRegex);

  if (!match) {
    console.error(
      kleur.red(
        "Could not find a valid file path and line number in the log file."
      )
    );
    console.log(kleur.yellow("Pasting the full log for context:\n"));
    console.log(logContent);
    return;
  }

  const [, errorFile, errorLine] = match;
  const errorLineNum = parseInt(errorLine, 10);
  const contextLines = parseInt(options.context, 10);

  // Try to resolve the file path. It could be absolute, or relative to cwd, or relative to log file.
  let codeFilePath = path.resolve(errorFile);
  if (!fs.existsSync(codeFilePath)) {
    codeFilePath = path.resolve(process.cwd(), errorFile);
  }
  if (!fs.existsSync(codeFilePath)) {
    codeFilePath = path.resolve(path.dirname(logPath), errorFile);
  }

  if (!fs.existsSync(codeFilePath)) {
    console.error(
      kleur.red(
        `Code file not found: ${errorFile}. Tried resolving against CWD and log file location.`
      )
    );
    return;
  }

  const codeContent = fs.readFileSync(codeFilePath, "utf8").split("\n");
  const start = Math.max(0, errorLineNum - contextLines - 1);
  const end = Math.min(codeContent.length, errorLineNum + contextLines);

  const codeSnippet = codeContent
    .slice(start, end)
    .map((line, index) => {
      const currentLine = start + index + 1;
      if (currentLine === errorLineNum) {
        return `${kleur.red(
          `> ${currentLine.toString().padStart(4)} | ${line}`
        )}`;
      }
      return `  ${currentLine.toString().padStart(4)} | ${line}`;
    })
    .join("\n");

  let output = "## AI Error Analysis Request\n\n";
  output += "### 1. Error Log\n\n";
  output += "```\n" + logContent + "\n```\n\n";
  output += `### 2. Relevant Code from ${errorFile} (line ${errorLineNum})\n\n`;
  // Remove ANSI codes for the copyable output
  // eslint-disable-next-line no-control-regex
  const cleanCodeSnippet = codeSnippet.replace(/\u001b\[.*?m/g, "");

  output +=
    "```" +
    `${path.extname(errorFile).substring(1)}\n` +
    cleanCodeSnippet +
    "\n```\n";

  console.log(output);
  console.log(
    kleur.cyan("\n📋 Above context is ready to be copied to an AI assistant.")
  );
}

module.exports = { handleError };
