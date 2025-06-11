const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Test prompts that should trigger RAG knowledge
const testPrompts = [
    // Specific political and courtly references
    "What do you know of the court's inner workings?",
    "How do you view the role of prophecy in shaping destiny?",
    "What can you tell me about the art of courtly manipulation?",
    
    // Specific metaphors and imagery
    "What do you see when you look at the night sky?",
    "How do you view the relationship between blood and power?",
    "What meaning do you find in the raven's call?",
    
    // Specific historical and literary references
    "What have you learned from Machiavelli's writings?",
    "How do you view the wisdom of the ancients?",
    "What can you tell me about the art of political prophecy?",
    
    // Specific psychological and emotional states
    "How do you view the nature of ambition?",
    "What drives you to act as you do?",
    "How do you understand the role of fate in our lives?",
    
    // Specific tactical and strategic elements
    "How do you approach the art of persuasion?",
    "What is your understanding of courtly wisdom?",
    "How do you view the role of timing in political action?",
    
    // Specific sensory and atmospheric elements
    "What do you hear in the silence of the night?",
    "How do you view the relationship between darkness and power?",
    "What meaning do you find in the sound of knocking?"
];

const SERVER_PORT = 3001;

async function verifyEndpoint() {
    try {
        const response = await axios.get(`http://localhost:${SERVER_PORT}/agents`);
        return response.status === 200;
    } catch (error) {
        console.error('Server is not running or endpoint is incorrect:', error.message);
        return false;
    }
}

async function runTest(ragEnabled) {
    console.log(`\nRunning test with RAG ${ragEnabled ? 'enabled' : 'disabled'}`);
    console.log('----------------------------------------\n');

    const results = [];

    for (const prompt of testPrompts) {
        console.log(`\nPrompt: ${prompt}`);
        
        const formData = new FormData();
        formData.append('text', prompt);
        formData.append('ragEnabled', ragEnabled.toString());
        formData.append('userId', 'test-user');
        formData.append('roomId', 'test-room');

        try {
            console.log(`Sending request with ragEnabled=${ragEnabled}...`);
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

async function main() {
    try {
        const isServerRunning = await verifyEndpoint();
        if (!isServerRunning) {
            console.error('Server is not running or endpoint is incorrect. Please start the server and try again.');
            return;
        }

        // Run test with RAG enabled
        console.log('\n=== Testing with RAG Enabled ===\n');
        const ragEnabledResults = await runTest(true);
        
        // Run test with RAG disabled
        console.log('\n=== Testing with RAG Disabled ===\n');
        const ragDisabledResults = await runTest(false);

        // Compare results
        const comparison = {
            timestamp: new Date().toISOString(),
            results: testPrompts.map((prompt, index) => {
                const enabledResponse = ragEnabledResults[index].response;
                const disabledResponse = ragDisabledResults[index].response;
                const areIdentical = enabledResponse === disabledResponse;
                
                if (areIdentical) {
                    console.warn(`\nWARNING: Responses identical for prompt: ${prompt}`);
                }

                return {
                    prompt,
                    ragEnabled: enabledResponse,
                    ragDisabled: disabledResponse,
                    identical: areIdentical
                };
            })
        };

        // Save results
        fs.writeFileSync('rag_comparison_results.json', JSON.stringify(comparison, null, 2));
        console.log('\nResults saved to rag_comparison_results.json');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

main(); 