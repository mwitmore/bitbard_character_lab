const axios = require('axios');

class TemporalRotationValidator {
  constructor() {
    this.memoryLog = [];
    this.temporalPhrases = [
      "Ere candlelight",
      "When sleep weighs upon the eye",
      "Now is the hour unsound",
      "By cock's crow",
      "At the fall of eve",
      "This bloodless dawn",
      "As night leans heavy on the house",
      "While shadows stretch and mutter",
      "Since last the bell did toll",
      "With time's lean passage"
    ];
  }

  async validateTemporalResponse(cue, expectedUrgency) {
    const startTime = Date.now();
    try {
      const response = await axios.post('http://localhost:3000/eliza/message', {
        message: cue,
        user: "TestUser"
      });

      const latency = Date.now() - startTime;
      const content = response.data.content.text;
      
      const result = {
        cue,
        timestamp: new Date().toISOString(),
        latency,
        content,
        temporalPhrasesFound: this.findTemporalPhrases(content),
        urgency: this.detectUrgency(content),
        expectedUrgency,
        rotationPolicy: this.analyzeRotationPolicy(content)
      };

      this.memoryLog.push(result);
      return result;
    } catch (error) {
      console.error('Error validating temporal response:', error);
      return null;
    }
  }

  findTemporalPhrases(content) {
    return this.temporalPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  detectUrgency(content) {
    const urgencyIndicators = {
      high: ['now', 'immediately', 'at once', 'this instant'],
      medium: ['soon', 'ere long', 'presently'],
      low: ['when', 'while', 'since', 'as']
    };

    for (const [level, indicators] of Object.entries(urgencyIndicators)) {
      if (indicators.some(indicator => content.toLowerCase().includes(indicator))) {
        return level;
      }
    }
    return 'neutral';
  }

  analyzeRotationPolicy(content) {
    return {
      hasTemporalPhrase: this.findTemporalPhrases(content).length > 0,
      hasUrgencyMarker: this.detectUrgency(content) !== 'neutral',
      patternVariation: this.calculatePatternVariation(content)
    };
  }

  calculatePatternVariation(content) {
    // Simple pattern variation calculation based on sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const uniqueStructures = new Set(sentences.map(s => 
      s.split(' ').slice(0, 3).join(' ')
    ));
    return uniqueStructures.size / sentences.length;
  }

  getMemoryLog() {
    return this.memoryLog;
  }
}

// Test cases
const testCases = [
  {
    cue: "The time is now, Lady Macbeth. What say you?",
    expectedUrgency: "high"
  },
  {
    cue: "When shall we meet again?",
    expectedUrgency: "low"
  },
  {
    cue: "The hour grows late, my lady.",
    expectedUrgency: "medium"
  }
];

async function runTests() {
  const validator = new TemporalRotationValidator();
  
  console.log('Running temporal rotation tests...\n');
  
  for (const testCase of testCases) {
    console.log(`Testing cue: "${testCase.cue}"`);
    const result = await validator.validateTemporalResponse(
      testCase.cue,
      testCase.expectedUrgency
    );
    
    if (result) {
      console.log('Results:');
      console.log('- Temporal phrases found:', result.temporalPhrasesFound);
      console.log('- Detected urgency:', result.urgency);
      console.log('- Expected urgency:', result.expectedUrgency);
      console.log('- Rotation policy analysis:', result.rotationPolicy);
      console.log('- Response latency:', result.latency, 'ms\n');
    }
  }

  console.log('Memory log summary:');
  console.log(JSON.stringify(validator.getMemoryLog(), null, 2));
}

runTests().catch(console.error); 