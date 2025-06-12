#!/usr/bin/env node

/**
 * Character Post Testing Framework
 * Generates and evaluates independent posts for character development
 * Usage: node test-character-posts.js [character-name] [num-posts] [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    defaultPosts: 10,
    defaultPort: 3001,
    defaultCharacter: 'BitBard',
    timeout: 30000, // 30 seconds per request
    outputDir: 'test-results',
    delayBetweenPosts: 2000 // 2 seconds between post generations
};

// Test session metadata
const SESSION = {
    startTime: new Date(),
    character: process.argv[2] || CONFIG.defaultCharacter,
    numPosts: parseInt(process.argv[3]) || CONFIG.defaultPosts,
    port: parseInt(process.argv[4]) || CONFIG.defaultPort,
    results: [],
    errors: []
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Utility functions
const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${message}`;
    console.log(logMessage);
    return logMessage;
};

const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(CONFIG.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
};

// Post generation function
const generatePost = async (postNumber) => {
    log(`Generating post ${postNumber}/${SESSION.numPosts} for ${SESSION.character}`);
    
    const startTime = Date.now();
    
    try {
        // Trigger post generation via API
        const response = await makeRequest({
            hostname: 'localhost',
            port: SESSION.port,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            type: 'independent_post',
            context: `Test post generation ${postNumber}`,
            timestamp: new Date().toISOString()
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
            postNumber,
            timestamp: new Date().toISOString(),
            duration,
            success: response.statusCode === 200,
            statusCode: response.statusCode,
            content: response.data,
            characterAnalysis: await analyzePost(response.data, postNumber)
        };

        SESSION.results.push(result);
        
        if (result.success) {
            log(`✅ Post ${postNumber} generated successfully (${duration}ms)`);
            log(`📝 Content preview: "${truncateText(extractPostContent(response.data), 100)}"`);
        } else {
            log(`❌ Post ${postNumber} failed: ${response.statusCode}`, 'ERROR');
            SESSION.errors.push(`Post ${postNumber}: HTTP ${response.statusCode}`);
        }

        return result;

    } catch (error) {
        const result = {
            postNumber,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            success: false,
            error: error.message,
            characterAnalysis: null
        };

        SESSION.results.push(result);
        SESSION.errors.push(`Post ${postNumber}: ${error.message}`);
        log(`❌ Post ${postNumber} error: ${error.message}`, 'ERROR');
        
        return result;
    }
};

// Extract post content from API response
const extractPostContent = (responseData) => {
    if (typeof responseData === 'string') return responseData;
    if (responseData.content) return responseData.content;
    if (responseData.text) return responseData.text;
    if (responseData.message) return responseData.message;
    return JSON.stringify(responseData);
};

// Post analysis function
const analyzePost = async (postData, postNumber) => {
    const content = extractPostContent(postData);
    
    return {
        length: content.length,
        wordCount: content.split(/\s+/).length,
        hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content),
        hasHashtags: content.includes('#'),
        hasMentions: content.includes('@'),
        hasQuestionMark: content.includes('?'),
        hasExclamation: content.includes('!'),
        characterSpecific: analyzeCharacterSpecificElements(content, SESSION.character),
        sentiment: classifySentiment(content),
        uniqueness: assessUniqueness(content, postNumber)
    };
};

// Character-specific analysis
const analyzeCharacterSpecificElements = (content, character) => {
    const analysis = { 
        characterMarkers: [],
        score: 0,
        notes: []
    };

    switch (character.toLowerCase()) {
        case 'bitbard':
            // BitBard-specific markers
            if (content.includes('🎭')) {
                analysis.characterMarkers.push('theater_emoji');
                analysis.score += 2;
            }
            if (/cue:/i.test(content)) {
                analysis.characterMarkers.push('cue_directive');
                analysis.score += 3;
            }
            if (/\b(solo|duel|chorus|wildcard|rewrite)\b/i.test(content)) {
                analysis.characterMarkers.push('cue_type');
                analysis.score += 2;
            }
            if (/shakespeare|bard|stage|theater|theatre|act|scene/i.test(content)) {
                analysis.characterMarkers.push('theatrical_vocabulary');
                analysis.score += 1;
            }
            break;
            
        case 'ladymacbeth':
        case 'lady macbeth':
            // Lady Macbeth-specific markers
            if (/\b(power|crown|throne|blood|deed|will|steel)\b/i.test(content)) {
                analysis.characterMarkers.push('power_vocabulary');
                analysis.score += 1;
            }
            if (/\b(thou|thy|thee|hath|doth)\b/i.test(content)) {
                analysis.characterMarkers.push('early_modern_english');
                analysis.score += 2;
            }
            break;
    }

    // Calculate final score (0-10 scale)
    analysis.score = Math.min(10, analysis.score);
    
    if (analysis.score >= 7) analysis.notes.push('Strong character voice');
    else if (analysis.score >= 4) analysis.notes.push('Moderate character consistency');
    else analysis.notes.push('Weak character markers');

    return analysis;
};

// Simple sentiment classification
const classifySentiment = (content) => {
    const positive = /\b(good|great|excellent|wonderful|amazing|love|joy|happy|success|win|victory)\b/i;
    const negative = /\b(bad|terrible|awful|hate|sad|fail|loss|defeat|anger|rage|blood|death)\b/i;
    
    const posMatch = content.match(positive);
    const negMatch = content.match(negative);
    
    if (posMatch && !negMatch) return 'positive';
    if (negMatch && !posMatch) return 'negative';
    if (posMatch && negMatch) return 'mixed';
    return 'neutral';
};

// Assess uniqueness compared to previous posts
const assessUniqueness = (content, postNumber) => {
    if (postNumber === 1) return { score: 10, note: 'First post' };
    
    const previousPosts = SESSION.results
        .slice(0, postNumber - 1)
        .filter(r => r.success)
        .map(r => extractPostContent(r.content));
    
    let similarityCount = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    previousPosts.forEach(prevPost => {
        const prevWords = prevPost.toLowerCase().split(/\s+/);
        const commonWords = words.filter(word => 
            word.length > 3 && prevWords.includes(word)
        );
        if (commonWords.length > words.length * 0.3) {
            similarityCount++;
        }
    });
    
    const uniquenessScore = Math.max(0, 10 - (similarityCount * 2));
    return {
        score: uniquenessScore,
        similarPosts: similarityCount,
        note: uniquenessScore >= 8 ? 'Highly unique' : 
              uniquenessScore >= 6 ? 'Moderately unique' : 'Low uniqueness'
    };
};

// Utility function
const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Generate comprehensive report
const generateReport = () => {
    const endTime = new Date();
    const duration = (endTime - SESSION.startTime) / 1000;
    
    const successful = SESSION.results.filter(r => r.success);
    const failed = SESSION.results.filter(r => !r.success);
    
    // Calculate averages
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length || 0;
    const avgLength = successful.reduce((sum, r) => sum + (r.characterAnalysis?.length || 0), 0) / successful.length || 0;
    const avgCharacterScore = successful.reduce((sum, r) => sum + (r.characterAnalysis?.characterSpecific?.score || 0), 0) / successful.length || 0;
    const avgUniqueness = successful.reduce((sum, r) => sum + (r.characterAnalysis?.uniqueness?.score || 0), 0) / successful.length || 0;

    const report = {
        meta: {
            character: SESSION.character,
            testDuration: `${duration.toFixed(2)}s`,
            timestamp: endTime.toISOString(),
            requestedPosts: SESSION.numPosts,
            successfulPosts: successful.length,
            failedPosts: failed.length,
            successRate: `${((successful.length / SESSION.numPosts) * 100).toFixed(1)}%`
        },
        performance: {
            averageGenerationTime: `${avgDuration.toFixed(0)}ms`,
            averagePostLength: Math.round(avgLength),
            totalErrors: SESSION.errors.length
        },
        characterAnalysis: {
            averageCharacterScore: avgCharacterScore.toFixed(1),
            averageUniquenessScore: avgUniqueness.toFixed(1),
            sentimentDistribution: calculateSentimentDistribution(successful),
            commonPatterns: identifyCommonPatterns(successful)
        },
        posts: SESSION.results.map(r => ({
            postNumber: r.postNumber,
            success: r.success,
            duration: r.duration,
            content: r.success ? truncateText(extractPostContent(r.content), 200) : null,
            characterScore: r.characterAnalysis?.characterSpecific?.score || 0,
            uniquenessScore: r.characterAnalysis?.uniqueness?.score || 0,
            sentiment: r.characterAnalysis?.sentiment || 'unknown',
            error: r.error || null
        })),
        errors: SESSION.errors,
        recommendations: generateRecommendations(successful, failed)
    };

    return report;
};

// Helper functions for report generation
const calculateSentimentDistribution = (posts) => {
    const sentiments = posts.map(p => p.characterAnalysis?.sentiment || 'unknown');
    const distribution = {};
    sentiments.forEach(s => distribution[s] = (distribution[s] || 0) + 1);
    return distribution;
};

const identifyCommonPatterns = (posts) => {
    // Simple pattern identification
    const patterns = [];
    const allContent = posts.map(p => extractPostContent(p.content)).join(' ');
    
    // Check for emoji usage
    const emojiCount = (allContent.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu) || []).length;
    if (emojiCount > 0) patterns.push(`Uses emojis frequently (${emojiCount} total)`);
    
    // Check for question usage
    const questionCount = (allContent.match(/\?/g) || []).length;
    if (questionCount > posts.length * 0.3) patterns.push('Frequently asks questions');
    
    return patterns;
};

const generateRecommendations = (successful, failed) => {
    const recommendations = [];
    
    if (failed.length > successful.length * 0.2) {
        recommendations.push('High failure rate detected - check API endpoint and character configuration');
    }
    
    const avgCharScore = successful.reduce((sum, r) => sum + (r.characterAnalysis?.characterSpecific?.score || 0), 0) / successful.length || 0;
    if (avgCharScore < 5) {
        recommendations.push('Low character consistency - consider enhancing character-specific knowledge or prompts');
    }
    
    const avgUniqueness = successful.reduce((sum, r) => sum + (r.characterAnalysis?.uniqueness?.score || 0), 0) / successful.length || 0;
    if (avgUniqueness < 6) {
        recommendations.push('Low post uniqueness - character may be repeating patterns');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Character performance looks good - consider testing with more posts or different scenarios');
    }
    
    return recommendations;
};

// Main execution
const main = async () => {
    log(`🎭 Starting Character Post Testing for ${SESSION.character}`);
    log(`📊 Configuration: ${SESSION.numPosts} posts on port ${SESSION.port}`);
    log(`📁 Results will be saved to: ${CONFIG.outputDir}/`);
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎭 INDEPENDENT POST TESTING: ${SESSION.character.toUpperCase()}`);
    console.log('='.repeat(60));
    
    // Generate posts with delays
    for (let i = 1; i <= SESSION.numPosts; i++) {
        await generatePost(i);
        
        // Add delay between posts (except for the last one)
        if (i < SESSION.numPosts) {
            log(`⏱️  Waiting ${CONFIG.delayBetweenPosts/1000}s before next post...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPosts));
        }
    }
    
    // Generate and save report
    const report = generateReport();
    const filename = `${CONFIG.outputDir}/${SESSION.character.toLowerCase()}-posts-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful Posts: ${report.meta.successfulPosts}/${report.meta.requestedPosts} (${report.meta.successRate})`);
    console.log(`⏱️  Average Generation Time: ${report.performance.averageGenerationTime}`);
    console.log(`📝 Average Post Length: ${report.performance.averagePostLength} characters`);
    console.log(`🎭 Character Consistency Score: ${report.characterAnalysis.averageCharacterScore}/10`);
    console.log(`🔄 Uniqueness Score: ${report.characterAnalysis.averageUniquenessScore}/10`);
    
    if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
    }
    
    console.log(`\n📄 Full report saved to: ${filename}`);
    
    if (SESSION.errors.length > 0) {
        console.log(`\n❌ Errors encountered: ${SESSION.errors.length}`);
        SESSION.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    log(`🎭 Testing completed for ${SESSION.character}`);
};

// Run the test
if (require.main === module) {
    main().catch(error => {
        log(`Fatal error: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

module.exports = { generatePost, analyzePost, generateReport }; 