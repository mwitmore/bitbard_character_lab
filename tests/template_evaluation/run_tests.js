const fs = require('fs');
const path = require('path');
const TemplateProcessor = require('./template_processor');
const ResponseEvaluator = require('./evaluator');
const { testCases, liveResponses } = require('./test_cases');

async function runTests() {
    console.log('Starting template evaluation tests...\n');

    // Initialize components
    const templateProcessor = new TemplateProcessor();
    const evaluator = new ResponseEvaluator(templateProcessor);

    // Test with live LLM responses
    console.log('Testing with live LLM responses...');
    const liveResults = evaluator.evaluateBatch(liveResponses, testCases);
    
    // Print results
    console.log('\n=== Live LLM Response Results ===');
    console.log(`Overall Score: ${liveResults.averageScore.toFixed(2)}%`);
    
    console.log('\n=== Pattern Analysis ===');
    for (const [pattern, stats] of Object.entries(liveResults.patternAnalysis)) {
        if (pattern === 'temporalPatterns') {
            console.log('\nTemporal Patterns:');
            for (const [tempPattern, tempStats] of Object.entries(stats)) {
                if (tempStats.total > 0) {
                    console.log(`  ${tempPattern}: ${tempStats.success}/${tempStats.total} (${tempStats.successRate.toFixed(2)}%)`);
                } else {
                    console.log(`  ${tempPattern}: No matches`);
                }
            }
        } else {
            console.log(`${pattern}: ${stats.success}/${stats.total} (${stats.successRate.toFixed(2)}%)`);
        }
    }

    console.log('\n=== Structural Analysis ===');
    console.log(`Average Sentence Count: ${liveResults.structuralAnalysis.averageSentenceCount.toFixed(2)}`);
    console.log(`Average Sentence Length: ${liveResults.structuralAnalysis.averageSentenceLength.toFixed(2)} characters`);
    
    console.log('\nParticle Position Distribution:');
    const particleDist = liveResults.structuralAnalysis.particlePositionDistribution;
    console.log(`  Start: ${particleDist.start} (${((particleDist.start / testCases.length) * 100).toFixed(2)}%)`);
    console.log(`  Middle: ${particleDist.middle} (${((particleDist.middle / testCases.length) * 100).toFixed(2)}%)`);
    console.log(`  None: ${particleDist.none} (${((particleDist.none / testCases.length) * 100).toFixed(2)}%)`);

    console.log('\nTemporal Reference Distribution:');
    for (const [pattern, count] of Object.entries(liveResults.structuralAnalysis.temporalReferenceDistribution)) {
        console.log(`  ${pattern}: ${count} occurrences`);
    }

    console.log('\nImperative Distribution:');
    const imperativeDist = liveResults.structuralAnalysis.imperativeDistribution;
    console.log(`  Low: ${imperativeDist.low} (${((imperativeDist.low / testCases.length) * 100).toFixed(2)}%)`);
    console.log(`  Medium: ${imperativeDist.medium} (${((imperativeDist.medium / testCases.length) * 100).toFixed(2)}%)`);
    console.log(`  High: ${imperativeDist.high} (${((imperativeDist.high / testCases.length) * 100).toFixed(2)}%)`);

    // Save results to file
    const resultsDir = path.join(__dirname, '../../test_results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `live_template_evaluation_${timestamp}.json`);
    
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp,
        liveResults,
        testCases
    }, null, 2));

    console.log(`\nResults saved to: ${resultsFile}`);
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
}); 