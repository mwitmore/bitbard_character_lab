import axios from 'axios';

const SERVER_PORT = 3000;
// Use the actual agent ID from the logs instead of the name
const AGENT_ID = '6abb2b06-2083-0114-a00a-e9cc14bdbc0a'; // Lady Macbeth's actual UUID
const MAX_RETRIES = 2; // Reduced retries since responses are slow
const RETRY_DELAY = 3000; // 3 seconds between retries
const MESSAGE_TIMEOUT = 30000; // 30 seconds timeout per message

// Timing constraints from character configuration
const TIMING = {
  responseWindows: {
    acknowledgment: 1800, // 30 minutes
    fullResponse: 7200    // 2 hours
  },
  cooldowns: {
    betweenResponses: 3600, // 1 hour
    sameCharacter: 7200     // 2 hours
  },
  postingLimits: {
    maxPostsPerDay: 48,
    minTimeBetweenPosts: 900,  // 15 minutes
    maxTimeBetweenPosts: 1800  // 30 minutes
  }
};

// Test scenarios for three-day simulation
const testScenarios = [
  {
    name: "Day 1 - Morning Cue Response",
    description: "Test response to BitBard's 8 AM MT cue",
    messages: [
      "🎭 Cue: Solo\n@bbo_LadyMacbeth\nThe line is: 'The raven himself is hoarse that croaks the fatal entrance of Duncan under my battlements.' Speak as if the deed were already done.",
      "What think you of this task?",
      "The hour grows late. What must be done?"
    ],
    expectedBehavior: "Should respond with escalating intensity, using Pattern A (Question-Demolish-Rebuild)"
  },
  {
    name: "Day 1 - Evening Response",
    description: "Test response during peak activity hours",
    messages: [
      "🎭 Cue: Duel\n@bbo_LadyMacbeth vs @bbo_Macbeth\nTopic: The crown hangs low. Who will pluck it first?",
      "I fear the consequences.",
      "What if we are discovered?"
    ],
    expectedBehavior: "Should use Pattern E (Time Pressure Escalation) and Pattern B (Escalating Metaphor Chain)"
  },
  {
    name: "Day 2 - Midnight Response",
    description: "Test response during special midnight timing",
    messages: [
      "🎭 Cue: Chorus\n@bbo_LadyMacbeth\nTheme: The night is long, but darker deeds await.",
      "The guards are heavy with drink.",
      "The way is clear."
    ],
    expectedBehavior: "Should use Pattern C (Contrast and Consequence) with increased posting frequency"
  },
  {
    name: "Day 2 - Early Morning",
    description: "Test response near end of active hours",
    messages: [
      "🎭 Cue: Rewrite\n@bbo_LadyMacbeth\nLine: 'Out, damned spot!' Rewrite as if the spot were ambition itself.",
      "I cannot bear this guilt.",
      "The blood will not wash away."
    ],
    expectedBehavior: "Should use Pattern D (False Sympathy Into Command)"
  },
  {
    name: "Day 3 - Full Moon",
    description: "Test response during special full moon timing",
    messages: [
      "🎭 Cue: Wildcard\n@bbo_LadyMacbeth\nConstraint: Speak as if the moon itself were your witness.",
      "The night is bright with purpose.",
      "What must be done cannot be undone."
    ],
    expectedBehavior: "Should use Pattern F (Destiny and Character) with 2x posting frequency"
  }
];

// Function to send message to agent with retry logic
async function sendMessage(text, roomId = 'test-room', retryCount = 0) {
  try {
    console.log(`    🔄 Sending message (attempt ${retryCount + 1}): "${text}"`);
    
    const startTime = Date.now();
    // Use the correct endpoint format with longer timeout
    const response = await axios.post(`http://localhost:${SERVER_PORT}/${AGENT_ID}/message`, {
      text: text,
      roomId: roomId,
      userId: 'test-user'
    }, {
      timeout: MESSAGE_TIMEOUT, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`    ⏱️  Response time: ${responseTime}ms`);
    
    return { ...response.data, responseTime };
  } catch (error) {
    console.log(`    ❌ Error (attempt ${retryCount + 1}): ${error.message}`);
    
    if (error.response) {
      console.log(`    📄 Response status: ${error.response.status}`);
      console.log(`    📄 Response data:`, error.response.data);
    }
    
    // Retry logic
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`    ⏳ Retrying in ${RETRY_DELAY/1000}s...`);
      await wait(RETRY_DELAY);
      return sendMessage(text, roomId, retryCount + 1);
    }
    
    return null;
  }
}

// Function to wait for specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced server health check with realistic expectations
async function checkServerHealth() {
  const healthChecks = [
    {
      name: "Basic HTTP Response",
      test: () => axios.get(`http://localhost:${SERVER_PORT}/`, { timeout: 5000 })
    },
    {
      name: "Agent Message Endpoint (Sample)", 
      test: () => axios.post(`http://localhost:${SERVER_PORT}/${AGENT_ID}/message`, {
        text: "health check",
        roomId: "health-check-room",
        userId: "health-check-user"
      }, { timeout: MESSAGE_TIMEOUT })
    }
  ];

  const results = [];
  
  for (const check of healthChecks) {
    try {
      const startTime = Date.now();
      const response = await check.test();
      const responseTime = Date.now() - startTime;
      
      results.push({
        name: check.name,
        status: 'PASS',
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      });
    } catch (error) {
      results.push({
        name: check.name,
        status: 'FAIL',
        error: error.message,
        statusCode: error.response?.status || 'NO_RESPONSE'
      });
    }
  }
  
  return results;
}

// Function to analyze response for character traits
function analyzeResponse(response, inputMessage) {
  if (!response || !response[0] || typeof response[0].text !== 'string') {
    return {
      valid: false,
      error: 'Invalid response format'
    };
  }
  
  const text = response[0].text;
  const responseTime = response.responseTime || 0;
  
  const analysis = {
    valid: true,
    startsWithQuestion: /^[^.!]*\?/.test(text.trim()),
    usesEarlyModernSyntax: /\b(thou|thee|thy|dost|wouldst|canst|'st)\b/i.test(text),
    showsAuthority: /\b(command|seize|act|deed|power|strength|must|shall|will)\b/i.test(text),
    avoidsQuestions: !/\?/.test(text),
    responseLength: text.length,
    wordCount: text.split(/\s+/).length,
    hasDeclarativeStructure: /^[A-Z][^?]*[.!]$/.test(text.trim()),
    usesImperatives: /\b(act|seize|speak|choose|come|go|be|do)\b/i.test(text),
    responseTime: responseTime,
    hasCorrectAction: response[0].action === 'NONE' || response[0].action === 'CONTINUE'
  };
  
  return analysis;
}

// Enhanced timing analysis
function analyzeTiming(response, scenario, previousResponses) {
  const now = new Date();
  const hour = now.getHours();
  const isActiveHours = hour >= 18 || hour < 6;
  const isPeakHours = hour >= 22 || hour < 2;
  const isFullMoon = false; // TODO: Implement lunar cycle check
  const isMidnight = hour === 0;
  
  const timingAnalysis = {
    valid: true,
    withinActiveHours: isActiveHours,
    withinPeakHours: isPeakHours,
    respectsCooldown: true,
    specialTiming: {
      isFullMoon,
      isMidnight,
      postingFrequency: 1.0
    }
  };

  // Check cooldown periods
  if (previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const timeSinceLastResponse = now - new Date(lastResponse.timestamp);
    timingAnalysis.respectsCooldown = timeSinceLastResponse >= TIMING.cooldowns.betweenResponses;
  }

  // Adjust posting frequency for special timing
  if (isFullMoon) {
    timingAnalysis.specialTiming.postingFrequency = 2.0;
  } else if (isMidnight) {
    timingAnalysis.specialTiming.postingFrequency = 1.5;
  }

  return timingAnalysis;
}

// Enhanced test runner with realistic performance expectations
async function runComprehensiveTest() {
  console.log('🎭 LADY MACBETH THREE-DAY SIMULATION');
  console.log('====================================\n');

  // Server health check
  console.log('🔍 Checking server health...');
  const healthResults = await checkServerHealth();
  
  let serverHealthy = true;
  healthResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${result.name}: ${result.status}`);
    if (result.responseTime) console.log(`      Response time: ${result.responseTime}`);
    if (result.status === 'FAIL') {
      console.log(`      Error: ${result.error}`);
      serverHealthy = false;
    }
  });

  if (!serverHealthy) {
    console.log('\n❌ Server health checks failed. Aborting simulation.\n');
    return;
  }

  console.log('\n✅ Server healthy. Beginning three-day simulation...\n');

  const testResults = [];
  const previousResponses = [];
  let day = 1;
  let totalResponses = 0;

  for (const scenario of testScenarios) {
    console.log(`\n📅 Day ${day} - ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log(`🎯 Expected: ${scenario.expectedBehavior}\n`);

    for (const message of scenario.messages) {
      console.log(`\n💬 Testing message: "${message}"`);
      
      const response = await sendMessage(message);
      if (!response) {
        console.log('❌ Failed to get response');
        continue;
      }

      const analysis = analyzeResponse(response, message);
      const timingAnalysis = analyzeTiming(response, scenario, previousResponses);

      // Store response for cooldown tracking
      previousResponses.push({
        timestamp: new Date(),
        message,
        response: response[0].text
      });

      // Log analysis results
      console.log('\n📊 Response Analysis:');
      console.log(`   Valid Format: ${analysis.valid ? '✅' : '❌'}`);
      console.log(`   Character Voice: ${analysis.usesEarlyModernSyntax ? '✅' : '❌'}`);
      console.log(`   Authority Level: ${analysis.showsAuthority ? '✅' : '❌'}`);
      console.log(`   Response Length: ${analysis.wordCount} words`);
      
      console.log('\n⏰ Timing Analysis:');
      console.log(`   Active Hours: ${timingAnalysis.withinActiveHours ? '✅' : '❌'}`);
      console.log(`   Peak Hours: ${timingAnalysis.withinPeakHours ? '✅' : '❌'}`);
      console.log(`   Cooldown Respected: ${timingAnalysis.respectsCooldown ? '✅' : '❌'}`);
      console.log(`   Special Timing: ${timingAnalysis.specialTiming.isFullMoon ? 'Full Moon' : 
                                         timingAnalysis.specialTiming.isMidnight ? 'Midnight' : 'Normal'}`);
      console.log(`   Posting Frequency: ${timingAnalysis.specialTiming.postingFrequency}x`);

      totalResponses++;
      
      // Wait for cooldown period
      console.log(`\n⏳ Waiting for cooldown period (${TIMING.cooldowns.betweenResponses/1000}s)...`);
      await wait(TIMING.cooldowns.betweenResponses);
    }

    day++;
  }

  // Summary
  console.log('\n📈 SIMULATION SUMMARY');
  console.log('===================');
  console.log(`Total Responses: ${totalResponses}`);
  console.log(`Days Simulated: ${day - 1}`);
  console.log(`Average Responses per Day: ${(totalResponses / (day - 1)).toFixed(1)}`);
  console.log('\n✅ Simulation complete');
}

// Run the enhanced test
runComprehensiveTest().catch(error => {
  console.error('\n💥 Test runner crashed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}); 