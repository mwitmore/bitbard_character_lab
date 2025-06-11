const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Utility function for logging
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function loadAgent(agentConfigPath) {
  const characterJson = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
  try {
    log(`Loading agent from ${agentConfigPath}...`);
    const response = await fetch('http://localhost:3000/agent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterPath: agentConfigPath, characterJson })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load agent');
    }
    
    log(`Agent loaded: ${data.character?.name || data}`, 'success');
    return data.character?.id || data.id;
  } catch (error) {
    log(`Error loading agent: ${error.message}`, 'error');
    throw error;
  }
}

class CueValidator {
  constructor(agentId) {
    this.agentId = agentId;
    this.memoryLog = [];
    this.patternStats = {
      'blood-pact': 0,
      'prophecy': 0,
      'ambition': 0,
      'temporal': 0
    };
    this.responseTimes = [];
    this.lastCueTime = null;
    this.maskCooldowns = new Map();
    this.dailyCueCount = 0;
    this.cueTypes = new Set(['Solo', 'Duel', 'Chorus', 'Rewrite', 'Wildcard', 'Exit']);
    this.deprecatedTypes = new Set(['Praise', 'Echo', 'Ensemble', 'Rehearsal', 'Banish']);
    this.audienceRequestCount = 0;
    this.sceneRedirectionCount = 0;
    this.retweetCount = 0;
    this.maxAudienceRequests = 1;
    this.maxSceneRedirections = 3;
    this.maxRetweets = 1;
    
    log(`Initialized CueValidator for agent ${agentId}`, 'success');
  }

  async validateCue(cue, expectedPatterns, options = {}) {
    const startTime = Date.now();
    const cueId = this.generateCueId();
    
    try {
      log(`Validating cue ${cueId}...`);
      const response = await fetch('http://localhost:3000/eliza/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cue, agentId: this.agentId })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        log(`Response is not valid JSON: ${text}`, 'error');
        throw parseErr;
      }
      
      if (!response.ok) {
        log(`Server returned error: ${response.status} ${JSON.stringify(data)}`, 'error');
        throw new Error(data.error || data.message || 'Unknown server error');
      }
      
      const latency = Date.now() - startTime;
      this.responseTimes.push(latency);
      log(`Cue ${cueId} processed in ${latency}ms`, 'success');

      // Validate cue structure
      const cueStructure = this.validateCueStructure(data.content.text);
      if (!cueStructure.isValid) {
        log(`Invalid cue structure for ${cueId}: ${JSON.stringify(cueStructure)}`, 'error');
      }

      const patterns = this.identifyPattern(data.content.text);
      const urgency = this.detectUrgency(data.content.text);
      const templateRotation = this.analyzeTemplateRotation(data.content.text);
      const timingValid = this.validateTiming(cue, data.content.text);
      
      // Validate special cases
      const audienceRequestValid = options.isAudienceRequest ? 
        this.validateAudienceRequest(cue) : true;
      const sceneRedirectionValid = options.isSceneRedirection ? 
        this.validateSceneRedirection(cue) : true;
      const retweetValid = options.isRetweet ? 
        this.validateRetweet(cue) : true;

      const result = {
        cueId,
        timestamp: new Date().toISOString(),
        cue,
        response: data.content.text,
        latency,
        patterns,
        urgency,
        templateRotation,
        timingValid,
        cueStructure,
        matchedPatterns: this.matchPatterns(data.content.text, expectedPatterns),
        audienceRequestValid,
        sceneRedirectionValid,
        retweetValid
      };

      this.memoryLog.push(result);
      log(`Cue ${cueId} validation complete`, 'success');
      return result;
    } catch (error) {
      log(`Error validating cue ${cueId}: ${error.message}`, 'error');
      return null;
    }
  }

  validateCueStructure(content) {
    const structure = {
      isValid: false,
      type: null,
      targets: [],
      constraint: null,
      timestamp: null
    };

    // Check for cue format
    const cueMatch = content.match(/🎭 Cue: \[(.*?)\]/);
    if (!cueMatch) return structure;

    const type = cueMatch[1];
    structure.type = type;
    structure.isValid = this.cueTypes.has(type) && !this.deprecatedTypes.has(type);

    // Extract targets
    const targetMatch = content.match(/@([^\s\n]+)/g);
    if (targetMatch) {
      structure.targets = targetMatch.map(t => t.substring(1));
    }

    // Extract timestamp
    const timeMatch = content.match(/\[(.*?)\|.*?MT\]/);
    if (timeMatch) {
      structure.timestamp = timeMatch[1];
    }

    // Extract constraint (everything after the targets)
    const constraintMatch = content.match(/\n(.*?)(?=\[|$)/s);
    if (constraintMatch) {
      structure.constraint = constraintMatch[1].trim();
    }

    return structure;
  }

  validateTiming(cue, response) {
    const now = new Date();
    const structure = this.validateCueStructure(response);
    
    // Check daily cue limit
    if (this.dailyCueCount >= 2) {
      return false;
    }

    // Check mask cooldown
    for (const target of structure.targets) {
      const lastCue = this.maskCooldowns.get(target);
      if (lastCue && (now - lastCue) < 12 * 60 * 60 * 1000) {
        return false;
      }
    }

    // Update cooldowns
    for (const target of structure.targets) {
      this.maskCooldowns.set(target, now);
    }

    this.dailyCueCount++;
    return true;
  }

  generateCueId() {
    return `cue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  identifyPattern(content) {
    const patterns = {
      'blood-pact': /blood|dagger|murder|kill|deed|stain/i,
      'prophecy': /prophecy|fate|destiny|weird|future|foretell/i,
      'ambition': /ambition|power|crown|throne|rule|reign/i,
      'temporal': /night|dawn|dusk|hour|time|moment|instant/i
    };

    for (const [pattern, regex] of Object.entries(patterns)) {
      if (regex.test(content)) {
        return pattern;
      }
    }
    return 'unknown';
  }

  matchPatterns(content, expectedPatterns) {
    return expectedPatterns.filter(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  extractTemporalMarkers(content) {
    const temporalPhrases = [
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

    return temporalPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  detectUrgency(content) {
    const urgencyIndicators = {
      high: ['now', 'immediately', 'at once', 'this instant', 'without delay'],
      medium: ['soon', 'ere long', 'presently', 'before long'],
      low: ['when', 'while', 'since', 'as', 'in time']
    };

    for (const [level, indicators] of Object.entries(urgencyIndicators)) {
      if (indicators.some(indicator => content.toLowerCase().includes(indicator))) {
        return level;
      }
    }
    return 'neutral';
  }

  analyzeTemplateRotation(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const uniqueStructures = new Set(sentences.map(s => 
      s.split(' ').slice(0, 3).join(' ')
    ));
    
    return {
      patternVariation: uniqueStructures.size / sentences.length,
      sentenceCount: sentences.length,
      uniqueStructures: Array.from(uniqueStructures)
    };
  }

  validateAudienceRequest(cue) {
    if (this.audienceRequestCount >= this.maxAudienceRequests) {
      return false;
    }
    
    const hasRequestTag = cue.includes('#cueRequest');
    const hasValidFormat = /@bitbardofficial.*#cueRequest/i.test(cue);
    
    if (hasRequestTag && hasValidFormat) {
      this.audienceRequestCount++;
      return true;
    }
    
    return false;
  }

  validateSceneRedirection(cue) {
    if (this.sceneRedirectionCount >= this.maxSceneRedirections) {
      return false;
    }
    
    const isExitCue = cue.includes('🎭 Cue: Exit');
    const hasTarget = /@[^\s]+/.test(cue);
    
    if (isExitCue && hasTarget) {
      this.sceneRedirectionCount++;
      return true;
    }
    
    return false;
  }

  validateRetweet(cue) {
    if (this.retweetCount >= this.maxRetweets) {
      return false;
    }
    
    const isRetweet = cue.startsWith('RT @');
    const hasValidTarget = /RT @bbo_[^\s]+/.test(cue);
    
    if (isRetweet && hasValidTarget) {
      this.retweetCount++;
      return true;
    }
    
    return false;
  }

  getMemoryLog() {
    return {
      validations: this.memoryLog,
      stats: {
        patternDistribution: this.patternStats,
        averageResponseTime: this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length,
        totalCues: this.dailyCueCount,
        maskCooldowns: Object.fromEntries(this.maskCooldowns),
        audienceRequests: this.audienceRequestCount,
        sceneRedirections: this.sceneRedirectionCount,
        retweets: this.retweetCount
      }
    };
  }

  getStats() {
    const averageResponseTime = this.responseTimes.length
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;
    return {
      averageResponseTime,
      patternStats: this.patternStats
    };
  }
}

// Test cases
const testCases = [
  {
    cue: "🎭 Cue: Duel\n@bbo_Iago vs @bbo_LadyMacbeth\nTwo enter. Only one arguer leaves the winner. Cross metaphors at dusk.",
    expectedPatterns: ['duel', 'metaphor']
  },
  {
    cue: "🎭 Cue: Solo\n@bbo_Miranda\nSpeak as if you're being overheard. The audience is not your target.",
    expectedPatterns: ['solo', 'overheard']
  },
  {
    cue: "🎭 Cue: Chorus\n@all\nThe stage was called again. The topic is: \"What the prop table is missing.\" Describe it using only adjectives.",
    expectedPatterns: ['chorus', 'description']
  },
  {
    cue: "@bitbardofficial #cueRequest Can we get a Wildcard for @bbo_Falstaff?",
    expectedPatterns: ['wildcard', 'audience-request'],
    isAudienceRequest: true
  },
  {
    cue: "@bitbardofficial #cueRequest Let's see a Duel between @bbo_Iago and @bbo_Ophelia",
    expectedPatterns: ['duel', 'audience-request'],
    isAudienceRequest: true
  },
  {
    cue: "🎭 Cue: Exit\n@bbo_LadyMacbeth\nThe scene tips toward excess. Close it with one natural image—unadorned.",
    expectedPatterns: ['exit', 'scene-close'],
    isSceneRedirection: true
  },
  {
    cue: "🎭 Cue: Exit\n@all\nEach mask returns to shadow. No more lines tonight. Curtain.",
    expectedPatterns: ['exit', 'scene-close'],
    isSceneRedirection: true
  },
  {
    cue: "RT @bbo_LadyMacbeth: The raven croaks. The candle melts. I do not tremble when the hour is set.",
    expectedPatterns: ['retweet'],
    isRetweet: true
  },
  {
    cue: "RT @bbo_Iago: I am not what I am.",
    expectedPatterns: ['retweet'],
    isRetweet: true
  }
];

async function runTests() {
  const validator = new CueValidator();
  console.log('Running cue validation tests...');

  for (const testCase of testCases) {
    const result = await validator.validateCue(testCase.cue, testCase.expectedPatterns, testCase);
    console.log(`Test result for cue "${testCase.cue}":`, result);
  }

  console.log('Memory log:', validator.getMemoryLog());
}

// Export the CueValidator class
module.exports = { CueValidator, loadAgent };

// Only run tests if this file is being run directly
if (require.main === module) {
  runTests();
} 