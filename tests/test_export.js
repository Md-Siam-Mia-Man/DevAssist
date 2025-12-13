const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Setup fixture
const fixtureDir = path.resolve(__dirname, 'fixtures/simple_project');
if (!fs.existsSync(fixtureDir)) {
  fs.mkdirSync(fixtureDir, { recursive: true });
}
const indexFile = path.join(fixtureDir, 'index.js');
const styleFile = path.join(fixtureDir, 'style.css');
fs.writeFileSync(indexFile, "console.log('Hello');");
fs.writeFileSync(styleFile, "body { color: red; }");

const outputFile = path.resolve(fixtureDir, 'output.xml');
const binPath = path.resolve(__dirname, '../bin/devassist.js');

// Ensure output file doesn't exist
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

try {
  console.log('Running export command...');
  // Run the export command
  execSync(`node ${binPath} export -o output.xml`, { cwd: fixtureDir });

  // Read the output
  const content = fs.readFileSync(outputFile, 'utf8');

  console.log('Validating output format...');

  // Validation Logic
  const hasMarkdownHeaders = content.includes('## Project Structure') || content.includes('## File Contents');
  const hasXMLStructure = content.includes('<project_structure>') && content.includes('</project_structure>');
  const hasFileList = content.includes('<files_list>') && content.includes('<path>index.js</path>');
  const hasFileContent = content.includes('<file path="index.js">') && content.includes('console.log(\'Hello\');');

  if (hasMarkdownHeaders) {
    throw new Error('FAIL: Output contains Markdown headers, expected XML only.');
  }

  if (!hasXMLStructure) {
    throw new Error('FAIL: Output missing <project_structure> root tag.');
  }

  if (!hasFileList) {
    throw new Error('FAIL: Output missing <files_list> or file paths.');
  }

  if (!hasFileContent) {
    throw new Error('FAIL: Output missing file content.');
  }

  console.log('PASS: Output is valid XML with correct structure.');

} catch (error) {
  console.error(error.message);
  process.exit(1);
} finally {
  // Cleanup
  if (fs.existsSync(fixtureDir)) {
     fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
}
