import { exec } from 'child_process';
import { promisify } from 'util';
import { elizaLogger } from '../logger';

const execAsync = promisify(exec);

export async function runTerminalCmd(command: string, requireUserApproval: boolean = true): Promise<void> {
    try {
        elizaLogger.debug(`Executing command: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stdout) {
            elizaLogger.info('Command output:', stdout);
        }
        
        if (stderr) {
            elizaLogger.warn('Command warnings/errors:', stderr);
        }
    } catch (error) {
        elizaLogger.error(`Error executing command: ${command}`, error);
        throw error;
    }
} 