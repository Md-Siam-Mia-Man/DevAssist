const fs = require("fs");
const path = require("path");
const kleur = require("kleur");

function handleChunk(file, options) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(kleur.red(`Error: File not found at ${filePath}`));
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const maxLines = parseInt(options.maxLines, 10);
  const totalChunks = Math.ceil(lines.length / maxLines);

  console.log(
    kleur.yellow(
      `Chunking file ${kleur.bold(file)} into ${totalChunks} parts...\n`
    )
  );

  let output = `# File: ${file}\n# Total Chunks: ${totalChunks}\n\n`;
  output += "## Table of Contents\n";
  for (let i = 0; i < totalChunks; i++) {
    const startLine = i * maxLines + 1;
    const endLine = Math.min((i + 1) * maxLines, lines.length);
    output += `- Chunk ${i + 1}: Lines ${startLine}-${endLine}\n`;
  }
  output += "\n---\n\n";

  for (let i = 0; i < totalChunks; i++) {
    const startLine = i * maxLines;
    const endLine = startLine + maxLines;
    const chunkContent = lines.slice(startLine, endLine).join("\n");

    output += `## Chunk ${i + 1} of ${totalChunks} (Lines ${
      startLine + 1
    }-${Math.min(endLine, lines.length)})\n\n`;
    const ext = path.extname(file);
    const lang = ext ? ext.substring(1) : "";
    output += "```" + `${lang}\n`;
    output += chunkContent;
    output += "\n```\n\n";
  }

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, output);
    console.log(kleur.green(`✅ Chunks saved to ${kleur.bold(outputPath)}`));
  } else {
    console.log(output);
  }
}

module.exports = { handleChunk };
