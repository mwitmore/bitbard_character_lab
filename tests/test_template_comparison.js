const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Test prompts that should trigger different response patterns
const testPrompts = [
    // Questions that should be transformed
    "What do you think about power?",
    "How do you view ambition?",
    "Why do you act this way?",
    
    // Statements that should be enhanced
    "Power is important.",
    "The night is dark.",
    "The court is dangerous.",
    
    // Complex queries that should follow patterns
    "Tell me about your plans for the future.",
    "What advice would you give about ruling?",
    "How should one approach court politics?",
    
    // Emotional queries that should maintain tone
    "I'm afraid of the consequences.",
    "The guilt is overwhelming.",
    "The future seems uncertain.",
    
    // Strategic queries that should use metaphors
    "How do we proceed?",
    "What's the next step?",
    "When should we act?"
];

const SERVER_PORT = 3000;

async function verifyEndpoint() {
    try {
        const response = await axios.get(`http://localhost:${SERVER_PORT}/agents`);
        return response.status === 200;
    } catch (error) {
        console.error('Server is not running or endpoint is incorrect:', error.message);
        return false;
    }
}

async function runTest(templateEnabled) {
    console.log(`\nRunning test with templates ${templateEnabled ? 'enabled' : 'disabled'}`);
    console.log('----------------------------------------\n');

    const results = [];

    for (const prompt of testPrompts) {
        console.log(`\nPrompt: ${prompt}`);
        
        const formData = new FormData();
        formData.append('text', prompt);
        formData.append('templateEnabled', templateEnabled.toString());
        formData.append('userId', 'test-user');
        formData.append('roomId', 'test-room');

        try {
            console.log(`Sending request with templateEnabled=${templateEnabled}...`);
            const response = await axios.post(`http://localhost:${SERVER_PORT}/Lady%20Macbeth/message`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            if (!response.data || !response.data[0] || !response.data[0].text) {
                throw new Error('Invalid response format');
            }

            const responseText = response.data[0].text;
            console.log(`Response: ${responseText}`);
            results.push({
                prompt,
                response: responseText
            });
        } catch (error) {
            console.error(`Error with prompt "${prompt}":`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    }

    return results;
}

function analyzeResponse(response) {
    const analysis = {
        startsWithQuestion: response.trim().startsWith('?') || response.trim().startsWith('What') || response.trim().startsWith('How') || response.trim().startsWith('Why'),
        usesDostThou: response.includes('dost thou') || response.includes('Dost thou'),
        followsPattern: false,
        patternType: null,
        temporalPattern: analyzeTemporalPattern(response)
    };

    // Check for response patterns
    const patterns = [
        { type: 'Statement-Question', regex: /^[^?]+\.[^?]+\?$/ },
        { type: 'Metaphor-Command', regex: /^[^!]+\.[^!]+!$/ },
        { type: 'Observation-Imperative', regex: /^[^!]+\.[^!]+!$/ },
        { type: 'Prophecy-Strategy', regex: /^[^!]+\.[^!]+!$/ },
        { type: 'Challenge-Instruction', regex: /^[^!]+\.[^!]+!$/ },
        { type: 'Declaration-Consequence', regex: /^[^!]+\.[^!]+!$/ }
    ];

    for (const pattern of patterns) {
        if (pattern.regex.test(response)) {
            analysis.followsPattern = true;
            analysis.patternType = pattern.type;
            break;
        }
    }

    return analysis;
}

function analyzeTemporalPattern(response) {
    // Sensory time markers
    const sensoryPatterns = {
        light: /(candle|flame|torch|light|dark|shadow|gutter|flicker)/i,
        sound: /(still|silence|wind|breath|knock|echo)/i,
        room: /(chamber|hall|room|air|close|thicken)/i,
        body: /(pulse|breath|heart|blood|sweat)/i
    };

    // Event-driven markers
    const eventPatterns = {
        feast: /(wine|feast|toast|guest|banquet)/i,
        sleep: /(sleep|dream|watch|night|dawn|cock)/i,
        ritual: /(wash|cleanse|purify|ritual|ceremony)/i
    };

    // Abstract time markers
    const abstractPatterns = {
        moment: /(moment|instant|hour|time|now|soon)/i,
        future: /(future|tomorrow|next|coming|ahead)/i,
        past: /(done|finished|completed|ended|before)/i
    };

    // Check for patterns
    const patterns = {
        'Sensory-Time': Object.values(sensoryPatterns).some(pattern => pattern.test(response)),
        'Event-Tethered': Object.values(eventPatterns).some(pattern => pattern.test(response)),
        'Abstract-Time': Object.values(abstractPatterns).some(pattern => pattern.test(response))
    };

    // Determine the dominant pattern
    const dominantPattern = Object.entries(patterns)
        .filter(([_, present]) => present)
        .map(([type]) => type);

    return dominantPattern.length > 0 ? dominantPattern[0] : 'Absent';
}

async function main() {
    try {
        const isServerRunning = await verifyEndpoint();
        if (!isServerRunning) {
            console.error('Server is not running or endpoint is incorrect. Please start the server and try again.');
            return;
        }

        // Run test with templates enabled
        console.log('\n=== Testing with Templates Enabled ===\n');
        const templateEnabledResults = await runTest(true);
        
        // Run test with templates disabled
        console.log('\n=== Testing with Templates Disabled ===\n');
        const templateDisabledResults = await runTest(false);

        // Compare results
        const comparison = {
            timestamp: new Date().toISOString(),
            results: testPrompts.map((prompt, index) => {
                const enabledResponse = templateEnabledResults[index].response;
                const disabledResponse = templateDisabledResults[index].response;
                const enabledAnalysis = analyzeResponse(enabledResponse);
                const disabledAnalysis = analyzeResponse(disabledResponse);
                
                return {
                    prompt,
                    templateEnabled: {
                        response: enabledResponse,
                        analysis: enabledAnalysis
                    },
                    templateDisabled: {
                        response: disabledResponse,
                        analysis: disabledAnalysis
                    }
                };
            })
        };

        // Calculate statistics
        const stats = {
            templateEnabled: {
                startsWithQuestion: 0,
                usesDostThou: 0,
                followsPattern: 0,
                patternTypes: {},
                temporalPatterns: {
                    'Sensory-Time': 0,
                    'Event-Tethered': 0,
                    'Abstract-Time': 0,
                    'Absent': 0
                }
            },
            templateDisabled: {
                startsWithQuestion: 0,
                usesDostThou: 0,
                followsPattern: 0,
                patternTypes: {},
                temporalPatterns: {
                    'Sensory-Time': 0,
                    'Event-Tethered': 0,
                    'Abstract-Time': 0,
                    'Absent': 0
                }
            }
        };

        comparison.results.forEach(result => {
            // Template enabled stats
            if (result.templateEnabled.analysis.startsWithQuestion) stats.templateEnabled.startsWithQuestion++;
            if (result.templateEnabled.analysis.usesDostThou) stats.templateEnabled.usesDostThou++;
            if (result.templateEnabled.analysis.followsPattern) {
                stats.templateEnabled.followsPattern++;
                stats.templateEnabled.patternTypes[result.templateEnabled.analysis.patternType] = 
                    (stats.templateEnabled.patternTypes[result.templateEnabled.analysis.patternType] || 0) + 1;
            }
            stats.templateEnabled.temporalPatterns[result.templateEnabled.analysis.temporalPattern]++;

            // Template disabled stats
            if (result.templateDisabled.analysis.startsWithQuestion) stats.templateDisabled.startsWithQuestion++;
            if (result.templateDisabled.analysis.usesDostThou) stats.templateDisabled.usesDostThou++;
            if (result.templateDisabled.analysis.followsPattern) {
                stats.templateDisabled.followsPattern++;
                stats.templateDisabled.patternTypes[result.templateDisabled.analysis.patternType] = 
                    (stats.templateDisabled.patternTypes[result.templateDisabled.analysis.patternType] || 0) + 1;
            }
            stats.templateDisabled.temporalPatterns[result.templateDisabled.analysis.temporalPattern]++;
        });

        comparison.statistics = stats;

        // Save results
        fs.writeFileSync('template_comparison_results.json', JSON.stringify(comparison, null, 2));
        console.log('\nResults saved to template_comparison_results.json');
        
        // Print summary
        console.log('\n=== Template Effect Summary ===');
        console.log('\nWith Templates:');
        console.log(`- Starts with question: ${stats.templateEnabled.startsWithQuestion}/${testPrompts.length}`);
        console.log(`- Uses "dost thou": ${stats.templateEnabled.usesDostThou}/${testPrompts.length}`);
        console.log(`- Follows pattern: ${stats.templateEnabled.followsPattern}/${testPrompts.length}`);
        console.log('Pattern distribution:', stats.templateEnabled.patternTypes);
        console.log('Temporal pattern distribution:', stats.templateEnabled.temporalPatterns);
        
        console.log('\nWithout Templates:');
        console.log(`- Starts with question: ${stats.templateDisabled.startsWithQuestion}/${testPrompts.length}`);
        console.log(`- Uses "dost thou": ${stats.templateDisabled.usesDostThou}/${testPrompts.length}`);
        console.log(`- Follows pattern: ${stats.templateDisabled.followsPattern}/${testPrompts.length}`);
        console.log('Pattern distribution:', stats.templateDisabled.patternTypes);
        console.log('Temporal pattern distribution:', stats.templateDisabled.temporalPatterns);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

main(); 