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

Create `.env.local` file with `INFURA_ID`:

```
INFURA_ID=<your_id_here>
REDIS_URL=<your_upstash_url_here>
```

Run `npm install` and `npm run dev`

