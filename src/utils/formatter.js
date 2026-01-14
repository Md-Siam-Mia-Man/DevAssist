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
    case "vue":
    case "svelte":
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

function stripHtmlEmbedded(content, options) {
  // First strip HTML comments
  let stripped = strip(content, {
    language: "html",
    keepProtected: options.preserveProtected,
  });

  // Now try to strip JS inside <script> tags
  // This is a simple regex approach and might be fragile, but better than nothing.
  // We match content between <script...> and </script>
  stripped = stripped.replace(
    /(<script[^>]*>)([\s\S]*?)(<\/script>)/gi,
    (match, open, scriptContent, close) => {
      // If the script tag has a type that is not JS, we might want to skip, but standard is JS.
      try {
        const cleanScript = strip(scriptContent, {
          language: "javascript",
          keepProtected: options.preserveProtected,
        });
        return open + cleanScript + close;
      } catch (e) {
        return match;
      }
    },
  );

  // Also style tags?
  stripped = stripped.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (match, open, styleContent, close) => {
      try {
        const cleanStyle = strip(styleContent, {
          language: "css",
          keepProtected: options.preserveProtected,
        });
        return open + cleanStyle + close;
      } catch (e) {
        return match;
      }
    },
  );

  return stripped;
}

function formatCode(content, filePath, options = {}) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const language = getLanguage(ext);

  // Default options
  const stripOptions = {
    keepProtected: options.preserveProtected || false,
    language: language,
  };

  let formatted = content;
  if (language) {
    try {
      if (language === "html") {
        formatted = stripHtmlEmbedded(content, options);
      } else {
        formatted = strip(content, stripOptions);
      }
    } catch (e) {
      // If stripping fails, return original content
    }
  }

  // Remove empty lines if requested (default to true usually, but previous implementation did it always)
  // The user wants "clean up", so removing excessive empty lines is good.
  // The regex used previously was `^\s*[\r\n]`.
  formatted = formatted.replace(/^\s*[\r\n]/gm, "");

  return formatted.trim();
}

module.exports = { formatCode };
