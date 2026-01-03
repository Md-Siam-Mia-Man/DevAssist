const kleur = require("kleur");

const PATTERNS = [
  { name: "AWS Access Key", regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: "Private Key", regex: /-----BEGIN PRIVATE KEY-----/ },
  { name: "Google API Key", regex: /AIza[0-9A-Za-z\\-_]{35}/ },
  { name: "Slack Token", regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/ },
  { name: "Generic Secret", regex: /(?:api_key|secret|password|token)[\s=:>]{1,3}['"]?([a-zA-Z0-9\-_]{16,})['"]?/i },
];

function scanForSecrets(content, filePath) {
  const findings = [];
  PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(content)) {
      findings.push(pattern.name);
    }
  });
  return findings;
}

function redactSecrets(content) {
  let redacted = content;
  PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern.regex, (match) => {
      return `<REDACTED ${pattern.name}>`;
    });
  });
  return redacted;
}

module.exports = { scanForSecrets, redactSecrets };
