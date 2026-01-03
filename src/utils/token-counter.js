const { getEncoding } = require("js-tiktoken");

const enc = getEncoding("cl100k_base"); // GPT-4 tokenizer

function countTokens(text) {
  try {
    const tokens = enc.encode(text);
    return tokens.length;
  } catch (error) {
    console.warn("⚠️ Warning: Failed to count tokens.", error.message);
    return 0;
  }
}

module.exports = { countTokens };
