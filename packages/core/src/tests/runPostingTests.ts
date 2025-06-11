import { defineConfig } from 'vitest/config';
import { elizaLogger } from '../logger';
import {
    extractTimestamp,
    isWithinTimeRange,
    countPostsForDate,
    validatePostSpacing
} from '../templateUtils';

async function runPostingTests() {
    elizaLogger.info('Starting posting constraint tests...');

    try {
        // Configure and run tests
        const config = defineConfig({
            test: {
                include: ['**/postingConstraints.test.ts'],
                reporters: ['verbose'],
                testTimeout: 10000
            }
        });

        // Additional manual validation of example posts
        const examplePosts = [
            "Methinks the moment ripens like fruit on the vine. [2024-03-20 09:00 AM]",
            "The court's masks begin to slip like leaves in autumn. [2024-03-20 10:20 AM]",
            "Dawn approaches like a thief in the night. [2024-03-20 11:30 AM]",
            "The hour grows late, and shadows lengthen. [2024-03-20 12:15 PM]",
            "The stars align for those who dare to look. [2024-03-20 01:00 PM]"
        ];

        // Validate time range
        const timeRangeResults = examplePosts.map(post => {
            const timestamp = extractTimestamp(post);
            const isValid = timestamp && isWithinTimeRange(timestamp, '9:00 AM MT', '9:00 PM MT');
            return { post, isValid };
        });

        elizaLogger.info('Time range validation results:', timeRangeResults);

        // Validate post count
        const postCount = countPostsForDate(examplePosts, '2024-03-20');
        elizaLogger.info(`Post count for 2024-03-20: ${postCount}`);

        // Validate post spacing
        const spacingResults = validatePostSpacing(examplePosts, 600, 900);
        elizaLogger.info('Post spacing validation results:', spacingResults);

    } catch (error) {
        elizaLogger.error('Error running posting constraint tests:', error);
        process.exit(1);
    }
}

// Run the tests
runPostingTests(); 