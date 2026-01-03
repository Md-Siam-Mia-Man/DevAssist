function summarizeContent(content, filePath) {
    const ext = filePath.split('.').pop();
    const lines = content.split('\n');
    let output = [];
    let insideFunction = false;
    let braceCount = 0;

    // Simple heuristic for C-style languages (JS, TS, C, Java, etc.)
    // This is NOT a full parser, just a helper to reduce context
    if (['js', 'ts', 'tsx', 'jsx', 'java', 'c', 'cpp', 'cs'].includes(ext)) {
        for (const line of lines) {
             const trimmed = line.trim();

             // Check for function definitions (simplified)
             if (!insideFunction) {
                 output.push(line);
                 if (trimmed.includes('{') && (trimmed.includes('function') || trimmed.includes('=>') || trimmed.includes('class') || trimmed.match(/\)\s*\{/))) {
                      // Heuristic: line ends with { or contains { and looks like a function
                      braceCount += (line.match(/{/g) || []).length;
                      braceCount -= (line.match(/}/g) || []).length;
                      if(braceCount > 0) insideFunction = true;
                 }
             } else {
                 // We are inside a function/block
                 braceCount += (line.match(/{/g) || []).length;
                 braceCount -= (line.match(/}/g) || []).length;

                 if (braceCount <= 0) {
                     insideFunction = false;
                     output.push(line); // Close brace
                 } else if (output[output.length - 1] !== '  // ... content summarized ...') {
                      output.push('  // ... content summarized ...');
                 }
             }
        }
        return output.join('\n');
    }

    // For Python (Indentation based)
    if (['py'].includes(ext)) {
         let currentIndent = 0;
         for (const line of lines) {
             const trimmed = line.trim();
             if (!trimmed) {
                 output.push(line);
                 continue;
             }

             const indent = line.search(/\S/);

             if (trimmed.startsWith('def ') || trimmed.startsWith('class ')) {
                 output.push(line);
                 currentIndent = indent;
             } else {
                 // If indentation is deeper than definition, skip (summarize)
                 if (indent > currentIndent) {
                      if (output[output.length - 1] !== '    # ... content summarized ...') {
                           output.push('    # ... content summarized ...');
                      }
                 } else {
                      output.push(line);
                      currentIndent = indent; // Reset indent tracking? Not exactly correct but good enough for simple summarization
                 }
             }
         }
         return output.join('\n');
    }

    return content; // Fallback
}

module.exports = { summarizeContent };
