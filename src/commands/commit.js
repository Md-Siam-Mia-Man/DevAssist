const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const kleur = require("kleur");

function handleCommit(options) {
  try {
    const diffOutput = execSync("git diff --staged --name-only", {
      encoding: "utf8",
    });
    if (!diffOutput.trim()) {
      console.log(
        kleur.yellow(
          "No staged changes found. Please stage your changes with `git add` first."
        )
      );
      return;
    }

    let context =
      "# CONTEXT: Generate a conventional commit message for the following changes.\n\n";

    if (options.full) {
      context += "## Full File Contents (Before and After)\n\n";
      const changedFiles = diffOutput.trim().split("\n");
      changedFiles.forEach((file) => {
        let oldContent = ""; // Default to empty string for new files
        try {
          // This will fail for new files, which is what we want.
          oldContent = execSync(`git show HEAD:"${file}"`, {
            encoding: "utf8",
            stdio: "pipe",
          }).replace(/`/g, "\\`");
        } catch (e) {
          // This is a new file, so oldContent remains empty. That's correct.
        }

        const newContent = fs
          .readFileSync(path.resolve(process.cwd(), file), "utf8")
          .replace(/`/g, "\\`");

        context += `### ${file} (New File)\n\n`;
        context += "#### BEFORE:\n```\n(This is a new file)\n```\n";
        context += "#### AFTER:\n```\n" + newContent + "\n```\n---\n";
      });
    } else {
      const stagedDiff = execSync("git diff --staged", { encoding: "utf8" });
      context += "## Git Diff\n";
      context += "```diff\n" + stagedDiff + "\n```\n";
    }

    context += "\n# COMMIT MESSAGE (provide only the commit message):\n";

    console.log(context);
    console.log(
      kleur.cyan(
        "\n📋 Above context is ready to be copied to an AI assistant to generate a commit message."
      )
    );
  } catch (error) {
    console.error(
      kleur.red("An error occurred during commit context generation:"),
      error.message
    );
    process.exit(1);
  }
}

module.exports = { handleCommit };
