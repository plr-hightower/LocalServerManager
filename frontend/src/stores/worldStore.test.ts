import { describe, it, expect } from 'vitest';
import { downloadFilename } from './worldStore';

describe('downloadFilename', () => {
    it('names the whole-world archive after the server', () => {
        expect(downloadFilename('goonab2', {})).toBe('goonab2.zip');
    });

    it('names a single-volume archive after the volume', () => {
        expect(downloadFilename('goonab2', { vol: 1 })).toBe('goonab2_vol1.zip');
    });

    it('uses the bare file name for a single file', () => {
        expect(downloadFilename('goonab2', { path: 'vol0/world/level.dat' })).toBe('level.dat');
    });

    it('prefers the path over the volume index', () => {
        expect(downloadFilename('goonab2', { vol: 1, path: 'vol0/ops.json' })).toBe('ops.json');
    });

    it('falls back when the path ends in a slash', () => {
        expect(downloadFilename('goonab2', { path: 'vol0/world/' })).toBe('download');
    });

    it('appends .zip for a folder', () => {
        expect(downloadFilename('goonab2', { path: 'vol0/world/region', isDir: true })).toBe('region.zip');
    });

    it('does not append .zip for a file', () => {
        expect(downloadFilename('goonab2', { path: 'vol0/world/region', isDir: false })).toBe('region');
    });
});
