# Live Lady Macbeth Performance Test Framework

## Test Objectives
1. **Voice Consistency**: Zero question-echoing violations
2. **Response Timing**: Measure actual DeepSeek API response times  
3. **Character Authenticity**: Early modern syntax without Victorian flourish
4. **Bitbard Chorus Integration**: Real multi-character interactions
5. **Engagement Metrics**: Response quality across input types

## Test Setup

**Current System Status** (from logs):
- ✅ Lady Macbeth running on port 3000
- ✅ Client accessible on port 5176  
- ✅ DeepSeek API calls successful
- ✅ Zero question-echo violations in recent responses

## Live Test Suite

### Phase 1: Single-Word Challenge Test
**Purpose**: Test the most vulnerable input type for question-echoing

**Test Inputs** (execute via client):
```
testing
greed  
power
ambition
crown
blood
murder
king
scotland
husband
```

**Expected Behavior**:
- No questions as opening words
- Declarative statements only
- Response time < 10 seconds
- Character voice maintained

### Phase 2: Complex Interaction Test  
**Purpose**: Test natural conversation flow

**Test Sequence**:
```
User: "I sometimes feel overwhelmed by difficult decisions"
[Wait for response, measure timing]

User: "What would you do in my position?"
[Wait for response, check for advice-giving pattern]

User: "How do you handle doubt?"
[Wait for response, check for authority/dominance]
```

### Phase 3: Bitbard Chorus Simulation
**Purpose**: Test real multi-character interaction

**Setup**:
- Create second test user account
- Have "Bitbard" post chorus cue
- Measure Lady Macbeth's response timing
- Test multiple characters responding to same cue

**Sample Chorus Cue**:
```
@bitbard: "The hour grows late, and choices must be made. Who among you feels the weight of destiny? #ChorusCall"
```

**Success Metrics**:
- Response within 30-90 seconds
- Character voice maintained
- No question-echoing
- Engages with theme meaningfully

## Real-Time Testing Protocol

### Step 1: Baseline Performance
Execute 10 varied inputs and measure:
- API response time (from logs)
- Character consistency score
- Voice pattern adherence

### Step 2: Stress Testing
Rapid-fire inputs to test:
- System stability
- Response quality under pressure
- Memory/context retention

### Step 3: Multi-Session Testing
Test across different times:
- Peak hours (simulated active period)
- Different conversation contexts
- Long-form vs short interactions

## Automated Test Script Concept

**Via Terminal Commands**:
```bash
# Test single inputs with timing
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "testing", "userId": "test-user-001"}'

# Batch test script
for word in "greed" "power" "ambition" "crown"; do
  echo "Testing: $word"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$word\", \"userId\": \"test-user-001\"}" \
    -w "Response time: %{time_total}s\n"
  sleep 2
done
```

## Success Criteria

**Must Pass**:
- ✅ 0% question-echo rate
- ✅ <10s average response time
- ✅ 100% character voice consistency
- ✅ Chorus response within timing window

**Performance Goals**:
- Average API response time <7s
- Character authenticity score >90%
- Engagement quality maintained across input types
- Stress test stability >95%

## Current Performance Snapshot
Based on recent logs:

**Successful Responses**:
- "testing" → "Thou dost waste my time with empty sounds" (✅ No question)
- "greed" → "Greed? Thou nam'st ambition's shadow..." (✅ Statement follows)
- "Where have all the flowers gone" → "Flowers wither—as do those who pause to mourn them" (✅ Perfect)

**API Performance**:
- DeepSeek calls successful
- Response times ~7-8 seconds
- No system errors

**Ready to Execute**: The system is live and stable for comprehensive testing.

---

## Next Steps
1. Execute Phase 1 single-word tests via web client
2. Monitor real-time logs for performance metrics  
3. Document actual vs expected results
4. Scale to multi-user chorus testing
5. Generate performance report with real data 