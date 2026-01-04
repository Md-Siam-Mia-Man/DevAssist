/**
 * Summarizes code by removing function bodies and keeping signatures/docstrings.
 * This is a heuristic approach and works best for C-style languages and Python.
 * @param {string} content - The code content.
 * @param {string} ext - The file extension.
 * @returns {string} The summarized content.
 */
function summarizeCode(content, ext) {
  const lines = content.split("\n");
  const summarizedLines = [];

  let insideBlock = false;
  let braceCount = 0;

  // Simple heuristic for JS/TS/Java/C# etc.
  if (['.js', '.ts', '.jsx', '.tsx', '.java', '.cs', '.c', '.cpp', '.php'].includes(ext)) {
    for (const line of lines) {
      const trimmed = line.trim();

      // Preserve comments (docstrings)
      if (trimmed.startsWith("/") || trimmed.startsWith("*")) {
        summarizedLines.push(line);
        continue;
      }

      // Preserve imports/requires
      if (trimmed.startsWith("import ") || trimmed.startsWith("require") || trimmed.startsWith("package ") || trimmed.startsWith("using ") || trimmed.startsWith("#include")) {
        summarizedLines.push(line);
        continue;
      }

      // Check for function/class definitions
      // This is very basic and regex based.
      const isDefinition = /function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*\(|^\s*\w+\s*\(.*?\)\s*{/.test(line);

      if (isDefinition) {
         summarizedLines.push(line);
         if (line.includes("{")) {
             braceCount += (line.match(/{/g) || []).length;
             braceCount -= (line.match(/}/g) || []).length;
             if (braceCount > 0) {
                 insideBlock = true;
                 summarizedLines.push("  // ... implementation hidden ...");
             }
         }
         continue;
      }

      if (insideBlock) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          if (braceCount <= 0) {
              insideBlock = false;
              braceCount = 0;
              if (line.includes("}")) {
                summarizedLines.push(line); // Close the block
              }
          }
      } else {
          // If not in a block, keep the line (declarations, etc.)
          // But maybe we want to filter more aggressive.
          // For now, let's just keep top-level stuff.
          summarizedLines.push(line);
      }
    }
    return summarizedLines.join("\n");
  } else if (ext === '.py') {
      // Python summarization
      for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("def ") || trimmed.startsWith("class ") || trimmed.startsWith("@") || trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
              summarizedLines.push(line);
              // Check if it ends with :
              if (trimmed.endsWith(":")) {
                  summarizedLines.push("    '''... implementation hidden ...'''");
              }
          }
      }
      return summarizedLines.join("\n");
  }

  // Fallback: return first 50 lines? Or just original content.
  return content;
}

module.exports = { summarizeCode };
