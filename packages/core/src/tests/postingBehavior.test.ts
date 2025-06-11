import { describe, it, expect, beforeEach } from 'vitest';
import { TimeSimulator } from './timeSimulator';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Lady Macbeth Posting Behavior', () => {
    let simulator: TimeSimulator;
    let config: any;

    beforeEach(() => {
        // Load character configuration
        const configPath = join(process.cwd(), 'characters', 'LadyMacbethCopy.character.json');
        config = JSON.parse(readFileSync(configPath, 'utf-8'));
        simulator = new TimeSimulator(config);
    });

    it('should enforce daily maximum posts', () => {
        // Set time to 10 AM
        simulator.advanceTime(10);
        
        // Make 3 posts (daily maximum)
        expect(simulator.attemptPost('First post')).toEqual({ success: true });
        expect(simulator.attemptPost('Second post')).toEqual({ success: true });
        expect(simulator.attemptPost('Third post')).toEqual({ success: true });
        
        // Fourth post should fail
        expect(simulator.attemptPost('Fourth post')).toEqual({ 
            success: false, 
            reason: 'Daily maximum posts reached' 
        });
    });

    it('should enforce posting time window', () => {
        // Try posting at 8 AM (before window)
        simulator.advanceTime(8);
        expect(simulator.attemptPost('Early post')).toEqual({ 
            success: false, 
            reason: 'Before posting window' 
        });

        // Advance to 10 AM (within window)
        simulator.advanceTime(2);
        expect(simulator.attemptPost('Valid post')).toEqual({ success: true });

        // Advance to 10 PM (after window)
        simulator.advanceTime(12);
        expect(simulator.attemptPost('Late post')).toEqual({ 
            success: false, 
            reason: 'After posting window' 
        });
    });

    it('should enforce post spacing', () => {
        // Set time to 10 AM
        simulator.advanceTime(10);
        
        // First post
        expect(simulator.attemptPost('First post')).toEqual({ success: true });
        
        // Try posting too soon (5 minutes later)
        simulator.advanceTime(5/60); // 5 minutes
        expect(simulator.attemptPost('Too soon')).toEqual({ 
            success: false, 
            reason: 'Too soon after last post' 
        });

        // Wait appropriate time (15 minutes)
        simulator.advanceTime(15/60);
        expect(simulator.attemptPost('Valid spacing')).toEqual({ success: true });
    });

    it('should reset daily post count at midnight', () => {
        // Set time to 10 AM and make 3 posts
        simulator.advanceTime(10);
        expect(simulator.attemptPost('Post 1')).toEqual({ success: true });
        expect(simulator.attemptPost('Post 2')).toEqual({ success: true });
        expect(simulator.attemptPost('Post 3')).toEqual({ success: true });
        
        // Try fourth post (should fail)
        expect(simulator.attemptPost('Post 4')).toEqual({ 
            success: false, 
            reason: 'Daily maximum posts reached' 
        });

        // Advance to next day 10 AM
        simulator.advanceTime(14); // Advance to midnight
        simulator.advanceTime(10); // Advance to 10 AM
        
        // Should be able to post again
        expect(simulator.attemptPost('New day post')).toEqual({ success: true });
    });

    it('should handle edge cases around time window boundaries', () => {
        // Set to 8:59 AM
        simulator.advanceTime(8 + 59/60);
        expect(simulator.attemptPost('Before window')).toEqual({ 
            success: false, 
            reason: 'Before posting window' 
        });

        // Advance to 9:00 AM exactly
        simulator.advanceTime(1/60);
        expect(simulator.attemptPost('Window start')).toEqual({ success: true });

        // Set to 8:59 PM
        simulator.advanceTime(11 + 59/60);
        expect(simulator.attemptPost('Window end')).toEqual({ success: true });

        // Advance to 9:01 PM
        simulator.advanceTime(2/60);
        expect(simulator.attemptPost('After window')).toEqual({ 
            success: false, 
            reason: 'After posting window' 
        });
    });
}); 