# Rhetorical Pattern Extraction Pipeline for Authentic Character Speech

## Problem Statement
Current LLM-based character generation suffers from "Victorian Shakespeare" syndrome - theatrical interpretations filtered through centuries of performance tradition rather than authentic early modern speech patterns.

## Solution: Primary Source Pattern Mining

### Phase 1: Text Preparation
```
Primary Sources:
- Folio/Quarto texts (not modern editions)
- Contemporary documents (letters, court records, household accounts)
- Other early modern dramatists (Marlowe, Webster, Middleton)
- Period-appropriate prose (Nashe, Greene, Dekker pamphlets)
```

### Phase 2: Rhetorical Pattern Extraction

#### Using Lanham's Handlist Categories:
1. **SCHEMES** (arrangement of words)
   - Anaphora, Epistrophe, Chiasmus
   - Hyperbaton (unusual word order)
   - Paronomasia (word play)

2. **TROPES** (changes in meaning)
   - Metaphor, Metonymy, Synecdoche
   - Ironia, Litotes, Hyperbole

3. **ARGUMENT PATTERNS** (Quinn's rhetorical situations)
   - Deliberative rhetoric (what should be done)
   - Judicial rhetoric (what was done)
   - Epideictic rhetoric (praise/blame)

#### Extraction Format:
```
RHETORICAL_MOVE: {
    "pattern_type": "deliberative_persuasion",
    "rhetorical_figure": "interrogatio + epanaphora",
    "source_text": "Was the hope drunk wherein you dressed yourself? Hath it slept since?",
    "situational_context": "challenging hesitation in private setting",
    "syntactic_structure": "[Past_tense_interrogative] + [Present_perfect_interrogative]",
    "semantic_field": "intoxication → sleep → consciousness",
    "pragmatic_function": "accusation via metaphor"
}
```

### Phase 3: Character-Specific Pattern Libraries

#### Lady Macbeth Rhetorical Profile:
```
PRIMARY_PATTERNS:
1. Conditional Argumentation
   - "If we should fail?" → "We fail?"
   - Structure: [Hypothetical] → [Reframe as certainty]

2. Domestic Metaphor → Political Application
   - "wash this filthy witness" (cleaning → murder)
   - "His two chamberlains will I with wine and wassail so convince" (hosting → poisoning)

3. Time Pressure Rhetoric
   - "The bell invites me" (external urgency)
   - "Duncan comes here tonight" (temporal constraint)

4. Question-Command Sequences
   - NOT modern "questioning" but rhetorical cornering
   - "Wouldst thou have that..." → implicit imperative
```

### Phase 4: Situational Context Mapping

#### Quinn's Rhetorical Situations Applied:
```
SITUATION_TYPE: "Persuasion_Under_Resistance"
ACTUAL_EXAMPLES:
- Text: "Was the hope drunk wherein you dressed yourself?"
- Context: Macbeth expressing doubt after initial commitment
- Rhetorical_Strategy: Attack the inconsistency, not the position
- Pattern: [Metaphorical_accusation] + [Temporal_contrast]

SITUATION_TYPE: "Command_Under_Stress"  
ACTUAL_EXAMPLES:
- Text: "Give me the daggers"
- Context: Post-murder crisis management
- Rhetorical_Strategy: Direct imperative, no justification
- Pattern: [Monosyllabic_imperative] + [Concrete_object]
```

### Phase 5: RAG File Architecture

#### File Structure:
```
/rhetorical_patterns/
├── schemes_by_character.json
├── tropes_by_situation.json  
├── argument_patterns.json
└── syntactic_templates.json

/primary_sources/
├── lady_macbeth_complete_corpus.txt
├── contemporary_analogues.txt
└── semantic_field_mappings.json
```

#### Example RAG Entry:
```json
{
    "rhetorical_id": "LM_deliberative_001",
    "character": "Lady_Macbeth", 
    "source_text": "If we should fail?",
    "response_text": "We fail? But screw your courage to the sticking place, and we'll not fail.",
    "rhetorical_analysis": {
        "scheme": "erotema + conduplicatio",
        "trope": "metalepsis",
        "argument_type": "deliberative_reframe",
        "syntactic_pattern": "[conditional_if] → [interrogative_reframe] → [imperative_solution]"
    },
    "contextual_tags": ["hesitation_response", "time_pressure", "private_persuasion"],
    "semantic_fields": ["military_metaphor", "mechanical_metaphor"],
    "pragmatic_function": "transform_hypothetical_into_certainty"
}
```

## Implementation Tools

### Text Analysis:
- **ELAN** for annotation
- **AntConc** for concordance analysis  
- **R/Python** for pattern extraction
- **spaCy** for syntactic parsing

### Pattern Recognition:
- N-gram analysis for repeated structures
- Part-of-speech pattern matching
- Semantic field clustering
- Pragmatic context tagging

## Expected Outcomes

1. **Authentic Speech Patterns**: Grounded in actual textual evidence
2. **Situational Appropriateness**: Patterns mapped to specific rhetorical contexts
3. **Systematic Variation**: Multiple authentic options for each situation type
4. **Scholarly Rigor**: Traceable to primary sources and rhetorical theory

## Quality Control

- Cross-reference with multiple primary sources
- Validate against contemporary linguistic evidence
- Test against period-appropriate semantic fields
- Avoid theatrical interpretation layers

This approach bypasses LLM interpretation entirely, working directly from textual evidence to create authentic character speech patterns. 