const strip = require("strip-comments");
const path = require("path");
function getLanguage(ext) {
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "c":
    case "cpp":
    case "cs":
    case "java":
    case "swift":
    case "go":
    case "kt":
    case "rs":
    case "scala":
      return "javascript";
    case "py":
    case "rb":
    case "pl":
    case "sh":
    case "yaml":
    case "yml":
    case "dockerfile":
      return "python";
    case "html":
    case "xml":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "php":
      return "php";
    case "sql":
      return "sql";
    default:
      return null;
  }
}
function formatCode(content, filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const language = getLanguage(ext);
  let formatted = content;
  if (language) {
    try {
      formatted = strip(content, { language });
    } catch (e) {}
  }
  formatted = formatted.replace(/^\s*[\r\n]/gm, "");
  return formatted.trim();
}
module.exports = { formatCode };
