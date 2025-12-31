const fs = require('fs');
const path = require('path');
const { handleExport } = require('../src/commands/export');
const { walkDir } = require('../src/utils/file-handler');
const { loadConfig } = require('../src/utils/config-loader');
const { formatCode } = require('../src/utils/formatter');

// Mock dependencies
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  readdir: jest.fn().mockResolvedValue([]),
  existsSync: jest.fn(),
}));

jest.mock('kleur', () => {
    return {
        blue: (s) => s,
        dim: (s) => s,
        green: (s) => s,
        cyan: (s) => s,
        bold: jest.fn().mockImplementation((s) => {
            if (s) return s;
            return { underline: (s) => s };
        }),
        underline: (s) => s,
    };
});

jest.mock('../src/utils/config-loader', () => ({
  loadConfig: jest.fn(),
}));

jest.mock('../src/utils/file-handler', () => ({
  listFiles: jest.fn(),
  walkDir: jest.fn(),
}));

jest.mock('../src/utils/formatter', () => ({
  formatCode: jest.fn((c) => c),
}));

describe('export command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadConfig.mockReturnValue({
        ignoreFiles: [],
        includeExt: ['.js'],
        ignoreDirs: [],
        ignoreExt: [],
        ignorePatterns: []
    });
  });

  it('should be defined', () => {
    expect(handleExport).toBeDefined();
  });

  it('should export files and format them', async () => {
    const options = { output: 'output.txt', structure: true };
    const projectDir = process.cwd();

    // Mock walkDir to simulate finding a file
    walkDir.mockImplementation(async (dir, config, callback) => {
        await callback(path.join(projectDir, 'file1.js'));
    });

    fs.readFileSync.mockReturnValue('const a = 1; // comment');
    formatCode.mockReturnValue('const a = 1;');

    await handleExport(options);

    expect(walkDir).toHaveBeenCalled();
    expect(formatCode).toHaveBeenCalledWith('const a = 1; // comment', path.join(projectDir, 'file1.js'));
    expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('output.txt'),
        expect.stringContaining('## File: file1.js\n```js\nconst a = 1;\n```')
    );
  });

  it('should not include structure when --no-structure is passed', async () => {
      const options = { output: 'output.txt', structure: false };
      walkDir.mockImplementation(async (dir, config, callback) => {});

      await handleExport(options);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const outputContent = writeCall[1];
      expect(outputContent).not.toContain('## Project Structure');
  });

  it('should pass useGitIgnore to walkDir when --gitignore is passed', async () => {
      const options = { output: 'output.txt', gitignore: true };

      await handleExport(options);

      expect(walkDir).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.any(Function),
          expect.any(String),
          true
      );
  });
});
