const kleur = require("kleur");

// Common patterns for secrets
const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "AWS Secret Key", regex: /(aws|amazon).*?_?key.*?['"]?[=:].*?['"]?[a-zA-Z0-9\/+=]{40}/gi },
  { name: "Generic API Key", regex: /api[_-]?key.*?['"]?[:=].*?['"]?[a-zA-Z0-9\-_]{20,}/gi },
  { name: "Private Key", regex: /-----BEGIN PRIVATE KEY-----/g },
  { name: "GitHub Token", regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g },
  { name: "Slack Token", regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/g },
  { name: "Stripe Key", regex: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24}/g },
];

/**
 * Scans content for secrets and optionally redacts them.
 * @param {string} content - The content to scan.
 * @param {string} filepath - The filepath (for logging).
 * @param {boolean} redact - Whether to redact the secrets.
 * @returns {string} The content (possibly redacted).
 */
function scanAndRedact(content, filepath, redact = true) {
  let modifiedContent = content;
  let foundSecrets = false;

  SECRET_PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(modifiedContent)) {
      foundSecrets = true;
      if (redact) {
        console.warn(
          kleur.yellow(`⚠ Potential ${pattern.name} found in ${filepath}. Redacting...`)
        );
        modifiedContent = modifiedContent.replace(pattern.regex, "[REDACTED SECRET]");
      } else {
         console.warn(
          kleur.yellow(`⚠ Potential ${pattern.name} found in ${filepath}.`)
        );
      }
    }
  });

  return modifiedContent;
}

module.exports = { scanAndRedact };
