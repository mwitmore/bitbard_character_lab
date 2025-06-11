import { elizaLogger } from '../logger';
import { TimeSimulator } from './timeSimulator';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { describe, it, expect, beforeAll } from 'vitest';

function getCharacterConfigPath() {
    // Allow override via env var
    const envPath = process.env.LADY_MACBETH_CONFIG;
    if (envPath && existsSync(envPath)) {
        return envPath;
    }
    // Try monorepo root
    const rootPath = resolve(__dirname, '../../../../characters/LadyMacbethCopy.character.json');
    if (existsSync(rootPath)) {
        return rootPath;
    }
    // Try local (for dev/test flexibility)
    const localPath = join(process.cwd(), 'characters', 'LadyMacbethCopy.character.json');
    if (existsSync(localPath)) {
        return localPath;
    }
    return null;
}

describe('Lady Macbeth Character Tests', () => {
    let simulator: TimeSimulator;
    let config: any;

    beforeAll(() => {
        elizaLogger.info('Initializing Lady Macbeth test suite...');
        const configPath = getCharacterConfigPath();
        if (!configPath) {
            elizaLogger.error('Could not find LadyMacbethCopy.character.json. Searched in:');
            elizaLogger.error('  - $LADY_MACBETH_CONFIG');
            elizaLogger.error('  - monorepo root: ../../../../characters/LadyMacbethCopy.character.json');
            elizaLogger.error('  - cwd: characters/LadyMacbethCopy.character.json');
            throw new Error('LadyMacbethCopy.character.json not found. Please ensure the file exists.');
        }
        config = JSON.parse(readFileSync(configPath, 'utf-8'));
        simulator = new TimeSimulator(config);
        elizaLogger.info(`Configuration loaded successfully from: ${configPath}`);
    });

    describe('Time Window Tests', () => {
        it('should reject posts before posting window', () => {
            simulator.advanceTime(8);
            const result = simulator.attemptPost('Early post');
            expect(result).toEqual({ success: false, reason: 'Before posting window' });
        });

        it('should accept posts within posting window', () => {
            simulator.advanceTime(2);
            const result = simulator.attemptPost('Valid post');
            expect(result).toEqual({ success: true });
        });

        it('should reject posts after posting window', () => {
            simulator.advanceTime(12);
            const result = simulator.attemptPost('Late post');
            expect(result).toEqual({ success: false, reason: 'After posting window' });
        });
    });

    describe('Frequency Tests', () => {
        it('should enforce daily maximum posts', () => {
            simulator.advanceTime(10);
            const posts = [];
            for (let i = 0; i < 4; i++) {
                const result = simulator.attemptPost(`Post ${i + 1}`);
                posts.push(result);
            }
            expect(posts).toEqual([
                { success: true },
                { success: true },
                { success: true },
                { success: false, reason: 'Daily maximum posts reached' }
            ]);
        });

        it('should enforce post spacing', () => {
            simulator.advanceTime(5/60); // 5 minutes
            const tooSoon = simulator.attemptPost('Too soon');
            simulator.advanceTime(15/60); // 15 minutes
            const validSpacing = simulator.attemptPost('Valid spacing');
            expect([tooSoon, validSpacing]).toEqual([
                { success: false, reason: 'Too soon after last post' },
                { success: true }
            ]);
        });
    });

    describe('Edge Case Tests', () => {
        it('should reset daily post count at midnight', () => {
            simulator.advanceTime(14); // Advance to midnight
            simulator.advanceTime(10); // Advance to 10 AM
            const result = simulator.attemptPost('New day post');
            expect(result).toEqual({ success: true });
        });

        it('should handle time window boundaries correctly', () => {
            simulator.advanceTime(8 + 59/60); // 8:59 AM
            const beforeBoundary = simulator.attemptPost('Before boundary');
            simulator.advanceTime(1/60); // 9:00 AM
            const atBoundary = simulator.attemptPost('At boundary');
            expect([beforeBoundary, atBoundary]).toEqual([
                { success: false, reason: 'Before posting window' },
                { success: true }
            ]);
        });
    });
}); 