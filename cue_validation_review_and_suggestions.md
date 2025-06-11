# Cue Testing Review and Recommendations

## Summary of Identified Problems

1. **Cue Recognition Invisibility**
   - No deterministic check that a character recognized and responded to a cue properly.
   - Lack of structural parsing verification—cue format, type, and target matching not enforced.

2. **Template Rotation Logic Opaqueness**
   - No logging or traceability around which rhetorical templates are chosen.
   - Difficult to confirm that characters vary syntax or rhetorical structure across cues.

3. **Temporal Awareness Limitations**
   - Current `LadyMacbethCopy` includes temporal phrasing, but recognition is inconsistent.
   - Regex fails to robustly match early modern phrasings, especially those with archaic syntax or metaphor.

4. **No Test Harness for Scene Logic**
   - Features like `cooldown`, `max retweets`, `audience requests` are modeled, but not externally testable.
   - Failures only become apparent once an orchestration error cascades.

5. **No Error Recovery or Reporting Strategy**
   - Cue failures return silent or vague issues—no status object for use in debugging agent logic.

---

## Why Cue Testing Matters

- **Eliza lacks an internal chrono module**: Without simulated time gating, cue pacing must be enforced externally.
- **Cue posts are orchestrational contracts**: If a character misfires, the game breaks.
- **Audience interaction** (e.g. `#cueRequest`) adds unpredictable input: You need structure to constrain risk.
- **Training integrity**: Cue adherence is the single best indicator of whether the CP and RAG system is working.

---

## Reaction to Cursor's Implementation

### Positives:
- ✅ Clear interface (`CueValidator`) for testing cue patterns, response timing, and template usage.
- ✅ Handles retweets, audience requests, and scene exits with validation logic.
- ✅ `analyzeTemplateRotation()` is a strong start for checking syntactic variation.

### Limitations:
- ⚠️ The regex used in `identifyPattern()` and `extractTemporalMarkers()` is not rich enough for early modern variants.
- ⚠️ The `validateCueStructure()` assumes a strict emoji cue line that may fail if variation occurs in punctuation or bracket placement.
- ⚠️ Temporal logic doesn't account for phrases like *"ere the owl calls"*, *"at hush of eve"*, etc.

---

## Enhanced Temporal Regex Suggestions

Replace this:

```js
'temporal': /night|dawn|dusk|hour|time|moment|instant/i
```

With this:

```js
'temporal': /(?:ere|when|at|by|while|since)\s+(?:the\s+)?(?:night|dawn|cock['']s\s+crow|candlelight|eve|sun|hour|bell|clock|shadows?|silence|stars?|owl|watch|tide|dark|light)/i
```

Additional Early Modern Temporal Markers (Add to List):

```js
const temporalPhrases = [
  "ere candlelight",
  "by cock's crow",
  "at hush of eve",
  "since last the bell did toll",
  "when stars blink dim",
  "while shadows stretch and mutter",
  "as time gnaws the wick",
  "ere sleep's yoke falls",
  "by night's blunt edge",
  "with time's lean passage"
];
```

This improves fidelity and increases sensitivity to poetic yet nonstandard phrasing.

---

## Recommendations for Cursor Pipeline

1. **Expose Logging via Webhook or Middleware**
   - Log template choice, response delay, and cue match results.
   - Allow integration with external meta-monitoring tools.

2. **Make All Validation Results Exportable as JSON**
   - Allow audit snapshots after daily cue cycles.

3. **Add Diagnostic Feedback When Cues Fail**
   - Highlight which structural or rhetorical element broke (e.g., "no valid target matched", "cooldown violated", etc.)

4. **Build Retrospective Rotation Map**
   - Keep a map of recent cue-response patterns and their rhetorical openings (first 3 tokens).

5. **Suggest Rewrites for Broken Cue Responses**
   - If a cue fails due to format or content, generate a corrected version for review.

---

## Suggested Next Steps

- ✅ Integrate CueValidator as a daily monitor.
- 🔄 Improve identifyPattern and extractTemporalMarkers with the above regex.
- 📊 Connect to a visualization dashboard (e.g. Grafana/Metabase) for monitoring cue stats over time.
- 🧪 Use validation logs to refine training inputs for Eliza. 