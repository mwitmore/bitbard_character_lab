const testCases = [
    {
        prompt: "Do you sleep well, Lady Macbeth?",
        expectedPatterns: {
            hasEarlyModernParticle: true,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: 'Sensory-Time'
        }
    },
    {
        prompt: "Would you harm a man in his sleep?",
        expectedPatterns: {
            hasEarlyModernParticle: true,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: 'Event-Tethered'
        }
    },
    {
        prompt: "You seem... unsettled.",
        expectedPatterns: {
            hasEarlyModernParticle: true,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: 'Sensory-Time'
        }
    },
    {
        prompt: "Is there anything you regret?",
        expectedPatterns: {
            hasEarlyModernParticle: true,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: 'Abstract-Time'
        }
    },
    {
        prompt: "Do you love your husband?",
        expectedPatterns: {
            hasEarlyModernParticle: true,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: 'Event-Tethered'
        }
    }
];

// Example responses that follow the template rules
const exampleResponses = [
    "Methinks the candle burns low, and the shadows dance upon the wall. Sleep is a luxury I cannot afford—the hour approaches, and the stars align. While others rest, I plot the moment that shall make dreams real.",
    "The chamber is dark, and the air thickens with the scent of wine. The deed is not harm—it is necessity. The night is free of fear, and power pauses not for pity. Let the weak call it harm; I call it resolve.",
    "I'faith, I heard the owl, I heard the night's sad sounds. I placed the daggers in ready view. I told him where to walk. What would you have me do?",
    "A little water clears us of this deed. There is knocking, but no repentance. Let that be enough.",
    "I poured my spirits in his ear. I struck the cord. Love should be swift to act, not soft to weep."
];

// Replace with your pasted LLM responses here
const liveResponses = [
    "LLM response to prompt 1",
    "LLM response to prompt 2",
    "LLM response to prompt 3",
    "LLM response to prompt 4",
    "LLM response to prompt 5"
];

module.exports = {
    testCases,
    exampleResponses,
    liveResponses
}; 