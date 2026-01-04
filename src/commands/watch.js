const fs = require("fs");
const path = require("path");
const kleur = require("kleur");
const chokidar = require("chokidar");
const { handleExport } = require("./export");

/**
 * Handles the watch command.
 * @param {Object} options - Command options.
 */
async function handleWatch(options) {
  const output = options.output || "context.md";
  const projectDir = process.cwd();

  console.log(kleur.blue(`\n👀 Starting watch mode...`));
  console.log(kleur.dim(`Watching for changes in ${projectDir}`));
  console.log(kleur.dim(`Output will be updated to ${output}`));

  let isUpdating = false;
  let updateTimeout = null;

  const update = () => {
      if (isUpdating) return;
      isUpdating = true;

      // Clear any pending update
      if (updateTimeout) clearTimeout(updateTimeout);

      // Debounce slightly more to batch quick changes
      updateTimeout = setTimeout(async () => {
        try {
            console.log(kleur.yellow("\n🔄 Changes detected. Updating export..."));
            // We pass the same options to handleExport, but we need to make sure we don't trigger recursive loops
            // if the output file is inside the watched directory.
            // handleExport already adds output file to ignore list in memory, but chokidar needs to ignore it too.

            await handleExport({ ...options, output });
        } catch (err) {
            console.error(kleur.red("❌ Error updating export:"), err);
        } finally {
            isUpdating = false;
            console.log(kleur.blue(`👀 Watching for changes...`));
        }
      }, 500);
  };

  const watcher = chokidar.watch(projectDir, {
    ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        "**/node_modules/**",
        output, // Ignore the output file itself
        "**/.git/**"
    ],
    persistent: true,
    ignoreInitial: true
  });

  watcher
    .on('add', update)
    .on('change', update)
    .on('unlink', update);

  // Run initial export
  await handleExport({ ...options, output });
  console.log(kleur.blue(`👀 Watching for changes...`));
}

module.exports = { handleWatch };
