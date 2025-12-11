const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const diff = require("diff");

// This function was incorrect before. This is the correct version.
function handleDiff(file, commit = "HEAD") {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(kleur.red(`Error: File not found at ${filePath}`));
    process.exit(1);
  }

  let oldContent;
  try {
    // Check if git is installed
    try {
      execSync("git --version", { stdio: "ignore" });
    } catch (e) {
      console.error(kleur.red("Error: git is not installed or not in the PATH."));
      process.exit(1);
    }
    // Using double quotes for file path to handle spaces
    // Git expects forward slashes for paths in revision:path syntax
    const gitFile = file.replace(/\\/g, "/");
    oldContent = execSync(`git show ${commit}:"${gitFile}"`, { encoding: "utf8" });
  } catch (error) {
    console.error(
      kleur.red(
        `Error: Could not retrieve file "${file}" from commit "${commit}".`
      )
    );
    console.error(
      kleur.yellow("Is the file committed? Is the commit hash correct?")
    );
    process.exit(1);
  }

  const newContent = fs.readFileSync(filePath, "utf8");

  const changes = diff.diffLines(oldContent, newContent);
  let added = 0;
  let removed = 0;

  console.log(
    kleur.bold(`Diff for ${file} between ${commit} and current working copy:\n`)
  );

  changes.forEach((part) => {
    // Re-add the newline that diff strips for single-line changes
    const value = part.value.endsWith("\n") ? part.value : part.value + "\n";
    if (part.added) {
      added += part.count;
      process.stdout.write(
        kleur.green(
          value
            .split("\n")
            .filter((l) => l)
            .map((l) => `+ ${l}`)
            .join("\n")
        )
      );
    } else if (part.removed) {
      removed += part.count;
      process.stdout.write(
        kleur.red(
          value
            .split("\n")
            .filter((l) => l)
            .map((l) => `- ${l}`)
            .join("\n")
        )
      );
    } else {
      // Unchanged lines for context, dimmed
      const contextLines = value
        .split("\n")
        .filter((l) => l)
        .slice(-3); // show last 3 lines of context
      process.stdout.write(
        kleur.dim(contextLines.map((l) => `  ${l}`).join("\n") + "\n")
      );
    }
  });

  console.log("\n---");
  console.log(
    kleur.bold().green(`Summary: ${added} line(s) added, `) +
      kleur.bold().red(`${removed} line(s) removed.`)
  );
}

// Ensure the correct function is exported.
module.exports = { handleDiff };
