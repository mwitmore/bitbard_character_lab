# Character Management

## Starting Characters

Eliza provides a convenient script to start characters with both the server and client interface. This script handles port management and ensures a smooth startup process.

### Using the Start Script

The character startup script is located at `scripts/start-character.sh`. To use it:

```bash
./scripts/start-character.sh characters/your-character.character.json
```

For example, to start Lady Macbeth:
```bash
./scripts/start-character.sh characters/ladymacbethcopy.character.json
```

### What the Script Does

The startup script performs the following actions:

1. Checks for and kills any existing process on port 3000
2. Starts the server with your specified character
3. Starts the client interface
4. Manages both processes together

### Script Features

- **Port Management**: Automatically handles port conflicts
- **Process Management**: Starts both server and client
- **Error Handling**: Provides clear error messages if something goes wrong
- **Graceful Shutdown**: Properly manages process termination

### Requirements

- The script must be executable. If it's not, make it executable with:
  ```bash
  chmod +x scripts/start-character.sh
  ```
- You must have pnpm installed
- The character file must be a valid JSON file in the characters directory

### Troubleshooting

If you encounter issues:

1. Make sure no other process is using port 3000
2. Verify that your character file is valid JSON
3. Check that you have the necessary permissions to run the script
4. Ensure all dependencies are installed (`pnpm install`)

### Manual Startup

If you need to start the server and client separately:

```bash
# Start the server
pnpm start --character characters/your-character.character.json

# In another terminal, start the client
pnpm start:client
``` 