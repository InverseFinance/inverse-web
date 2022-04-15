const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const redirects = async () => {
  return [
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
      destination: '/anchor',
      permanent: true,
    },
    {
      source: '/stake',
      destination: '/anchor',
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
  ]
}

module.exports = (phase) => {
  switch (phase) {
    case PHASE_DEVELOPMENT_SERVER:
      return {
        redirects,
        env: {
          COINGECKO_PRICE_API: 'https://api.coingecko.com/api/v3/simple/price',
        },
        images: {
          domains: ['images.ctfassets.net'],
        },
      }
    default:
      return {
        redirects,
        typescript: {
          ignoreBuildErrors: true,
        },
        env: {
          COINGECKO_PRICE_API: 'https://api.coingecko.com/api/v3/simple/price',
        },
        images: {
          domains: ['images.ctfassets.net'],
        },
      }
  }
}
