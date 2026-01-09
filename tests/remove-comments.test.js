const fs = require("fs");
const path = require("path");
const { handleRemoveComments } = require("../src/commands/remove-comments");
const { walkDir } = require("../src/utils/file-handler");
const { formatCode } = require("../src/utils/formatter");

jest.mock("fs");
jest.mock("../src/utils/file-handler");
jest.mock("../src/utils/formatter");
jest.mock("../src/utils/config-loader", () => ({
  loadConfig: jest.fn(() => ({})),
}));

describe("handleRemoveComments", () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let fsWriteSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fsWriteSpy = fs.writeFileSync;
    fs.readFileSync.mockReturnValue("some content");
    // Mock existsSync to always return true for tests unless we want to test the missing case
    // We need to support path.resolve in the implementation which calls fs.existsSync
    fs.existsSync = jest.fn().mockReturnValue(true);

    formatCode.mockReturnValue("cleaned content");
    walkDir.mockImplementation(async (dir, config, callback) => {
      callback(path.join(process.cwd(), "file1.js"));
      callback(path.join(process.cwd(), "file2.js"));
      callback(path.join(process.cwd(), "ignored.txt"));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should process files and write changes", async () => {
    await handleRemoveComments([], {});
    expect(walkDir).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cleaned: file1.js"));
  });

  it("should respect dry-run", async () => {
    await handleRemoveComments([], { dryRun: true });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Would clean: file1.js"));
  });

  it("should respect include pattern", async () => {
    let callback;
    walkDir.mockImplementation(async (dir, config, cb) => {
      callback = cb;
    });

    await handleRemoveComments([], { include: "file1.js" });

    if (callback) {
        fs.readFileSync.mockClear();
        callback(path.join(process.cwd(), "file1.js"));
        expect(fs.readFileSync).toHaveBeenCalled();

        fs.readFileSync.mockClear();
        callback(path.join(process.cwd(), "file2.js"));
        expect(fs.readFileSync).not.toHaveBeenCalled();
    }
  });

   it("should respect exclude pattern", async () => {
    let callback;
    walkDir.mockImplementation(async (dir, config, cb) => {
      callback = cb;
    });

    await handleRemoveComments([], { exclude: "file2.js" });

    if (callback) {
        fs.readFileSync.mockClear();
        callback(path.join(process.cwd(), "file1.js"));
        expect(fs.readFileSync).toHaveBeenCalled();

        fs.readFileSync.mockClear();
        callback(path.join(process.cwd(), "file2.js"));
        expect(fs.readFileSync).not.toHaveBeenCalled();
    }
  });

  it("should pass preserveProtected to formatCode", async () => {
     let callback;
     walkDir.mockImplementation(async (dir, config, cb) => { callback = cb; });

     await handleRemoveComments([], { preserveProtected: true });

     if (callback) {
         callback(path.join(process.cwd(), "file1.js"));
         expect(formatCode).toHaveBeenCalledWith("some content", expect.any(String), { preserveProtected: true });
     }
  });
});
