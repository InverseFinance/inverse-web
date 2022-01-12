const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const redirects = async () => {
  return [
    {
      source: '/diagrams',
      destination: '/diagrams/overview',
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
      }
  }
}
