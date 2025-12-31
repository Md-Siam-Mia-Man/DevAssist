const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
function handleCommit(options) {
  try {
    try {
      execSync("git --version", { stdio: "ignore" });
    } catch (e) {
      console.error(
        kleur.red("❌ Error: git is not installed or not in the PATH."),
      );
      process.exit(1);
    }
    const diffOutput = execSync("git diff --staged --name-only", {
      encoding: "utf8",
    });
    if (!diffOutput.trim()) {
      console.log(
        kleur.yellow(
          "⚠️  No staged changes found. Please stage your changes with `git add` first.",
        ),
      );
      return;
    }
    let context =
      "# CONTEXT: Generate a conventional commit message for the following changes.\n\n";
    if (options.full) {
      context += "## Full File Contents (Before and After)\n\n";
      const changedFiles = diffOutput.trim().split("\n");
      changedFiles.forEach((file) => {
        const newContent = fs
          .readFileSync(path.resolve(process.cwd(), file), "utf8")
          .replace(/`/g, "\\`");
        let oldContent = "";
        let isNewFile = false;
        try {
          const gitFile = file.replace(/\\/g, "/");
          oldContent = execSync(`git show HEAD:"${gitFile}"`, {
            encoding: "utf8",
            stdio: "pipe",
          }).replace(/`/g, "\\`");
        } catch (e) {
          isNewFile = true;
        }
        if (isNewFile) {
          context += `### ${file} (New File)\n\n`;
          context += "#### BEFORE:\n```\n(This is a new file)\n```\n";
        } else {
          context += `### ${file} (Modified)\n\n`;
          context += "#### BEFORE:\n```\n" + oldContent + "\n```\n";
        }
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
        "\n📋 The context above is ready to be copied to your AI assistant.",
      ),
    );
    console.log(kleur.dim("─".repeat(50)));
    console.log(
      kleur.green(
        "💡 Tip: Use this context to generate a conventional commit message.",
      ),
    );
  } catch (error) {
    console.error(
      kleur.red("❌ An error occurred during commit context generation:"),
      error.message,
    );
    process.exit(1);
  }
}
module.exports = { handleCommit };
