# Environment Variables Setup

## Required Environment Variables

### OpenAI API Key
The application requires an OpenAI API key for AI-powered email processing.

**To set up:**

1. Get your API key from https://platform.openai.com/api-keys
2. Set the environment variable:

**macOS/Linux:**
```bash
export OPENAI_API_KEY="your-actual-api-key-here"
```

**Windows:**
```cmd
set OPENAI_API_KEY=your-actual-api-key-here
```

**For persistent setup (recommended):**

**macOS/Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
echo 'export OPENAI_API_KEY="your-actual-api-key-here"' >> ~/.bashrc
```

**Windows (system environment variables):**
1. Open System Properties → Advanced → Environment Variables
2. Add new system variable: `OPENAI_API_KEY` with your key value

## Verification

To verify the environment variable is set:
```bash
echo $OPENAI_API_KEY
```

## Docker Environment

For Docker deployment, the environment variable is automatically passed through from your host system to the container via docker-compose.yml.

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Monitor API usage and costs

## Starting the Application

Once the environment variable is set, start the application normally:
```bash
./start-backend-safe.sh
```

The script will automatically detect and use your OpenAI API key.
