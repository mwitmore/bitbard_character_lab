class ResponseEvaluator {
    constructor(templateProcessor) {
        this.templateProcessor = templateProcessor;
    }

    evaluateResponse(response, expectedPatterns) {
        const validation = this.templateProcessor.validateResponse(response);
        
        const evaluation = {
            matches: {},
            score: 0,
            totalChecks: 0,
            details: {},
            structuralAnalysis: {
                sentenceCount: this.countSentences(response),
                averageSentenceLength: this.calculateAverageSentenceLength(response),
                particlePosition: this.analyzeParticlePosition(response),
                temporalReferences: this.analyzeTemporalReferences(response),
                imperativeCount: this.countImperatives(response)
            }
        };

        // Check each expected pattern
        for (const [pattern, expected] of Object.entries(expectedPatterns)) {
            evaluation.totalChecks++;
            evaluation.matches[pattern] = validation[pattern] === expected;
            evaluation.details[pattern] = {
                expected,
                actual: validation[pattern]
            };
            
            if (validation[pattern] === expected) {
                evaluation.score++;
            }
        }

        // Calculate percentage score
        evaluation.percentageScore = (evaluation.score / evaluation.totalChecks) * 100;

        return evaluation;
    }

    countSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    }

    calculateAverageSentenceLength(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const totalLength = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
        return sentences.length > 0 ? totalLength / sentences.length : 0;
    }

    analyzeParticlePosition(response) {
        const particles = [
            'Sblood,', 'I\'faith,', 'So please you,', 'Methinks,',
            'Prithee,', 'Forsooth,', 'Verily,', 'Nay,', 'Yea,',
            'Alas,', 'Lo,', 'Hark,', 'Marry,', 'Troth,', 'Zounds,'
        ];

        for (const particle of particles) {
            if (response.includes(particle)) {
                const position = response.indexOf(particle);
                return {
                    found: true,
                    particle,
                    position,
                    isStart: position < 20 // Consider it at start if within first 20 chars
                };
            }
        }
        return { found: false };
    }

    analyzeTemporalReferences(response) {
        const temporalPatterns = {
            'Sensory-Time': /\b(night|day|hour|moment|time|dawn|dusk)\b/gi,
            'Event-Tethered': /\b(when|while|before|after|during)\b/gi,
            'Abstract-Time': /\b(future|past|present|eternity|forever)\b/gi
        };

        const references = {};
        for (const [pattern, regex] of Object.entries(temporalPatterns)) {
            const matches = response.match(regex) || [];
            references[pattern] = matches.length;
        }
        return references;
    }

    countImperatives(response) {
        // Look for imperative verbs at start of sentences
        const imperativePattern = /(?:^|[.!?]\s+)([A-Z][a-z]*\b)/g;
        const matches = response.match(imperativePattern) || [];
        return matches.length;
    }

    evaluateBatch(responses, testCases) {
        const results = {
            overallScore: 0,
            totalTests: testCases.length,
            testResults: [],
            patternAnalysis: {
                earlyModernParticles: { success: 0, total: 0 },
                questionStarts: { success: 0, total: 0 },
                dostThouUsage: { success: 0, total: 0 },
                temporalPatterns: {
                    'Sensory-Time': { success: 0, total: 0 },
                    'Event-Tethered': { success: 0, total: 0 },
                    'Abstract-Time': { success: 0, total: 0 }
                }
            },
            structuralAnalysis: {
                averageSentenceCount: 0,
                averageSentenceLength: 0,
                particlePositionDistribution: { start: 0, middle: 0, none: 0 },
                temporalReferenceDistribution: {},
                imperativeDistribution: { low: 0, medium: 0, high: 0 }
            }
        };

        let totalSentences = 0;
        let totalLength = 0;
        let totalImperatives = 0;

        // Evaluate each response
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const testCase = testCases[i];
            const evaluation = this.evaluateResponse(response, testCase.expectedPatterns);
            
            results.testResults.push({
                prompt: testCase.prompt,
                response,
                evaluation
            });

            // Update pattern analysis
            if (evaluation.matches.hasEarlyModernParticle) {
                results.patternAnalysis.earlyModernParticles.success++;
            }
            results.patternAnalysis.earlyModernParticles.total++;

            if (evaluation.matches.startsWithQuestion) {
                results.patternAnalysis.questionStarts.success++;
            }
            results.patternAnalysis.questionStarts.total++;

            if (evaluation.matches.usesDostThou) {
                results.patternAnalysis.dostThouUsage.success++;
            }
            results.patternAnalysis.dostThouUsage.total++;

            const temporalPattern = evaluation.details.temporalPattern.actual;
            if (temporalPattern && results.patternAnalysis.temporalPatterns[temporalPattern]) {
                if (evaluation.matches.temporalPattern) {
                    results.patternAnalysis.temporalPatterns[temporalPattern].success++;
                }
                results.patternAnalysis.temporalPatterns[temporalPattern].total++;
            }

            // Update structural analysis
            totalSentences += evaluation.structuralAnalysis.sentenceCount;
            totalLength += evaluation.structuralAnalysis.averageSentenceLength;
            totalImperatives += evaluation.structuralAnalysis.imperativeCount;

            // Update particle position distribution
            const particlePos = evaluation.structuralAnalysis.particlePosition;
            if (particlePos.found) {
                if (particlePos.isStart) {
                    results.structuralAnalysis.particlePositionDistribution.start++;
                } else {
                    results.structuralAnalysis.particlePositionDistribution.middle++;
                }
            } else {
                results.structuralAnalysis.particlePositionDistribution.none++;
            }

            // Update temporal reference distribution
            for (const [pattern, count] of Object.entries(evaluation.structuralAnalysis.temporalReferences)) {
                if (!results.structuralAnalysis.temporalReferenceDistribution[pattern]) {
                    results.structuralAnalysis.temporalReferenceDistribution[pattern] = 0;
                }
                results.structuralAnalysis.temporalReferenceDistribution[pattern] += count;
            }

            results.overallScore += evaluation.percentageScore;
        }

        // Calculate averages
        results.structuralAnalysis.averageSentenceCount = totalSentences / responses.length;
        results.structuralAnalysis.averageSentenceLength = totalLength / responses.length;
        
        // Calculate imperative distribution
        const avgImperatives = totalImperatives / responses.length;
        for (const result of results.testResults) {
            const imperativeCount = result.evaluation.structuralAnalysis.imperativeCount;
            if (imperativeCount < avgImperatives * 0.7) {
                results.structuralAnalysis.imperativeDistribution.low++;
            } else if (imperativeCount > avgImperatives * 1.3) {
                results.structuralAnalysis.imperativeDistribution.high++;
            } else {
                results.structuralAnalysis.imperativeDistribution.medium++;
            }
        }

        // Calculate final scores
        results.averageScore = results.overallScore / results.totalTests;
        
        // Calculate pattern success rates
        for (const [pattern, stats] of Object.entries(results.patternAnalysis)) {
            if (pattern === 'temporalPatterns') {
                for (const [tempPattern, tempStats] of Object.entries(stats)) {
                    if (tempStats.total > 0) {
                        tempStats.successRate = (tempStats.success / tempStats.total) * 100;
                    }
                }
            } else if (stats.total > 0) {
                stats.successRate = (stats.success / stats.total) * 100;
            }
        }

        return results;
    }
}

module.exports = ResponseEvaluator; 