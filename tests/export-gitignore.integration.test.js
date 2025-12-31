const fs = require("fs");
const path = require("path");
const { walkDir } = require("../src/utils/file-handler");
describe("export command - gitignore integration test", () => {
  const tmpDir = path.join(__dirname, ".tmp-test-gitignore");
  beforeEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "node_modules"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "dist"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "app.js"), 'console.log("app");');
    fs.writeFileSync(
      path.join(tmpDir, "src", "test.js"),
      'console.log("test");',
    );
    fs.writeFileSync(
      path.join(tmpDir, "node_modules", "lib.js"),
      'console.log("lib");',
    );
    fs.writeFileSync(
      path.join(tmpDir, "dist", "bundle.js"),
      'console.log("bundle");',
    );
    fs.writeFileSync(path.join(tmpDir, "secret.log"), "secret data");
    const gitignorePath = path.join(tmpDir, ".gitignore");
    fs.writeFileSync(gitignorePath, "node_modules/\ndist/\n*.log\n");
  });
  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
  it("should respect gitignore patterns when filtering files", async () => {
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: [".js"],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: [],
    };
    await walkDir(
      tmpDir,
      config,
      async (filePath) => {
        collectedFiles.push(path.relative(tmpDir, filePath));
      },
      tmpDir,
      true,
    );
    expect(collectedFiles).toContain("src/app.js");
    expect(collectedFiles).toContain("src/test.js");
    expect(collectedFiles).not.toContain("node_modules/lib.js");
    expect(collectedFiles).not.toContain("dist/bundle.js");
    expect(collectedFiles).not.toContain("secret.log");
  });
  it("should include gitignored files when gitignore is disabled", async () => {
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: [".js"],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: [],
    };
    await walkDir(
      tmpDir,
      config,
      async (filePath) => {
        collectedFiles.push(path.relative(tmpDir, filePath));
      },
      tmpDir,
      false,
    );
    expect(collectedFiles).toContain("src/app.js");
    expect(collectedFiles).toContain("src/test.js");
    expect(collectedFiles).toContain("node_modules/lib.js");
    expect(collectedFiles).toContain("dist/bundle.js");
    expect(collectedFiles).not.toContain("secret.log");
  });
  it("should correctly handle directory patterns in gitignore", async () => {
    const nestedDir = path.join(tmpDir, "node_modules", "package", "lib");
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(
      path.join(nestedDir, "index.js"),
      'console.log("nested");',
    );
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: [".js"],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: [],
    };
    await walkDir(
      tmpDir,
      config,
      async (filePath) => {
        collectedFiles.push(path.relative(tmpDir, filePath));
      },
      tmpDir,
      true,
    );
    expect(collectedFiles).not.toContain("node_modules/package/lib/index.js");
  });
  it("should correctly handle wildcard patterns in gitignore", async () => {
    fs.writeFileSync(path.join(tmpDir, "app.log"), "log data");
    fs.writeFileSync(path.join(tmpDir, "src", "debug.log"), "debug log");
    fs.writeFileSync(path.join(tmpDir, "config.js"), "module.exports = {};");
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: [".js", ".log"],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: [],
    };
    await walkDir(
      tmpDir,
      config,
      async (filePath) => {
        collectedFiles.push(path.relative(tmpDir, filePath));
      },
      tmpDir,
      true,
    );
    expect(collectedFiles).not.toContain("app.log");
    expect(collectedFiles).not.toContain("src/debug.log");
    expect(collectedFiles).not.toContain("secret.log");
    expect(collectedFiles).toContain("config.js");
    expect(collectedFiles).toContain("src/app.js");
  });
});
