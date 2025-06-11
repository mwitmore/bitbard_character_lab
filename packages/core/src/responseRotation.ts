import { Memory } from "./types";
import { elizaLogger } from "./logger";

interface ResponsePattern {
    type: string;
    content: string;
    lastUsed: number;
    useCount: number;
    temporalPattern?: string;  // Track temporal pattern used
    templateType?: 'messageHandlerTemplate' | 'postHandlerTemplate';  // Track which template was used
}

interface ResponseRotationState {
    messagePatterns: ResponsePattern[];
    postPatterns: ResponsePattern[];
    recentResponses: string[];
    boredomScore: number;
    temporalPatternStats: Record<string, number>;  // Track pattern usage statistics
    templateUsageStats: {  // Track template usage
        messageHandlerTemplate: number;
        postHandlerTemplate: number;
    };
}

export class ResponseRotationSystem {
    private state: ResponseRotationState;
    private readonly MAX_RECENT_RESPONSES = 5;
    private readonly PATTERN_COOLDOWN = 3; // Number of responses before a pattern can be reused
    private readonly BOREDOM_THRESHOLD = 0.7; // Threshold for considering responses repetitive
    private readonly TEMPORAL_PATTERNS = [
        'present',
        'past',
        'future',
        'conditional',
        'timeless'
    ];

    constructor() {
        this.state = {
            messagePatterns: [],
            postPatterns: [],
            recentResponses: [],
            boredomScore: 0,
            temporalPatternStats: {},
            templateUsageStats: {
                messageHandlerTemplate: 0,
                postHandlerTemplate: 0
            }
        };
    }

    public initializePatterns(messagePatterns: string[], postPatterns: string[]) {
        elizaLogger.info("Initializing response patterns", {
            messagePatternCount: messagePatterns.length,
            postPatternCount: postPatterns.length,
            templateUsageStats: this.state.templateUsageStats
        });

        this.state.messagePatterns = messagePatterns.map(pattern => ({
            type: 'message',
            content: pattern,
            lastUsed: 0,
            useCount: 0,
            temporalPattern: this.detectTemporalPattern(pattern),
            templateType: 'messageHandlerTemplate'
        }));

        this.state.postPatterns = postPatterns.map(pattern => ({
            type: 'post',
            content: pattern,
            lastUsed: 0,
            useCount: 0,
            temporalPattern: this.detectTemporalPattern(pattern),
            templateType: 'postHandlerTemplate'
        }));

        // Initialize temporal pattern stats
        this.TEMPORAL_PATTERNS.forEach(pattern => {
            this.state.temporalPatternStats[pattern] = 0;
        });
    }

    private detectTemporalPattern(text: string): string {
        const patterns = {
            present: /\b(is|are|am|do|does|have|has)\b/i,
            past: /\b(was|were|did|had)\b/i,
            future: /\b(will|shall|going to)\b/i,
            conditional: /\b(would|could|should|might|may)\b/i,
            timeless: /^(the|a|an|this|that|these|those)\b/i
        };

        for (const [pattern, regex] of Object.entries(patterns)) {
            if (regex.test(text)) {
                return pattern;
            }
        }
        return 'timeless';
    }

    public selectPattern(type: 'message' | 'post'): string {
        const patterns = type === 'message' ? this.state.messagePatterns : this.state.postPatterns;
        const now = Date.now();
        const templateType = type === 'message' ? 'messageHandlerTemplate' : 'postHandlerTemplate';

        elizaLogger.debug("Selecting pattern", {
            type,
            templateType,
            availablePatterns: patterns.length,
            temporalStats: this.state.temporalPatternStats,
            templateUsageStats: this.state.templateUsageStats
        });

        // Check if patterns are available
        if (patterns.length === 0) {
            elizaLogger.warn("No patterns available for selection", {
                type,
                templateType
            });
            return ""; // Return empty string instead of crashing
        }

        // Calculate pattern weights based on usage, recency, and temporal distribution
        const weightedPatterns = patterns.map(pattern => {
            const timeSinceLastUse = now - pattern.lastUsed;
            const useCount = pattern.useCount;
            const temporalPattern = pattern.temporalPattern || 'timeless';
            const temporalUsage = this.state.temporalPatternStats[temporalPattern] || 0;
            
            // Base weight is 1.0
            let weight = 1.0;
            
            // Reduce weight if pattern was used recently
            if (timeSinceLastUse < this.PATTERN_COOLDOWN * 1000) {
                weight *= 0.5;
            }
            
            // Increase weight if pattern hasn't been used in a while
            if (timeSinceLastUse > this.PATTERN_COOLDOWN * 2 * 1000) {
                weight *= 1.3;
            }
            
            // Reduce weight based on use count
            weight *= Math.pow(0.9, useCount);
            
            // Adjust weight based on temporal pattern distribution
            const totalPatterns = Object.values(this.state.temporalPatternStats).reduce((a, b) => a + b, 0);
            if (totalPatterns > 0) {
                const temporalRatio = temporalUsage / totalPatterns;
                if (temporalRatio > 0.3) { // If this temporal pattern is overused
                    weight *= 0.7;
                }
            }
            
            return { pattern, weight };
        });

        // Select pattern based on weights
        const totalWeight = weightedPatterns.reduce((sum, { weight }) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const { pattern, weight } of weightedPatterns) {
            random -= weight;
            if (random <= 0) {
                // Update pattern usage and stats
                pattern.lastUsed = now;
                pattern.useCount++;
                const temporalPattern = pattern.temporalPattern || 'timeless';
                this.state.temporalPatternStats[temporalPattern] = (this.state.temporalPatternStats[temporalPattern] || 0) + 1;
                this.state.templateUsageStats[templateType]++;

                elizaLogger.debug("Selected pattern", {
                    type,
                    templateType,
                    pattern: pattern.content,
                    temporalPattern,
                    useCount: pattern.useCount,
                    timeSinceLastUse: now - pattern.lastUsed,
                    templateUsageStats: this.state.templateUsageStats
                });

                return pattern.content;
            }
        }

        // Fallback to first pattern if something goes wrong
        elizaLogger.warn("Falling back to first pattern due to selection error", {
            type,
            templateType
        });
        
        // Add safety check here too
        if (patterns.length === 0) {
            elizaLogger.warn("No patterns available for fallback", {
                type,
                templateType
            });
            return ""; // Return empty string instead of crashing
        }
        
        return patterns[0].content;
    }

    public updateBoredomScore(response: string) {
        // Add response to recent history
        this.state.recentResponses.unshift(response);
        if (this.state.recentResponses.length > this.MAX_RECENT_RESPONSES) {
            this.state.recentResponses.pop();
        }

        // Calculate semantic similarity with recent responses
        const similarityScore = this.calculateSimilarityScore(response);
        this.state.boredomScore = similarityScore;

        return this.state.boredomScore > this.BOREDOM_THRESHOLD;
    }

    private calculateSimilarityScore(response: string): number {
        if (this.state.recentResponses.length <= 1) {
            return 0;
        }

        // Simple word overlap similarity for now
        const responseWords = new Set(response.toLowerCase().split(/\s+/));
        let totalSimilarity = 0;

        for (const recentResponse of this.state.recentResponses.slice(1)) {
            const recentWords = new Set(recentResponse.toLowerCase().split(/\s+/));
            const intersection = new Set([...responseWords].filter(x => recentWords.has(x)));
            const similarity = intersection.size / Math.max(responseWords.size, recentWords.size);
            totalSimilarity += similarity;
        }

        return totalSimilarity / (this.state.recentResponses.length - 1);
    }

    public getBoredomScore(): number {
        return this.state.boredomScore;
    }

    public getTemporalPatternStats(): Record<string, number> {
        return { ...this.state.temporalPatternStats };
    }

    public getTemplateUsageStats(): Record<string, number> {
        return { ...this.state.templateUsageStats };
    }

    public reset() {
        this.state = {
            messagePatterns: this.state.messagePatterns.map(p => ({ ...p, lastUsed: 0 })),
            postPatterns: this.state.postPatterns.map(p => ({ ...p, lastUsed: 0 })),
            recentResponses: [],
            boredomScore: 0,
            temporalPatternStats: {},
            templateUsageStats: {
                messageHandlerTemplate: 0,
                postHandlerTemplate: 0
            }
        };
        // Reinitialize temporal pattern stats
        this.TEMPORAL_PATTERNS.forEach(pattern => {
            this.state.temporalPatternStats[pattern] = 0;
        });
    }
}

export const responseRotationSystem = new ResponseRotationSystem(); 