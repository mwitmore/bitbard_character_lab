import { PostingConstraints, ResponsePattern, ConversationHistory } from '../types/posting';

export class PostingConstraintManager {
  private constraints: PostingConstraints;
  private recentPatterns: ResponsePattern[] = [];
  private conversationHistory: ConversationHistory[] = [];

  constructor(constraints: PostingConstraints) {
    this.constraints = constraints;
  }

  public canRespond(timestamp: number): boolean {
    const lastResponse = this.conversationHistory[this.conversationHistory.length - 1];
    if (!lastResponse) return true;

    const timeSinceLastResponse = timestamp - lastResponse.timestamp;
    return timeSinceLastResponse >= this.constraints.timing.cooldowns.betweenResponses;
  }

  public canRespondToCharacter(characterId: string, timestamp: number): boolean {
    const lastResponseToCharacter = this.conversationHistory
      .filter(h => h.targetCharacterId === characterId)
      .pop();

    if (!lastResponseToCharacter) return true;

    const timeSinceLastResponse = timestamp - lastResponseToCharacter.timestamp;
    return timeSinceLastResponse >= this.constraints.timing.cooldowns.sameCharacter;
  }

  public getNextRhetoricalPattern(): string {
    if (!this.constraints.rhetorical.patternRotation.enabled) {
      return this.constraints.rhetorical.patternRotation.types[0];
    }

    const recentTypes = this.recentPatterns
      .slice(-this.constraints.memory.recentPatterns.maxStored)
      .map(p => p.type);

    const availableTypes = this.constraints.rhetorical.patternRotation.types
      .filter(type => !recentTypes.includes(type));

    return availableTypes.length > 0 
      ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
      : this.constraints.rhetorical.patternRotation.types[0];
  }

  public getResponseLength(): number {
    if (!this.constraints.rhetorical.responseLength.variationRequired) {
      return this.constraints.rhetorical.responseLength.maxLength;
    }

    const recentLengths = this.recentPatterns
      .slice(-this.constraints.memory.recentPatterns.maxStored)
      .map(p => p.length);

    const avgLength = recentLengths.reduce((a, b) => a + b, 0) / recentLengths.length;
    const targetLength = avgLength > 3 ? 1 : 5;

    return Math.min(
      Math.max(targetLength, this.constraints.rhetorical.responseLength.minLength),
      this.constraints.rhetorical.responseLength.maxLength
    );
  }

  public addResponse(pattern: ResponsePattern, history: ConversationHistory): void {
    this.recentPatterns.push(pattern);
    this.conversationHistory.push(history);

    // Trim history if needed
    if (this.recentPatterns.length > this.constraints.memory.recentPatterns.maxStored) {
      this.recentPatterns = this.recentPatterns.slice(-this.constraints.memory.recentPatterns.maxStored);
    }

    if (this.conversationHistory.length > this.constraints.memory.conversationHistory.maxStored) {
      this.conversationHistory = this.conversationHistory.slice(-this.constraints.memory.conversationHistory.maxStored);
    }
  }

  public cleanupOldHistory(currentTimestamp: number): void {
    const cutoffTime = currentTimestamp - this.constraints.memory.conversationHistory.relevanceWindow;
    this.conversationHistory = this.conversationHistory.filter(h => h.timestamp >= cutoffTime);
  }
} 