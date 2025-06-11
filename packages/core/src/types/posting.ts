export interface PostingConstraints {
  timing: {
    responseWindows: {
      acknowledgment: number;  // seconds
      fullResponse: number;    // seconds
    };
    cooldowns: {
      betweenResponses: number;  // seconds
      sameCharacter: number;     // seconds
    };
  };
  memory: {
    recentPatterns: {
      maxStored: number;
      variationRequired: boolean;
    };
    conversationHistory: {
      maxStored: number;
      relevanceWindow: number;  // seconds
    };
  };
  rhetorical: {
    patternRotation: {
      enabled: boolean;
      types: string[];
    };
    responseLength: {
      variationRequired: boolean;
      minLength: number;
      maxLength: number;
    };
  };
}

export interface ResponsePattern {
  type: string;
  length: number;
  timestamp: number;
}

export interface ConversationHistory {
  timestamp: number;
  targetCharacterId: string;
  responseType: string;
  content: string;
} 