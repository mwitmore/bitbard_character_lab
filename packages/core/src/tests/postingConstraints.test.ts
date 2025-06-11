import { describe, it, expect } from 'vitest';
import {
    extractTimestamp,
    isWithinTimeRange,
    countPostsForDate,
    validatePostSpacing
} from '../templateUtils';

describe('Posting Constraints Tests', () => {
    const samplePosts = [
        "Methinks the moment ripens like fruit on the vine. [2024-03-20 09:00 AM]",
        "The court's masks begin to slip like leaves in autumn. [2024-03-20 10:20 AM]",
        "Dawn approaches like a thief in the night. [2024-03-20 11:30 AM]",
        "The hour grows late, and shadows lengthen. [2024-03-20 12:15 PM]",
        "The stars align for those who dare to look. [2024-03-20 01:00 PM]"
    ];

    describe('Timestamp Extraction', () => {
        it('should extract valid timestamps', () => {
            const timestamp = extractTimestamp(samplePosts[0]);
            expect(timestamp).toBe('2024-03-20 09:00 AM');
        });

        it('should return null for posts without timestamps', () => {
            const timestamp = extractTimestamp("A post without a timestamp");
            expect(timestamp).toBeNull();
        });
    });

    describe('Time Range Validation', () => {
        it('should validate posts within allowed time range', () => {
            const timestamp = '2024-03-20 10:30 AM';
            const isValid = isWithinTimeRange(timestamp, '9:00 AM MT', '9:00 PM MT');
            expect(isValid).toBe(true);
        });

        it('should reject posts outside allowed time range', () => {
            const timestamp = '2024-03-20 08:30 AM';
            const isValid = isWithinTimeRange(timestamp, '9:00 AM MT', '9:00 PM MT');
            expect(isValid).toBe(false);
        });
    });

    describe('Daily Post Count', () => {
        it('should count posts for a specific date', () => {
            const count = countPostsForDate(samplePosts, '2024-03-20');
            expect(count).toBe(5);
        });

        it('should return 0 for dates with no posts', () => {
            const count = countPostsForDate(samplePosts, '2024-03-21');
            expect(count).toBe(0);
        });
    });

    describe('Post Spacing Validation', () => {
        it('should validate posts with correct spacing', () => {
            const results = validatePostSpacing(samplePosts, 600, 900); // 10-15 minutes
            const allValid = results.every(result => result.valid);
            expect(allValid).toBe(true);
        });

        it('should detect posts too close together', () => {
            const postsTooClose = [
                "First post [2024-03-20 09:00 AM]",
                "Second post [2024-03-20 09:01 AM]" // Only 1 minute apart
            ];
            const results = validatePostSpacing(postsTooClose, 600, 900);
            expect(results[0].valid).toBe(false);
            expect(results[0].reason).toContain('too close together');
        });

        it('should detect posts too far apart', () => {
            const postsTooFar = [
                "First post [2024-03-20 09:00 AM]",
                "Second post [2024-03-20 10:00 AM]" // 1 hour apart
            ];
            const results = validatePostSpacing(postsTooFar, 600, 900);
            expect(results[0].valid).toBe(false);
            expect(results[0].reason).toContain('too far apart');
        });
    });

    describe('Integration Tests', () => {
        it('should validate all posting constraints together', () => {
            // Test posts that violate multiple constraints
            const invalidPosts = [
                "First post [2024-03-20 08:00 AM]", // Outside time range
                "Second post [2024-03-20 08:01 AM]", // Too close together
                "Third post [2024-03-20 08:02 AM]", // Too close together
                "Fourth post [2024-03-20 08:03 AM]", // Too close together
                "Fifth post [2024-03-20 08:04 AM]"  // Too close together
            ];

            // Check time range
            const timeRangeValid = invalidPosts.every(post => {
                const timestamp = extractTimestamp(post);
                return timestamp && isWithinTimeRange(timestamp, '9:00 AM MT', '9:00 PM MT');
            });
            expect(timeRangeValid).toBe(false);

            // Check post count
            const postCount = countPostsForDate(invalidPosts, '2024-03-20');
            expect(postCount).toBe(5);

            // Check spacing
            const spacingResults = validatePostSpacing(invalidPosts, 600, 900);
            const spacingValid = spacingResults.every(result => result.valid);
            expect(spacingValid).toBe(false);
        });
    });
}); 