const fs = require("fs");
const path = require("path");

const defaultConfig = {
  includeExt: [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
    ".scss",
    ".json",
    ".md",
    ".py",
    ".rb",
    ".java",
    ".kt",
    ".cs",
    ".php",
    ".go",
    ".rs",
    ".swift",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".sh",
    ".bash",
    ".yml",
    ".yaml",
    ".sql",
    ".xml",
    ".toml",
    ".lua",
    ".pl",
    ".dart",
    ".ex",
    ".exs",
    ".r",
    ".scala",
    "Dockerfile",
  ],
  ignoreDirs: [
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    "coverage",
    ".next",
    ".idea",
    "venv",
  ],
  ignoreFiles: [
    "package-lock.json",
    "yarn.lock",
    "npm-debug.log",
    ".DS_Store",
    ".env",
    ".env.local",
  ],
};

function loadConfig() {
  const configPath = path.join(process.cwd(), ".aiconfig.json");
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return {
        includeExt: userConfig.includeExt || defaultConfig.includeExt,
        ignoreDirs: [
          ...new Set([
            ...defaultConfig.ignoreDirs,
            ...(userConfig.ignoreDirs || []),
          ]),
        ],
        ignoreFiles: [
          ...new Set([
            ...defaultConfig.ignoreFiles,
            ...(userConfig.ignoreFiles || []),
          ]),
        ],
      };
    } catch (error) {
      console.error("Error reading or parsing .aiconfig.json:", error);
      return defaultConfig;
    }
  }
  return defaultConfig;
}

module.exports = { loadConfig };
