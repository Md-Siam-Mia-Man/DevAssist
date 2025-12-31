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

    it('listFiles should exclude files when ignores returns true', () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('*.log\nnode_modules/');
        fsSync.readdirSync.mockImplementation((dir) => {
            if (dir === '/test') {
                return ['app.js', 'debug.log', 'node_modules'];
            }
            if (dir === path.join('/test', 'node_modules')) {
                return ['package.js'];
            }
            return [];
        });
        fsSync.statSync.mockImplementation((filePath) => {
            const isDir = filePath.includes('node_modules') && !filePath.includes('package.js');
            return { isDirectory: () => isDir };
        });

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((filePath) => {
                // Simulate ignoring .log files and node_modules directory
                return filePath === 'debug.log' || filePath === 'node_modules/' || filePath.startsWith('node_modules/');
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const result = listFiles('/test', config, '/test', null, true);

        expect(result).toEqual(['app.js']);
        expect(result).not.toContain('debug.log');
        expect(result).not.toContain('node_modules/package.js');
    });

    it('walkDir should exclude files when ignores returns true', async () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('*.log\nbuild/');
        
        fs.readdir.mockImplementation(async (dir) => {
            if (dir === '/test') {
                return [
                    { name: 'app.js', isFile: () => true, isDirectory: () => false },
                    { name: 'test.log', isFile: () => true, isDirectory: () => false },
                    { name: 'build', isFile: () => false, isDirectory: () => true }
                ];
            }
            if (dir === path.join('/test', 'build')) {
                return [
                    { name: 'output.js', isFile: () => true, isDirectory: () => false }
                ];
            }
            return [];
        });

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((filePath) => {
                // Simulate ignoring .log files and build directory
                return filePath === 'test.log' || filePath === 'build/' || filePath.startsWith('build/');
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const cb = jest.fn();
        await walkDir('/test', config, cb, '/test', true);

        // Callback should be called only for app.js, not for test.log or build/output.js
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(path.join('/test', 'app.js'));
    });

    it('listFiles should filter directories correctly when ignored', () => {
        fsSync.existsSync.mockReturnValue(true);
        fsSync.readFileSync.mockReturnValue('temp/');
        fsSync.readdirSync.mockImplementation((dir) => {
            if (dir === '/test') {
                return ['src', 'temp'];
            }
            if (dir === path.join('/test', 'src')) {
                return ['main.js'];
            }
            if (dir === path.join('/test', 'temp')) {
                return ['cache.js'];
            }
            return [];
        });
        fsSync.statSync.mockImplementation((filePath) => {
            const fileName = path.basename(filePath);
            return { isDirectory: () => fileName === 'src' || fileName === 'temp' };
        });

        const ignoreInstance = {
            add: jest.fn(),
            ignores: jest.fn((filePath) => {
                return filePath === 'temp/' || filePath.startsWith('temp/');
            })
        };
        ignore.mockReturnValue(ignoreInstance);

        const result = listFiles('/test', config, '/test', null, true);

        expect(result).toContain('src/main.js');
        expect(result).not.toContain('temp/cache.js');
    });
});
