/**
 * Extracts patterns from the context string based on the specified type.
 * @param context The context string to extract patterns from
 * @param type The type of patterns to extract ('message' or 'post')
 * @returns Array of extracted patterns
 */
export function extractPatternsFromContext(context: string, type: 'message' | 'post'): string[] {
    const patterns: string[] = [];
    const patternRegex = /([a-z]\)\s*[^:]+):\s*'([^']+)'/g;
    let match;

    while ((match = patternRegex.exec(context)) !== null) {
        patterns.push(match[2]);
    }

    return patterns;
}

/**
 * Injects a selected pattern into the context string.
 * @param context The context string to inject the pattern into
 * @param pattern The pattern to inject
 * @returns The modified context string
 */
export function injectPatternIntoContext(context: string, pattern: string): string {
    // Replace the pattern placeholder in the context with the selected pattern
    return context.replace(/\{\{selectedPattern\}\}/g, pattern);
}

/**
 * Extracts timestamp from a post content.
 * @param content The post content to extract timestamp from
 * @returns The extracted timestamp or null if not found
 */
export function extractTimestamp(content: string): string | null {
    const timestampRegex = /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2} [AP]M)\]/;
    const match = content.match(timestampRegex);
    return match ? match[1] : null;
}

/**
 * Validates if a post timestamp is within the allowed time range.
 * @param timestamp The timestamp to validate
 * @param startTime The preferred start time (e.g., "9:00 AM MT")
 * @param endTime The preferred end time (e.g., "9:00 PM MT")
 * @returns True if the timestamp is within the allowed range
 */
export function isWithinTimeRange(timestamp: string, startTime: string, endTime: string): boolean {
    const postTime = new Date(timestamp);
    const [startHour, startMin, startPeriod] = startTime.match(/(\d+):(\d+) ([AP])M/).slice(1);
    const [endHour, endMin, endPeriod] = endTime.match(/(\d+):(\d+) ([AP])M/).slice(1);

    const startDate = new Date(postTime);
    startDate.setHours(
        (parseInt(startHour) % 12) + (startPeriod === 'P' ? 12 : 0),
        parseInt(startMin)
    );

    const endDate = new Date(postTime);
    endDate.setHours(
        (parseInt(endHour) % 12) + (endPeriod === 'P' ? 12 : 0),
        parseInt(endMin)
    );

    return postTime >= startDate && postTime <= endDate;
}

/**
 * Counts posts within a specific day.
 * @param posts Array of post contents
 * @param date The date to count posts for (YYYY-MM-DD)
 * @returns Number of posts on the specified date
 */
export function countPostsForDate(posts: string[], date: string): number {
    return posts.filter(post => {
        const timestamp = extractTimestamp(post);
        return timestamp && timestamp.startsWith(date);
    }).length;
}

/**
 * Validates if posts follow the spacing requirements.
 * @param posts Array of post contents
 * @param minInterval Minimum interval between posts in seconds
 * @param maxInterval Maximum interval between posts in seconds
 * @returns Array of validation results for each post
 */
export function validatePostSpacing(posts: string[], minInterval: number, maxInterval: number): Array<{valid: boolean; reason?: string}> {
    const results: Array<{valid: boolean; reason?: string}> = [];
    const timestamps = posts.map(post => {
        const ts = extractTimestamp(post);
        return ts ? new Date(ts).getTime() : null;
    }).filter((ts): ts is number => ts !== null);

    for (let i = 1; i < timestamps.length; i++) {
        const interval = (timestamps[i] - timestamps[i-1]) / 1000; // Convert to seconds
        if (interval < minInterval) {
            results.push({
                valid: false,
                reason: `Posts too close together: ${interval}s (minimum ${minInterval}s)`
            });
        } else if (interval > maxInterval) {
            results.push({
                valid: false,
                reason: `Posts too far apart: ${interval}s (maximum ${maxInterval}s)`
            });
        } else {
            results.push({ valid: true });
        }
    }

    return results;
} 