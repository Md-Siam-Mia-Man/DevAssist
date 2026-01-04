const clipboardy = require("clipboardy");
const kleur = require("kleur");

/**
 * Copies text to the system clipboard.
 * @param {string} text - The text to copy.
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  try {
    await clipboardy.write(text);
    console.log(kleur.green("✔ Output copied to clipboard!"));
  } catch (error) {
    console.error(kleur.yellow("⚠ Failed to copy to clipboard."));
    // console.error(error); // Optional: debug info
  }
}

module.exports = { copyToClipboard };
