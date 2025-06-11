import { elizaLogger } from '../logger';

export class TimeSimulator {
    private currentTime: Date;
    private posts: Array<{ timestamp: Date; content: string }> = [];
    private readonly config: {
        dailyMax: number;
        startTime: string;
        endTime: string;
        minInterval: number;
        maxInterval: number;
    };

    constructor(config: any) {
        this.currentTime = new Date();
        this.config = {
            dailyMax: config.POST_TIMING_POLICY.daily_max,
            startTime: config.POST_TIMING_POLICY.preferred_start_time,
            endTime: config.POST_TIMING_POLICY.preferred_end_time,
            minInterval: config.POST_INTERVAL_MIN,
            maxInterval: config.POST_INTERVAL_MAX
        };
    }

    // Advance time by specified hours
    advanceTime(hours: number): void {
        this.currentTime = new Date(this.currentTime.getTime() + (hours * 60 * 60 * 1000));
        elizaLogger.info(`Time advanced to: ${this.currentTime.toISOString()}`);
    }

    // Check if a post would be allowed at current time
    canPost(): { allowed: boolean; reason?: string } {
        // Check daily maximum
        const todayPosts = this.posts.filter(post => 
            post.timestamp.toDateString() === this.currentTime.toDateString()
        );
        if (todayPosts.length >= this.config.dailyMax) {
            return { allowed: false, reason: 'Daily maximum posts reached' };
        }

        // Check time window
        const [startHour, startMinute] = this.parseTimeString(this.config.startTime);
        const [endHour, endMinute] = this.parseTimeString(this.config.endTime);
        
        const currentHour = this.currentTime.getHours();
        const currentMinute = this.currentTime.getMinutes();
        
        if (currentHour < startHour || (currentHour === startHour && currentMinute < startMinute)) {
            return { allowed: false, reason: 'Before posting window' };
        }
        if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
            return { allowed: false, reason: 'After posting window' };
        }

        // Check post spacing
        if (todayPosts.length > 0) {
            const lastPost = todayPosts[todayPosts.length - 1];
            const timeSinceLastPost = (this.currentTime.getTime() - lastPost.timestamp.getTime()) / 1000;
            
            if (timeSinceLastPost < this.config.minInterval) {
                return { allowed: false, reason: 'Too soon after last post' };
            }
            if (timeSinceLastPost > this.config.maxInterval) {
                return { allowed: false, reason: 'Too long since last post' };
            }
        }

        return { allowed: true };
    }

    // Simulate a post attempt
    attemptPost(content: string): { success: boolean; reason?: string } {
        const canPost = this.canPost();
        if (canPost.allowed) {
            this.posts.push({ timestamp: new Date(this.currentTime), content });
            elizaLogger.info(`Post successful at ${this.currentTime.toISOString()}`);
            return { success: true };
        }
        return { success: false, reason: canPost.reason };
    }

    // Get current state
    getState() {
        return {
            currentTime: this.currentTime,
            postsToday: this.posts.filter(p => 
                p.timestamp.toDateString() === this.currentTime.toDateString()
            ).length,
            lastPost: this.posts[this.posts.length - 1]?.timestamp
        };
    }

    private parseTimeString(timeStr: string): [number, number] {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour = hours;
        if (period === 'PM' && hours !== 12) hour += 12;
        if (period === 'AM' && hours === 12) hour = 0;
        return [hour, minutes];
    }
} 