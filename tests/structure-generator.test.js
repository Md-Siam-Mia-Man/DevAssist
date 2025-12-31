const { generateMarkdownStructure } = require('../src/utils/structure-generator');
const path = require('path');

describe('Structure Generator', () => {
    it('should generate markdown structure', () => {
        const files = [
            'src/index.js',
            'src/utils/helper.js',
            'package.json'
        ];
        // Use absolute paths so generateMarkdownStructure can apply path.relative(rootDir, file) correctly.

        const rootDir = '/app';
        const absoluteFiles = files.map(f => path.join(rootDir, f));

        const result = generateMarkdownStructure(absoluteFiles, rootDir);

        expect(result).toContain('- package.json');
        expect(result).toContain('- src/');
        expect(result).toContain('  - index.js');
        expect(result).toContain('  - utils/');
        expect(result).toContain('    - helper.js');
    });
});
