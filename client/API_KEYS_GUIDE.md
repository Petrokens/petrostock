# API Keys and Authentication Setup

This document explains where and how to obtain API keys for the Stock Market Tracker application.

## Groww API Keys

### 1. **Groww API Key** (VITE_GROWW_API_KEY)
**Where to get:**
- Sign up at [Groww Developer Portal](https://groww.in/developers) (if available)
- Contact Groww support for API access
- **Note:** Groww doesn't have a public API program currently. Most endpoints are scraped from their web interface.

**Required for:**
- Premium data access
- Higher rate limits
- Authenticated endpoints

### 2. **Groww Client Credentials** (VITE_GROWW_CLIENT_ID, VITE_GROWW_CLIENT_SECRET)
**Where to get:**
- Groww Developer Console
- OAuth application registration

**Required for:**
- OAuth 2.0 authentication flow
- User-specific data access
- Trading operations

### 3. **Access Token** (VITE_GROWW_ACCESS_TOKEN)
**Where to get:**
- Generated through OAuth flow
- Groww authentication API
- User login process

**Required for:**
- Authenticated API requests
- User portfolio data
- Real-time premium features

### 4. **Script/Session Keys** (VITE_GROWW_SCRIPT_KEY, VITE_GROWW_SESSION_TOKEN)
**Where to get:**
- Browser developer tools (Network tab)
- Groww web app session
- Trading interface authentication

**Required for:**
- Trading operations
- Portfolio management
- Advanced user features

## Alternative API Providers

### Alpha Vantage (VITE_ALPHA_VANTAGE_API_KEY)
**Where to get:**
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for free account
3. Get API key from dashboard

**Features:**
- Free tier: 5 requests per minute, 500 requests per day
- International stock data
- Technical indicators
- Economic indicators

### Finnhub (VITE_FINNHUB_API_KEY)
**Where to get:**
1. Visit [Finnhub](https://finnhub.io/)
2. Sign up for free account
3. Get API key from dashboard

**Features:**
- Free tier: 60 calls per minute
- Real-time stock data
- Company fundamentals
- News and social sentiment

### Yahoo Finance (VITE_YAHOO_FINANCE_API_KEY)
**Where to get:**
- Yahoo Finance API (through RapidAPI)
- Direct Yahoo Finance endpoints (no key needed for basic data)

**Features:**
- Free historical data
- Real-time quotes
- Company information

## Setup Instructions

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Add Your API Keys
Edit the `.env` file and add your actual API keys:

```bash
# Groww API (if available)
VITE_GROWW_API_KEY=your_actual_api_key_here
VITE_GROWW_ACCESS_TOKEN=your_access_token_here

# Alternative APIs
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
VITE_FINNHUB_API_KEY=your_finnhub_key
```

### 3. Restart Development Server
```bash
npm run dev
```

## Important Notes

### Security
- **Never commit `.env` file to git**
- Keep API keys secure and private
- Use environment variables in production
- Rotate keys regularly

### Rate Limits
- Free tiers have limited requests
- Monitor your usage
- Implement proper caching
- Use fallback data when limits are reached

### Groww API Limitations
- Groww doesn't offer a public API
- Current implementation uses web scraping techniques
- May break if Groww changes their website structure
- Consider it experimental and use at your own risk

## Troubleshooting

### Common Issues
1. **"API Key Missing" warnings**
   - Check your `.env` file
   - Ensure proper variable names (VITE_ prefix)
   - Restart development server

2. **Rate limit exceeded**
   - Wait for rate limit reset
   - Upgrade to premium tier
   - Implement request queuing

3. **CORS errors**
   - Use a proxy server
   - Configure CORS headers
   - Use server-side API calls

### Getting Help
- Check browser console for detailed error messages
- Verify API key validity on provider websites
- Test API endpoints with tools like Postman
- Check API provider documentation for status and outages