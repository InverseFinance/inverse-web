const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const redirects = async () => {
  return [
    {
      source: '/transparency/overview',
      destination: '/transparency/treasury',
      permanent: false,
    },
    {
      source: '/firm/users',
      destination: '/transparency/dbr#Users',
      permanent: false,
    },
    {
      source: '/transparency/inv',
      destination: '/transparency/dao',
      permanent: false,
    },
    {
      source: '/transparency/multisigs',
      destination: '/transparency/dao',
      permanent: false,
    },
    {
      source: '/brand-assets-2024.pdf',
      destination: '/brand-assets-2024-v1.0.1.pdf',
      permanent: false,
    },
    {
      source: '/whitepaper/sDOLA',
      destination: '/sDOLA.pdf',
      permanent: false,
    },
    {
      source: '/whitepaper:slug*',
      destination: '/firm.pdf',
      permanent: false,
    },
    {
      source: '/firm/users',
      destination: '/transparency/firm-users',
      permanent: true,
    },
    {
      source: '/firm/whitepaper:slug*',
      destination: '/firm.pdf',
      permanent: false,
    },
    {
      source: '/firm/dbr-deficits',
      destination: '/firm/dbr-spenders',
      permanent: true,
    },
    {
      source: '/firm/about',
      destination: '/about-firm',
      permanent: true,
    },
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
    // {
    //   source: '/transparency/fed-policy',
    //   destination: '/transparency/feds/policy/all',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds',
    //   destination: '/transparency/feds#All_Feds-policy',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds/policy/all',
    //   destination: '/transparency/feds#All_Feds-policy',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds/policy',
    //   destination: '/transparency/feds#All_Feds-policy',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds/income',
    //   destination: '/transparency/feds#All_Feds-income',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds/income/all',
    //   destination: '/transparency/feds#All_Feds-income',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/feds/policy',
    //   destination: '/transparency/feds#All_Feds-policy',
    //   permanent: true,
    // },
    // {
    //   source: '/transparency/fed-income',
    //   destination: '/transparency/feds#All_Feds-income',
    //   permanent: true,
    // },
    {
      source: '/transparency/frontier-overview',
      destination: '/transparency/frontier/overview',
      permanent: true,
    },
    {
      source: '/transparency/frontier-liquidations',
      destination: '/transparency/frontier/liquidations',
      permanent: true,
    },
    {
      source: '/transparency/frontier-shortfalls',
      destination: '/transparency/frontier/shortfalls',
      permanent: true,
    },
    {
      source: '/transparency/other-stabilizer',
      destination: '/transparency/other/stabilizer',
      permanent: true,
    },
    {
      source: '/transparency/shortfalls',
      destination: '/transparency/frontier/shortfalls',
      permanent: true,
    },    
    {
      source: '/transparency/other-stabilizer',
      destination: '/transparency/other/stabilizer',
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
      source: '/docs',
      destination: 'https://docs.inverse.finance',
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
    {
      source: '/analytics',
      destination: 'https://inverse.watch',
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
    loader: 'custom',
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
