# Inverse.Finance web app

Interface and API for https://inverse.finance

Built using TypeScript, Next.js, React, Chakra UI, Vercel Serverless, Redis (Upstash) and Ethers.js.

#### Directory structure
```
abis - String-format abis
components - UI components
config - Constants (contract addresses, assets, etc)
hooks - Data-fetching
pages - Page routes
pages/api - API endpoints
public - Public Assets
theme - Chakra Theme
types - Types
util - Utility functions
.github/workflows/cron.yaml - cron job workflow
```

#### Development

Copy `.env.example` to `.env.local` and fill in the values:

```
REDIS_URL=<your_redis_url>

# Alchemy Key
ALCHEMY_API=<your_alchemy_key>

# Secret key to use protected cron api
API_SECRET_KEY=<your_cron_secret_key>
```

Run `npm install` and `npm run dev`

