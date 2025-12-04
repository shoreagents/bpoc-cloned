# AI Analysis Setup Guide

## Issue: Jobs showing 75% match scores instead of AI analysis

The job matching system is currently showing fallback scores (75%) instead of real AI analysis because the Claude API key is not configured.

## Solution

### 1. Set up Claude API Key

You need to obtain a Claude API key from Anthropic and set it as an environment variable.

#### Option A: Using .env.local file (Recommended)
1. Create a `.env.local` file in the `bpoc` directory
2. Add your API key:
```
CLAUDE_API_KEY=your_api_key_here
```

#### Option B: Using system environment variables
Set the environment variable in your system:
- Windows: `set CLAUDE_API_KEY=your_api_key_here`
- Linux/Mac: `export CLAUDE_API_KEY=your_api_key_here`

### 2. Get Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment

### 3. Restart the Development Server

After setting the API key, restart your Next.js development server:
```bash
npm run dev
```

### 4. Verify Setup

Visit `/api/test-scoring` to verify the API key is working correctly.

## Expected Results

Once the API key is properly configured:
- Jobs will show real AI-generated match scores instead of 75%
- Match analysis will include detailed breakdowns
- AI Insights will show personalized reasoning
- Scores will vary based on actual job compatibility

## Troubleshooting

- **Still showing 75%**: Check that the API key is correctly set and the server was restarted
- **API errors**: Verify the API key is valid and has sufficient credits
- **Model errors**: The system uses `claude-3-sonnet-20240229` - ensure your account has access to this model

## Fallback System

If AI analysis fails, the system will use an improved fallback scoring algorithm that:
- Analyzes skills, experience, work setup, location, salary, and industry
- Provides more accurate scores than the previous hardcoded 75%
- Shows detailed reasoning for each score
- Indicates when fallback scoring is being used
