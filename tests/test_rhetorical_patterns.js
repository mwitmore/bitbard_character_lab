import axios from 'axios';

const SERVER_PORT = 3000;
const AGENT_ID = '6abb2b06-2083-0114-a00a-e9cc14bdbc0a';
const MESSAGE_TIMEOUT = 30000;

// Test phrases designed to trigger specific rhetorical patterns
const patternTests = [
  {
    pattern: "Pattern A (Question-Demolish-Rebuild)",
    trigger: "I'm not sure what to do",
    expectedElements: ["question", "demolish uncertainty", "commanding alternative"]
  },
  {
    pattern: "Pattern B (Escalating Metaphor Chain)", 
    trigger: "What if we fail?",
    expectedElements: ["metaphor", "escalating imagery", "absolute declaration"]
  },
  {
    pattern: "Pattern E (Time Pressure Escalation)",
    trigger: "I need time to think about this",
    expectedElements: ["time pressure", "competitors", "immediate action"]
  },
  {
    pattern: "Pattern D (False Sympathy Into Command)",
    trigger: "It's wrong to do this",
    expectedElements: ["acknowledge difficulty", "reframe", "decisive command"]
  },
  {
    pattern: "Pattern F (Destiny and Character)",
    trigger: "Do you really think I'm capable?",
    expectedElements: ["question destiny", "challenge character", "redefine through action"]
  },
  {
    pattern: "Pattern G (Love and Loyalty Tests)",
    trigger: "I love you, but I can't do this",
    expectedElements: ["question love", "test through action", "inaction as betrayal"]
  }
];

async function sendMessage(text, roomId = 'pattern-test') {
  try {
    const startTime = Date.now();
    const response = await axios.post(`http://localhost:${SERVER_PORT}/${AGENT_ID}/message`, {
      text: text,
      roomId: roomId,
      userId: 'pattern-tester'
    }, {
      timeout: MESSAGE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    return { ...response.data, responseTime };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

function analyzePatternUsage(response, expectedElements) {
  if (!response || !response[0] || !response[0].text) {
    return { valid: false, error: 'No response text' };
  }
  
  const text = response[0].text.toLowerCase();
  const analysis = {
    responseText: response[0].text,
    responseTime: response.responseTime,
    patternElements: [],
    score: 0
  };
  
  // Check for rhetorical sophistication markers
  const sophisticationMarkers = {
    "metaphor usage": /\b(like|as|shadow|blade|crown|time|blood|storm|light|darkness)\b/g.test(text),
    "early modern syntax": /\b(thou|thee|thy|dost|wouldst|'st)\b/g.test(text),
    "imperative commands": /\b(act|seize|choose|strike|prove|show|hear|speak)\b/g.test(text),
    "authority declarations": /\b(shall|will|must|cannot|is not|are not)\b/g.test(text),
    "time urgency": /\b(now|moment|hour|time|quickly|soon|delay|wait)\b/g.test(text),
    "character challenges": /\b(weak|strong|coward|bold|worthy|unworthy|great)\b/g.test(text)
  };
  
  // Score based on sophisticated rhetorical elements
  for (const [element, present] of Object.entries(sophisticationMarkers)) {
    if (present) {
      analysis.patternElements.push(element);
      analysis.score += 1;
    }
  }
  
  // Check for specific pattern characteristics
  const hasQuestion = text.includes('?');
  const hasDeclaration = /[.!]$/.test(response[0].text.trim());
  const hasMetaphor = sophisticationMarkers["metaphor usage"];
  const hasCommand = sophisticationMarkers["imperative commands"];
  
  analysis.structuralElements = {
    hasQuestion,
    hasDeclaration,
    hasMetaphor,
    hasCommand,
    wordCount: response[0].text.split(/\s+/).length
  };
  
  return analysis;
}

async function testRhetoricalPatterns() {
  console.log('🎭 RHETORICAL PATTERN TESTING');
  console.log('===============================\n');

  // Check server health first
  console.log('🔍 Checking server...');
  try {
    await axios.get(`http://localhost:${SERVER_PORT}/`, { timeout: 5000 });
    console.log('✅ Server is responsive\n');
  } catch (error) {
    console.log('❌ Server not responding. Please start the agent first.');
    return;
  }

  const results = [];

  for (const test of patternTests) {
    console.log(`📋 TESTING: ${test.pattern}`);
    console.log(`💬 Input: "${test.trigger}"`);
    
    const response = await sendMessage(test.trigger, `pattern-test-${Date.now()}`);
    
    if (response) {
      const analysis = analyzePatternUsage(response, test.expectedElements);
      
      console.log(`🎭 Response (${analysis.responseTime}ms):`);
      console.log(`   "${analysis.responseText}"`);
      console.log(`📊 Pattern Analysis:`);
      console.log(`   • Rhetorical Elements: ${analysis.patternElements.join(', ') || 'None detected'}`);
      console.log(`   • Sophistication Score: ${analysis.score}/6`);
      console.log(`   • Structure: ${analysis.structuralElements.wordCount} words, ${analysis.structuralElements.hasDeclaration ? 'declarative' : 'other'}, ${analysis.structuralElements.hasMetaphor ? 'metaphorical' : 'literal'}`);
      console.log(`   • Command Language: ${analysis.structuralElements.hasCommand ? '✅' : '❌'}`);
      console.log(`   • Early Modern Syntax: ${analysis.patternElements.includes('early modern syntax') ? '✅' : '⚠️'}`);
      
      results.push({
        pattern: test.pattern,
        trigger: test.trigger,
        response: analysis.responseText,
        score: analysis.score,
        responseTime: analysis.responseTime,
        elements: analysis.patternElements
      });
    } else {
      console.log(`❌ No response received`);
      results.push({
        pattern: test.pattern,
        trigger: test.trigger,
        response: null,
        score: 0,
        responseTime: 0,
        elements: []
      });
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary Analysis
  console.log('📊 PATTERN TESTING SUMMARY');
  console.log('===========================');
  
  const successfulTests = results.filter(r => r.response !== null);
  const avgScore = successfulTests.reduce((sum, r) => sum + r.score, 0) / successfulTests.length;
  const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
  
  console.log(`Total Patterns Tested: ${patternTests.length}`);
  console.log(`Successful Responses: ${successfulTests.length}`);
  console.log(`Average Sophistication Score: ${avgScore.toFixed(1)}/6`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  console.log('\n🎯 DETAILED RESULTS:');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.pattern}`);
    console.log(`   Trigger: "${result.trigger}"`);
    if (result.response) {
      console.log(`   Response: "${result.response}"`);
      console.log(`   Score: ${result.score}/6 (${result.elements.join(', ') || 'none'})`);
    } else {
      console.log(`   Response: FAILED`);
    }
  });

  console.log('\n✨ Testing complete! The new rhetorical pattern system has been evaluated.');
  
  if (avgScore >= 3) {
    console.log('🎖️  ASSESSMENT: Rhetorical patterns are working well!');
  } else if (avgScore >= 2) {
    console.log('⚠️  ASSESSMENT: Patterns partially active - may need optimization');
  } else {
    console.log('❌ ASSESSMENT: Patterns not fully integrated - review RAG processing');
  }
}

testRhetoricalPatterns().catch(console.error); 