const fs = require("fs");
const path = require("path");

const defaultConfig = {
  includeExt: [
    ".html",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".py",
    ".md",
    ".sh",
    ".yml",
    ".yaml",
  ],
  ignoreDirs: ["node_modules", ".git", ".vscode", "dist", "build"],
  ignoreFiles: ["package-lock.json", "yarn.lock", "npm-debug.log"],
};

function loadConfig() {
  const configPath = path.join(process.cwd(), ".aiconfig.json");
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      // Merge user config with default, user config takes precedence
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
