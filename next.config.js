const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const redirects = async () => {
  return [
    {
      source: '/positions',
      destination: '/transparency/shortfalls',
      permanent: true,
    },
    {
      source: '/transparency/fed-history',
      destination: '/transparency/fed-policy',
      permanent: true,
    },
    {
      source: '/transparency/fed-policy',
      destination: '/transparency/feds/policy/all',
      permanent: true,
    },
    {
      source: '/transparency/feds',
      destination: '/transparency/feds/policy/all',
      permanent: true,
    },
    {
      source: '/transparency/feds/policy',
      destination: '/transparency/feds/policy/all',
      permanent: true,
    },
    {
      source: '/transparency/fed-revenues',
      destination: '/transparency/feds/revenue/all',
      permanent: true,
    },
    {
      source: '/vaults',
      destination: 'https://old.inverse.finance/vaults',
      permanent: true,
    },
    {
      source: '/transparency',
      destination: '/transparency/overview',
      permanent: true,
    },
    {
      source: '/banking',
      destination: '/frontier',
      permanent: true,
    },
    {
      source: '/stake',
      destination: '/frontier',
      permanent: true,
    },
    {
      source: '/anchor',
      destination: '/frontier',
      permanent: true,
    },
    {
      source: '/stabilizer',
      destination: '/swap',
      permanent: true,
    },
    {
      source: '/blog',
      destination: '/blog/en-US',
      permanent: true,
    },
    {
      source: '/dola',
      destination: '/blog/posts/en-US/dola-trustworthy-capital-efficient-stablecoin',
      permanent: true,
    },
  ]
}

const common = {
  images: {
    domains: ['images.ctfassets.net'],
  },
  redirects,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
}

module.exports = (phase) => {
  switch (phase) {
    case PHASE_DEVELOPMENT_SERVER:
      return {
        env: {
          COINGECKO_PRICE_API: 'https://api.coingecko.com/api/v3/simple/price',
        },
        ...common
      }
    default:
      return {
        typescript: {
          ignoreBuildErrors: true,
        },
        env: {
          COINGECKO_PRICE_API: 'https://api.coingecko.com/api/v3/simple/price',
        },
        ...common
      }
  }
}
