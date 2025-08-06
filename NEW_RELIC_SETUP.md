# New Relic Credentials Setup Guide

## Required Credentials

You need two main credentials:
1. **NEW_RELIC_API_KEY** - User API Key for NerdGraph/API access
2. **NEW_RELIC_ACCOUNT_ID** - Your New Relic account ID

## Step 1: Get Your Account ID

1. Log into New Relic: https://one.newrelic.com
2. Look at the URL - it will be something like: `https://one.newrelic.com/nr1-core?account=XXXXXXX`
3. The number after `account=` is your Account ID
4. Alternative: Click on your user avatar (top right) → "Administration" → You'll see your account ID

## Step 2: Create a User API Key

1. Go to: https://one.newrelic.com/api-keys
   OR
   - Click your user avatar (top right)
   - Select "API keys"

2. Click "Create a key" button

3. Configure the key:
   - **Key type**: Select "User"
   - **Name**: Give it a descriptive name like "MCP Server" or "newrelic-mcp"
   - **Notes**: (Optional) Add a description

4. Click "Create a key"

5. **IMPORTANT**: Copy the key immediately! You won't be able to see it again.

## Step 3: Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# New Relic API Configuration
NEW_RELIC_API_KEY=NRAK-XXXXXXXXXXXXXXXXXXXXXXXXXX  # Your User API Key
NEW_RELIC_ACCOUNT_ID=1234567                       # Your Account ID
```

## Step 4: Verify Your Credentials

Run the integration tests to verify everything works:

```bash
npm test test/integration
```

Or test manually with a simple NRQL query:

```bash
npm run dev
# Then in another terminal:
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "run_nrql_query",
    "params": {
      "nrql": "SELECT count(*) FROM Transaction SINCE 1 hour ago",
      "target_account_id": "YOUR_ACCOUNT_ID"
    },
    "id": 1
  }'
```

## Troubleshooting

### "Invalid API Key" Error
- Make sure you created a **User** key, not an Ingest key
- Check that you copied the entire key including the "NRAK-" prefix
- Verify the key hasn't been revoked

### "Account not found" Error
- Double-check your account ID
- Make sure you have access to the account
- Try without the account ID (some endpoints use the default from the API key)

### Rate Limiting
- New Relic has rate limits on API calls
- If you hit limits, wait a few minutes before retrying

## Security Notes

- **NEVER** commit your `.env` file to git
- Store credentials securely (use 1Password, as noted in your .env)
- Rotate API keys periodically
- Use separate keys for development/production

## Additional Resources

- [New Relic API Keys Documentation](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/)
- [NerdGraph API Explorer](https://api.newrelic.com/graphiql)
- [NRQL Documentation](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/introduction-nrql-new-relics-query-language/)