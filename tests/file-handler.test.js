const { listFiles, walkDir } = require('../src/utils/file-handler');
const fsSync = require('fs');
const fs = require('fs').promises;
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
});
