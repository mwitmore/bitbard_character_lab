const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SERVER_HEALTH_ENDPOINT = `${SERVER_URL}/health`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const characterConfigPath = path.join(__dirname, '../characters/LadyMacbethCopy.character.json');

// Utility function for logging
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch(SERVER_HEALTH_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Server health check failed with status ${response.status}`);
    }
    log('Server is healthy', 'success');
    return true;
  } catch (error) {
    log(`Server health check failed: ${error.message}`, 'error');
    return false;
  }
}

// Ensure dependencies are installed
function setupDependencies() {
  log('Setting up test dependencies...');
  try {
    execSync('pnpm add -D node-fetch@2 -w', { stdio: 'inherit' });
    log('Dependencies installed successfully', 'success');
  } catch (error) {
    log(`Failed to install dependencies: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Retry function for API calls
async function retry(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    log(`Operation failed, retrying... (${retries} attempts remaining)`, 'info');
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

// Run setup before importing the validator
setupDependencies();

const { CueValidator, loadAgent } = require('./cue_validation_test');

async function runValidationSuite() {
  // Check server health first
  const isServerHealthy = await checkServerHealth();
  if (!isServerHealthy) {
    log('Cannot proceed with tests - server is not healthy', 'error');
    process.exit(1);
  }

  // Load the agent and get its ID
  log('Loading agent...');
  let agentId;
  try {
    agentId = await retry(() => loadAgent(characterConfigPath));
    log(`Agent loaded successfully with ID: ${agentId}`, 'success');
  } catch (error) {
    log(`Failed to load agent: ${error.message}`, 'error');
    process.exit(1);
  }

  const validator = new CueValidator(agentId);
  const results = {
    startTime: new Date().toISOString(),
    testCases: [],
    summary: null,
    errors: []
  };

  // Load test cases
  log('Loading test cases...');
  let testCases;
  try {
    const testCasesPath = path.join(__dirname, 'cue_test_cases.json');
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
    log(`Loaded ${testCases.testCases.length} test cases`, 'success');
  } catch (error) {
    log(`Failed to load test cases: ${error.message}`, 'error');
    process.exit(1);
  }

  log('Starting cue validation test suite...\n');

  for (const testCase of testCases.testCases) {
    log(`Running test case: ${testCase.name}`);
    try {
      const result = await retry(() => validator.validateCue(testCase.cue, testCase.expectedPatterns));
      
      if (result) {
        const passed = result.matched_patterns.length >= testCase.expectedPatterns.length * 0.7;
        results.testCases.push({
          name: testCase.name,
          result: result,
          passed,
          error: null
        });
        log(`Test case ${testCase.name} ${passed ? 'passed' : 'failed'}`, passed ? 'success' : 'error');
      } else {
        throw new Error('Test case returned null result');
      }
    } catch (error) {
      log(`Error in test case ${testCase.name}: ${error.message}`, 'error');
      results.testCases.push({
        name: testCase.name,
        result: null,
        passed: false,
        error: error.message
      });
      results.errors.push({
        testCase: testCase.name,
        error: error.message
      });
    }
  }

  // Generate summary
  results.summary = {
    totalTests: results.testCases.length,
    passedTests: results.testCases.filter(t => t.passed).length,
    failedTests: results.testCases.filter(t => !t.passed).length,
    errorCount: results.errors.length,
    averageResponseTime: validator.getStats().averageResponseTime,
    patternDistribution: validator.getStats().patternStats
  };

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, 'reports', `cue_validation_${timestamp}.json`);
  
  fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  log('\nTest Suite Summary:', 'info');
  console.log(JSON.stringify(results.summary, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, 'success');

  // Exit with appropriate code
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run the test suite
runValidationSuite().catch(error => {
  log(`Fatal error in test suite: ${error.message}`, 'error');
  process.exit(1);
}); 