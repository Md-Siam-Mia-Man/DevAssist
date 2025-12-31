const { listFiles, walkDir } = require('../src/utils/file-handler');
const fsSync = require('fs');
const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');

// Mock dependencies
jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    return {
        ...originalFs,
        readFileSync: jest.fn(),
        readdirSync: jest.fn(),
        statSync: jest.fn(),
        existsSync: jest.fn(),
        promises: {
            readdir: jest.fn()
        }
    };
});

// We need to mock ignore package to verify it's being used
jest.mock('ignore', () => {
    return jest.fn(() => ({
        add: jest.fn(),
        ignores: jest.fn().mockReturnValue(false),
    }));
});

describe('file-handler', () => {
    const config = {
        ignoreFiles: [],
        includeExt: ['.js'],
        ignoreDirs: [],
        ignoreExt: [],
        ignorePatterns: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('listFiles should use gitignore when useGitIgnore is true', () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('node_modules');
        fsSync.readdirSync.mockReturnValue(['file.js']);
        fsSync.statSync.mockReturnValue({ isDirectory: () => false });

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn().mockReturnValue(false)
        };
        ignore.mockReturnValue(ignoreInstance);

        listFiles('/test', config, '/test', null, true);

        expect(ignoreInstance.add).toHaveBeenCalledWith('node_modules');
    });

    it('walkDir should use gitignore when useGitIgnore is true', async () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('dist/');
        fs.readdir.mockResolvedValue([{ name: 'file.js', isFile: () => true, isDirectory: () => false }]);

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn().mockReturnValue(false)
        };
        ignore.mockReturnValue(ignoreInstance);

        const cb = jest.fn();
        await walkDir('/test', config, cb, '/test', true);

        expect(ignoreInstance.add).toHaveBeenCalledWith('dist/');
        expect(cb).toHaveBeenCalled();
    });

    it('listFiles should filter out files when ignores returns true', () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('node_modules\n*.log');
        fsSync.readdirSync.mockReturnValueOnce(['file.js', 'test.log']);
        fsSync.statSync
            .mockReturnValueOnce({ isDirectory: () => false }) // file.js
            .mockReturnValueOnce({ isDirectory: () => false }); // test.log

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((path) => {
                return path === 'test.log';
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const result = listFiles('/test', config, '/test', null, true);

        expect(result).toEqual(['file.js']);
        expect(result).not.toContain('test.log');
    });

    it('walkDir should skip ignored files and directories', async () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('node_modules\n*.tmp');

        const entries = [
            { name: 'file.js', isFile: () => true, isDirectory: () => false },
            { name: 'test.tmp', isFile: () => true, isDirectory: () => false },
            { name: 'node_modules', isFile: () => false, isDirectory: () => true }
        ];
        fs.readdir.mockResolvedValue(entries);

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((path) => {
                return path === 'test.tmp' || path === 'node_modules/';
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const cb = jest.fn();
        await walkDir('/test', config, cb, '/test', true);

        // Callback should only be called for non-ignored files matching includeExt
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith('/test/file.js');
        expect(cb).not.toHaveBeenCalledWith('/test/test.tmp');
    });

    it('listFiles should handle complex ignore patterns', () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('*.log');
        fsSync.readdirSync.mockReturnValueOnce(['app.js', 'debug.log']);
        fsSync.statSync
            .mockReturnValueOnce({ isDirectory: () => false }) // app.js
            .mockReturnValueOnce({ isDirectory: () => false }); // debug.log

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((path) => {
                return path === 'debug.log';
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const result = listFiles('/test', config, '/test', null, true);

        expect(result).toEqual(['app.js']);
        expect(result).not.toContain('debug.log');
    });
});
