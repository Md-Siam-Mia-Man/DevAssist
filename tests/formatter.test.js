const { formatCode } = require('../src/utils/formatter');

describe('Formatter', () => {
    it('should strip single line comments in JS', () => {
        const input = 'const x = 1; // comment';
        const expected = 'const x = 1;';
        expect(formatCode(input, 'test.js')).toBe(expected);
    });

    it('should strip multi line comments in JS', () => {
        const input = 'const x = 1; /* comment */';
        const expected = 'const x = 1;';
        expect(formatCode(input, 'test.js')).toBe(expected);
    });

    it('should strip comments in Python', () => {
        const input = 'x = 1 # comment';
        const expected = 'x = 1';
        expect(formatCode(input, 'test.py')).toBe(expected);
    });

    it('should remove multiple empty lines', () => {
        const input = 'line1\n\n\nline2';
        const expected = 'line1\nline2'; // formatCode replaces empty lines
        expect(formatCode(input, 'test.txt')).toBe(expected);
    });

    it('should handle unsupported extensions gracefully', () => {
        const input = 'some content';
        expect(formatCode(input, 'test.unknown')).toBe('some content');
    });
});
