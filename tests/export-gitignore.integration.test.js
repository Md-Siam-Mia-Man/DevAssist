const fs = require('fs');
const path = require('path');
const { walkDir } = require('../src/utils/file-handler');

describe('export command - gitignore integration test', () => {
  const tmpDir = path.join(__dirname, '.tmp-test-gitignore');
  
  beforeAll(() => {
    // Clean up any existing test directory
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    
    // Create test directory structure
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'node_modules'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
    
    // Create test files
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'console.log("app");');
    fs.writeFileSync(path.join(tmpDir, 'src', 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'lib.js'), 'console.log("lib");');
    fs.writeFileSync(path.join(tmpDir, 'dist', 'bundle.js'), 'console.log("bundle");');
    fs.writeFileSync(path.join(tmpDir, 'secret.log'), 'secret data');
    
    // Create .gitignore with patterns
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\ndist/\n*.log\n');
  });
  
  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should respect gitignore patterns when filtering files', async () => {
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: ['.js'],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: []
    };
    
    // Test WITH gitignore enabled
    await walkDir(tmpDir, config, async (filePath) => {
      collectedFiles.push(path.relative(tmpDir, filePath));
    }, tmpDir, true);
    
    // Verify that files matching gitignore patterns are excluded
    expect(collectedFiles).toContain('src/app.js');
    expect(collectedFiles).toContain('src/test.js');
    expect(collectedFiles).not.toContain('node_modules/lib.js');
    expect(collectedFiles).not.toContain('dist/bundle.js');
    // .log files should not be included - gitignore blocks them
    expect(collectedFiles).not.toContain('secret.log');
  });

  it('should include gitignored files when gitignore is disabled', async () => {
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: ['.js'],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: []
    };
    
    // Test WITHOUT gitignore enabled
    await walkDir(tmpDir, config, async (filePath) => {
      collectedFiles.push(path.relative(tmpDir, filePath));
    }, tmpDir, false);
    
    // Without gitignore, all .js files should be included
    expect(collectedFiles).toContain('src/app.js');
    expect(collectedFiles).toContain('src/test.js');
    expect(collectedFiles).toContain('node_modules/lib.js');
    expect(collectedFiles).toContain('dist/bundle.js');
    // .log files should still not be included because they don't match includeExt
    expect(collectedFiles).not.toContain('secret.log');
  });

  it('should correctly handle directory patterns in gitignore', async () => {
    // Create a subdirectory in node_modules
    const nestedDir = path.join(tmpDir, 'node_modules', 'package', 'lib');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'index.js'), 'console.log("nested");');
    
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: ['.js'],
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: []
    };
    
    await walkDir(tmpDir, config, async (filePath) => {
      collectedFiles.push(path.relative(tmpDir, filePath));
    }, tmpDir, true);
    
    // Nested files in node_modules should also be ignored
    expect(collectedFiles).not.toContain('node_modules/package/lib/index.js');
  });

  it('should correctly handle wildcard patterns in gitignore', async () => {
    // Create test files with .log extension in different locations
    fs.writeFileSync(path.join(tmpDir, 'app.log'), 'log data');
    fs.writeFileSync(path.join(tmpDir, 'src', 'debug.log'), 'debug log');
    
    // Also create a .js file that should be included
    fs.writeFileSync(path.join(tmpDir, 'config.js'), 'module.exports = {};');
    
    const collectedFiles = [];
    const config = {
      ignoreFiles: [],
      includeExt: ['.js', '.log'], // Include both extensions for this test
      ignoreDirs: [],
      ignoreExt: [],
      ignorePatterns: []
    };
    
    await walkDir(tmpDir, config, async (filePath) => {
      collectedFiles.push(path.relative(tmpDir, filePath));
    }, tmpDir, true);
    
    // All .log files should be ignored due to *.log pattern
    expect(collectedFiles).not.toContain('app.log');
    expect(collectedFiles).not.toContain('src/debug.log');
    expect(collectedFiles).not.toContain('secret.log');
    
    // But .js files should still be included
    expect(collectedFiles).toContain('config.js');
    expect(collectedFiles).toContain('src/app.js');
  });
});
