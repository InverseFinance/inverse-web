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
variables - customize parameters (tokens, connectors, etc)
.github/workflows/cron.yaml - cron job workflow
```

#### Development

Node version 14.18.3

Copy `.env.example` to `.env.local` and fill in the values

Run `npm install` and `npm run dev`