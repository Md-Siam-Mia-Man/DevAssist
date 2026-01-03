const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const diff = require("diff");
const { copyToClipboard } = require("../utils/clipboard");

async function handleDiff(file, commit = "HEAD", options) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(kleur.red(`❌ Error: File not found at ${filePath}`));
    process.exit(1);
  }
  let oldContent;
  try {
    try {
      execSync("git --version", { stdio: "ignore" });
    } catch (e) {
      console.error(
        kleur.red("❌ Error: git is not installed or not in the PATH."),
      );
      process.exit(1);
    }

    try {
      execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    } catch (e) {
      console.error(
        kleur.red("❌ Error: Not a git repository (or any of the parent directories)."),
      );
      process.exit(1);
    }

    console.log(kleur.dim(`🔍 Fetching version from commit: ${commit}...`));
    const gitFile = file.replace(/\\/g, "/");
    oldContent = execSync(`git show ${commit}:"${gitFile}"`, {
      encoding: "utf8",
    });
  } catch (error) {
    console.error(
      kleur.red(
        `❌ Error: Could not retrieve file "${file}" from commit "${commit}".`,
      ),
    );
    console.error(
      kleur.yellow(
        "💡 Tip: Is the file committed? Is the commit hash correct?",
      ),
    );
    process.exit(1);
  }
  const newContent = fs.readFileSync(filePath, "utf8");
  const changes = diff.diffLines(oldContent, newContent);
  let added = 0;
  let removed = 0;
  console.log(
    kleur.bold().blue(`\n⚡ Diff: ${file} (Commit: ${commit} ↔️  Local)\n`),
  );
  console.log(kleur.dim("─".repeat(50)));
  let diffOutputText = "";

  changes.forEach((part) => {
    const value = part.value.endsWith("\n") ? part.value : part.value + "\n";
    if (part.added) {
      added += part.count;
      const addedText = value
            .split("\n")
            .filter((l) => l)
            .map((l) => `│ ➕ ${l}`)
            .join("\n") + "\n";
      process.stdout.write(kleur.green(addedText));
      diffOutputText += addedText;
    } else if (part.removed) {
      removed += part.count;
      const removedText = value
            .split("\n")
            .filter((l) => l)
            .map((l) => `│ ➖ ${l}`)
            .join("\n") + "\n";
      process.stdout.write(kleur.red(removedText));
      diffOutputText += removedText;
    } else {
      const contextLines = value
        .split("\n")
        .filter((l) => l)
        .slice(-3);
      if (contextLines.length > 0) {
        const dimText = contextLines.map((l) => `│    ${l}`).join("\n") + "\n";
        process.stdout.write(kleur.dim(dimText));
        diffOutputText += dimText;
      }
    }
  });
  console.log(kleur.dim("─".repeat(50)));
  console.log(
    kleur.bold().green(`✅ Added: ${added} line(s)`) +
      "  " +
      kleur.bold().red(`🗑️  Removed: ${removed} line(s)`),
  );

  if (options && options.clipboard) {
      await copyToClipboard(diffOutputText);
  }

  console.log("");
}
module.exports = { handleDiff };
