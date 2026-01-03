const kleur = require("kleur");

async function copyToClipboard(text) {
  try {
    const { default: clipboardy } = await import("clipboardy");
    await clipboardy.write(text);
    console.log(kleur.green("📋 Output copied to clipboard!"));
    return true;
  } catch (error) {
    console.warn(kleur.yellow("⚠️  Clipboard not supported or failed in this environment."));
    // console.error(error); // Optional debug
    return false;
  }
}

module.exports = { copyToClipboard };
