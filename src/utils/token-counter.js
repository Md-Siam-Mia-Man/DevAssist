const { encodingForModel } = require("js-tiktoken");

/**
 * Counts the number of tokens in a given text using cl100k_base encoding (GPT-4/GPT-3.5).
 * @param {string} text - The text to count tokens for.
 * @returns {number} The estimated token count.
 */
function countTokens(text) {
  try {
    const enc = encodingForModel("gpt-4");
    const tokens = enc.encode(text);
    // freeing the encoder instance is not strictly necessary in js-tiktoken as it's pure JS,
    // but good practice if using wasm binding. js-tiktoken is pure JS.
    return tokens.length;
  } catch (error) {
    console.warn("Failed to count tokens:", error.message);
    return 0;
  }
}

module.exports = { countTokens };
