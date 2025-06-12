#!/usr/bin/env node

/**
 * Simple Character Testing Script
 * Tests independent post generation via direct message API
 * Usage: node test-character-simple.js [character-name] [num-posts] [port]
 */

const http = require('http');
const fs = require('fs');

// Configuration
const config = {
    character: process.argv[2] || 'BitBard',
    numPosts: parseInt(process.argv[3]) || 5,
    port: parseInt(process.argv[4]) || 3001,
    delay: 3000, // 3 seconds between requests
    outputFile: `test-results-${new Date().toISOString().split('T')[0]}.json`
};

console.log(`🎭 Testing ${config.character} - ${config.numPosts} posts on port ${config.port}`);
console.log('=' * 60);

// Get agent info first
const getAgentInfo = () => {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${config.port}/agents`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const agents = JSON.parse(data);
                    console.log(`📊 Available agents:`, agents);
                    resolve(agents);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
};

// Send message to trigger response
const sendMessage = (agentId, messageText, postNumber) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            text: messageText,
            userId: 'test_system',
            userName: 'TestSystem'
        });

        const options = {
            hostname: 'localhost',
            port: config.port,
            path: `/${agentId}/message`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const startTime = Date.now();
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - startTime;
                try {
                    const response = JSON.parse(data);
                    resolve({
                        postNumber,
                        success: true,
                        duration,
                        statusCode: res.statusCode,
                        response,
                        timestamp: new Date().toISOString()
                    });
                } catch (e) {
                    resolve({
                        postNumber,
                        success: false,
                        duration,
                        statusCode: res.statusCode,
                        error: 'Parse error',
                        rawData: data,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                postNumber,
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

        req.write(postData);
        req.end();
    });
};

// Generate test prompts for independent posts
const generateTestPrompts = (numPosts, character) => {
    const prompts = [];
    
    if (character.toLowerCase().includes('bitbard')) {
        prompts.push(
            "Generate a theater cue for the troupe",
            "Issue a solo performance challenge",
            "Create a duel scenario between characters", 
            "Propose a chorus exercise",
            "Design a rewrite prompt",
            "Share theatrical wisdom",
            "Comment on dramatic timing",
            "Discuss the art of cues",
            "Reflect on character development",
            "Analyze performance quality"
        );
    } else if (character.toLowerCase().includes('macbeth')) {
        prompts.push(
            "Share your thoughts on power",
            "Discuss the nature of ambition",
            "Reflect on decisive action", 
            "Comment on strategic thinking",
            "Analyze the cost of greatness",
            "Speak about overcoming obstacles",
            "Discuss leadership challenges",
            "Share wisdom about determination",
            "Reflect on achieving goals",
            "Comment on strength and resolve"
        );
    } else {
        // Generic prompts
        prompts.push(
            "Share an interesting observation",
            "Tell us something insightful",
            "What's on your mind today?",
            "Share some wisdom",
            "Make an interesting comment",
            "Give us your perspective",
            "Share a thought-provoking idea",
            "Tell us something meaningful",
            "Share your viewpoint",
            "Express your thoughts"
        );
    }
    
    // Return requested number of prompts, cycling if needed
    return Array.from({length: numPosts}, (_, i) => prompts[i % prompts.length]);
};

// Analyze response for character consistency
const analyzeResponse = (response, prompt, postNumber) => {
    if (!response || !response[0] || !response[0].text) {
        return { error: 'No valid response text found' };
    }
    
    const text = response[0].text;
    const user = response[0].user;
    
    return {
        postNumber,
        prompt,
        response: text,
        character: user,
        length: text.length,
        wordCount: text.split(/\s+/).length,
        hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(text),
        hasQuestionMark: text.includes('?'),
        hasExclamation: text.includes('!'),
        characterMarkers: detectCharacterMarkers(text, user),
        timestamp: new Date().toISOString()
    };
};

// Detect character-specific markers
const detectCharacterMarkers = (text, characterName) => {
    const markers = [];
    
    if (characterName && characterName.toLowerCase().includes('bitbard')) {
        if (text.includes('🎭')) markers.push('theater_emoji');
        if (/cue:/i.test(text)) markers.push('cue_directive');
        if (/\b(solo|duel|chorus|wildcard|rewrite)\b/i.test(text)) markers.push('cue_types');
        if (/\b(stage|theater|theatre|performance|act|scene)\b/i.test(text)) markers.push('theatrical_vocabulary');
    } else if (characterName && characterName.toLowerCase().includes('macbeth')) {
        if (/\b(power|crown|throne|ambition|will|strength)\b/i.test(text)) markers.push('power_vocabulary');
        if (/\b(thou|thy|thee|hath|doth)\b/i.test(text)) markers.push('archaic_english');
        if (/\b(deed|blood|steel|resolve)\b/i.test(text)) markers.push('intensity_words');
    }
    
    return markers;
};

// Main execution
const main = async () => {
    const results = [];
    
    try {
        // Get agent information
        console.log('🔍 Getting agent information...');
        const agentInfo = await getAgentInfo();
        
        if (!agentInfo.agents || agentInfo.agents.length === 0) {
            throw new Error('No agents found');
        }
        
        const agent = agentInfo.agents[0]; // Use first available agent
        console.log(`✅ Using agent: ${agent.name} (${agent.id})`);
        
        // Generate test prompts
        const prompts = generateTestPrompts(config.numPosts, agent.name);
        console.log(`📝 Generated ${prompts.length} test prompts\n`);
        
        // Run tests
        for (let i = 0; i < config.numPosts; i++) {
            const prompt = prompts[i];
            console.log(`🎯 Test ${i + 1}/${config.numPosts}: "${prompt}"`);
            
            try {
                const result = await sendMessage(agent.id, prompt, i + 1);
                
                if (result.success) {
                    const analysis = analyzeResponse(result.response, prompt, i + 1);
                    result.analysis = analysis;
                    
                    console.log(`   ✅ Response (${result.duration}ms): "${analysis.response?.substring(0, 100)}${analysis.response?.length > 100 ? '...' : ''}"`);
                    console.log(`   📊 Length: ${analysis.length} chars, Markers: [${analysis.characterMarkers.join(', ')}]`);
                } else {
                    console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
                }
                
                results.push(result);
                
                // Wait between requests (except for last one)
                if (i < config.numPosts - 1) {
                    console.log(`   ⏱️  Waiting ${config.delay/1000}s...\n`);
                    await new Promise(resolve => setTimeout(resolve, config.delay));
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                results.push({
                    postNumber: i + 1,
                    success: false,
                    error: error.message,
                    prompt,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Generate summary
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successful.length}/${config.numPosts} (${(successful.length/config.numPosts*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${failed.length}`);
        
        if (successful.length > 0) {
            const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
            const avgLength = successful.reduce((sum, r) => sum + (r.analysis?.length || 0), 0) / successful.length;
            const totalMarkers = successful.reduce((sum, r) => sum + (r.analysis?.characterMarkers?.length || 0), 0);
            
            console.log(`⏱️  Average response time: ${avgDuration.toFixed(0)}ms`);
            console.log(`📝 Average response length: ${avgLength.toFixed(0)} characters`);
            console.log(`🎭 Total character markers found: ${totalMarkers}`);
            
            // Show character consistency
            const responses = successful.map(r => r.analysis?.response).filter(Boolean);
            if (responses.length > 1) {
                console.log(`🔄 Response variety: ${responses.length} unique responses`);
            }
        }
        
        // Save results
        const output = {
            meta: {
                character: agent.name,
                agentId: agent.id,
                testDate: new Date().toISOString(),
                requestedPosts: config.numPosts,
                successfulPosts: successful.length,
                failedPosts: failed.length
            },
            results
        };
        
        fs.writeFileSync(config.outputFile, JSON.stringify(output, null, 2));
        console.log(`\n📄 Results saved to: ${config.outputFile}`);
        
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
};

// Run the test
main().catch(console.error); 