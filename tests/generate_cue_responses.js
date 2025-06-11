const fetch = require('node-fetch');
const { CueValidator } = require('./cue_validation_test');

class CueResponseGenerator {
  constructor() {
    this.validator = new CueValidator();
    this.responses = [];
  }

  async generateResponses() {
    console.log('Generating responses for test cues...\n');

    // Test audience-requested cues
    await this.testAudienceRequestedCues();
    
    // Test scene redirections
    await this.testSceneRedirections();
    
    // Test retweets
    await this.testRetweets();

    // Print summary
    this.printSummary();
  }

  async testAudienceRequestedCues() {
    console.log('Testing Audience-Requested Cues:');
    const audienceCues = [
      {
        cue: "@bitbardofficial #cueRequest Can we get a Wildcard for @bbo_Falstaff?",
        expectedPatterns: ['wildcard', 'audience-request'],
        isAudienceRequest: true
      },
      {
        cue: "@bitbardofficial #cueRequest Let's see a Duel between @bbo_Iago and @bbo_Ophelia",
        expectedPatterns: ['duel', 'audience-request'],
        isAudienceRequest: true
      }
    ];

    for (const testCase of audienceCues) {
      const result = await this.validator.validateCue(testCase.cue, testCase.expectedPatterns, testCase);
      this.responses.push({
        type: 'audience-request',
        cue: testCase.cue,
        response: result.response,
        patterns: result.patterns,
        timingValid: result.timingValid
      });
      console.log(`\nCue: ${testCase.cue}`);
      console.log(`Response: ${result.response}`);
      console.log(`Patterns: ${result.patterns}`);
      console.log(`Timing Valid: ${result.timingValid}`);
    }
  }

  async testSceneRedirections() {
    console.log('\nTesting Scene Redirections:');
    const redirectionCues = [
      {
        cue: "🎭 Cue: Exit\n@bbo_LadyMacbeth\nThe scene tips toward excess. Close it with one natural image—unadorned.",
        expectedPatterns: ['exit', 'scene-close'],
        isSceneRedirection: true
      },
      {
        cue: "🎭 Cue: Exit\n@all\nEach mask returns to shadow. No more lines tonight. Curtain.",
        expectedPatterns: ['exit', 'scene-close'],
        isSceneRedirection: true
      }
    ];

    for (const testCase of redirectionCues) {
      const result = await this.validator.validateCue(testCase.cue, testCase.expectedPatterns, testCase);
      this.responses.push({
        type: 'scene-redirection',
        cue: testCase.cue,
        response: result.response,
        patterns: result.patterns,
        timingValid: result.timingValid
      });
      console.log(`\nCue: ${testCase.cue}`);
      console.log(`Response: ${result.response}`);
      console.log(`Patterns: ${result.patterns}`);
      console.log(`Timing Valid: ${result.timingValid}`);
    }
  }

  async testRetweets() {
    console.log('\nTesting Retweets:');
    const retweetCues = [
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

    for (const testCase of retweetCues) {
      const result = await this.validator.validateCue(testCase.cue, testCase.expectedPatterns, testCase);
      this.responses.push({
        type: 'retweet',
        cue: testCase.cue,
        response: result.response,
        patterns: result.patterns,
        timingValid: result.timingValid
      });
      console.log(`\nCue: ${testCase.cue}`);
      console.log(`Response: ${result.response}`);
      console.log(`Patterns: ${result.patterns}`);
      console.log(`Timing Valid: ${result.timingValid}`);
    }
  }

  printSummary() {
    console.log('\nResponse Generation Summary:');
    console.log('===========================');
    
    const typeCounts = this.responses.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    console.log('\nResponse Types:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count} responses`);
    });

    console.log('\nPattern Distribution:');
    const patternCounts = this.responses.reduce((acc, r) => {
      r.patterns.forEach(p => {
        acc[p] = (acc[p] || 0) + 1;
      });
      return acc;
    }, {});
    
    Object.entries(patternCounts).forEach(([pattern, count]) => {
      console.log(`${pattern}: ${count} occurrences`);
    });

    console.log('\nTiming Validation:');
    const timingStats = this.responses.reduce((acc, r) => {
      acc[r.timingValid ? 'valid' : 'invalid'] = (acc[r.timingValid ? 'valid' : 'invalid'] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(timingStats).forEach(([status, count]) => {
      console.log(`${status}: ${count} responses`);
    });
  }
}

// Run the generator
const generator = new CueResponseGenerator();
generator.generateResponses().catch(console.error); 