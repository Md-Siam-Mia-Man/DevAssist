const chokidar = require("chokidar");
const kleur = require("kleur");
const path = require("path");
const { handleExport } = require("./export");
const ora = require("ora");

async function handleWatch(options) {
  console.log(kleur.blue(`\n👀 Starting Watch Mode...`));
  console.log(kleur.dim("─".repeat(40)));

  const projectDir = process.cwd();

  // Initial export
  await handleExport(options);

  const spinner = ora('Watching for changes...').start();

  const watcher = chokidar.watch(projectDir, {
    ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        "**/node_modules/**",
        path.resolve(projectDir, options.output), // ignore output file
        "**/.git/**"
    ],
    persistent: true,
    ignoreInitial: true
  });

  let debounceTimer;

  watcher.on('all', (event, path) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        spinner.stop();
        console.log(kleur.yellow(`\n🔄 Change detected (${event}). Re-exporting...`));
        try {
            await handleExport(options);
        } catch (error) {
            console.error(kleur.red("❌ Export failed:"), error);
        }
        spinner.start('Watching for changes...');
    }, 1000); // 1 second debounce
  });

  process.on('SIGINT', () => {
      spinner.stop();
      console.log(kleur.blue("\n👋 Stopped watching."));
      process.exit();
  });
}

module.exports = { handleWatch };
