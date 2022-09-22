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
      source: '/tokens/dola',
      destination: '/swap',
      permanent: true,
    },
    {
      source: '/inv',
      destination: '/tokens/inv',
      permanent: true,
    },
    {
      source: '/yield-opportunities',
      destination: '/tokens/yield-opportunities',
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

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com https://js.sentry-cdn.com https://substackcdn.com https://platform.twitter.com 'unsafe-inline';
  img-src * data:;
  child-src *;
  style-src 'self' 'unsafe-inline';
  connect-src *;
  font-src 'self';
`

const headers = async () => {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'Referrer-Policy',
          value: 'same-origin',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Content-Security-Policy',
          value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
        }
      ],
    },
  ]
}

const common = {
  images: {
    domains: ['images.ctfassets.net'],
  },
  redirects,
  // headers,
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
