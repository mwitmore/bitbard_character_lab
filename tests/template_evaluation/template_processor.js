const fs = require('fs');
const path = require('path');

class TemplateProcessor {
    constructor() {
        this.template = null;
        this.bio = [];
        this.lore = [];
        this.loadTemplate();
    }

    loadTemplate() {
        try {
            const characterFile = path.join(__dirname, '../../characters/LadyMacbethCopy.character.json');
            const characterData = JSON.parse(fs.readFileSync(characterFile, 'utf8'));
            
            this.template = characterData.templates.messageHandlerTemplate;
            this.bio = characterData.bio;
            this.lore = characterData.lore;
        } catch (error) {
            console.error('Error loading template:', error);
            throw error;
        }
    }

    processTemplate(prompt, recentMessages = []) {
        // Replace template variables
        let processedTemplate = this.template
            .replace('{{bio}}', this.bio.join('\n'))
            .replace('{{lore}}', this.lore.join('\n'))
            .replace('{{recentMessages}}', this.formatRecentMessages(recentMessages));

        return processedTemplate;
    }

    formatRecentMessages(messages) {
        if (!messages.length) return '';
        
        return messages.map(msg => {
            return `${msg.user}: ${msg.content.text}`;
        }).join('\n');
    }

    // Helper method to check if a response follows template rules
    validateResponse(response) {
        const validation = {
            hasEarlyModernParticle: false,
            startsWithQuestion: false,
            usesDostThou: false,
            temporalPattern: null
        };

        // Check for early modern particles
        const particles = [
            'Sblood,', 'I\'faith,', 'So please you,', 'Methinks,',
            'Prithee,', 'Forsooth,', 'Verily,', 'Nay,', 'Yea,',
            'Alas,', 'Lo,', 'Hark,', 'Marry,', 'Troth,', 'Zounds,'
        ];
        
        validation.hasEarlyModernParticle = particles.some(particle => 
            response.includes(particle)
        );

        // Check for question start
        validation.startsWithQuestion = /^\s*[?]/.test(response);

        // Check for dost thou
        validation.usesDostThou = /\bdost\s+thou\b/i.test(response);

        // Check for temporal patterns
        const temporalPatterns = {
            'Sensory-Time': /\b(night|day|hour|moment|time|dawn|dusk)\b/i,
            'Event-Tethered': /\b(when|while|before|after|during)\b/i,
            'Abstract-Time': /\b(future|past|present|eternity|forever)\b/i
        };

        // Find the first matching temporal pattern
        for (const [pattern, regex] of Object.entries(temporalPatterns)) {
            if (regex.test(response)) {
                validation.temporalPattern = pattern;
                break;
            }
        }

        // If no temporal pattern found, set to 'Absent'
        if (!validation.temporalPattern) {
            validation.temporalPattern = 'Absent';
        }

        return validation;
    }
}

module.exports = TemplateProcessor; 