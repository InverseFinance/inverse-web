export const MENUS = {
  "nav": [
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Markets',
      href: 'https://firm.inverse.finance/markets',
      submenus: [
        {
          label: 'FiRM (new UI)',
          href: 'https://firm.inverse.finance/markets',
          isExternal: true,
        },
        {
          label: 'FiRM (old UI)',
          href: '/firm',
        },
        {
          label: 'FiRM positions',
          href: 'https://firm.inverse.finance/stats#positions',
          isExternal: true,
        },
        {
          label: 'My Replenishments',
          href: '/firm/my-replenishments',
        },
        {
          label: 'Frontier (deprecated)',
          href: '/frontier',
        },
        // {
        //   label: 'Liquidate Loans',
        //   href: '/firm/positions',
        // },
        // {
        //   label: 'WETH Market',
        //   href: '/firm/WETH',
        // },
        // {
        //   label: 'Borrow DOLA',
        //   href: '/frontier?marketType=borrow&market=dola#',
        // },
      ],
    },
    {
      label: 'Stake',
      href: undefined,
      submenus: [
        {
          label: 'sDOLA',
          href: 'https://earn.inverse.finance',
          isExternal: true,
        },
        {
          label: 'jrDOLA',
          href: 'https://firm.inverse.finance/jrdola',
        },
        {
          label: 'sINV',
          href: '/sINV',
        },
        // {
        //   label: 'DSA',
        //   href: '/dsa',
        // },
        {
          label: 'Buy DBR (auction)',
          href: '/dbr/auction',
        },
      ],
    },
    {
      label: 'Governance',
      href: 'https://dao.inverse.finance/governance',
       isExternal: true,
      submenus: [
        {
          label: 'Drafts & Proposals',
          href: 'https://dao.inverse.finance/governance',
           isExternal: true
        },
        {
          label: 'Community',
          href: 'https://firm.inverse.finance/community',
          isExternal: true,
        },
        {
          label: 'Create a Draft',
          href: '/governance/propose?proposalLinkData=%7B"title"%3A"Draft"%2C"description"%3A"Forum+post+link,+Draft+content"%2C"actions"%3A%5B%5D%7D#',
        },
        {
          label: 'Delegates',
          href: 'https://dao.inverse.finance/governance/delegates',
          isExternal: true,
        },
        {
          label: 'Your Profile',
          href: '/governance/delegates/$account',
        },
      ]
    },
    {
      label: 'Transparency',
      href: 'https://dao.inverse.finance/transparency/keymetrics',
      isExternal: true,
      submenus: [
        {
          href: 'https://dao.inverse.finance/transparency/keymetrics',
          isExternal: true,
          label: 'Key Metrics',
        },
        {
          href: 'https://dao.inverse.finance/transparency/treasury',
          isExternal: true,
          label: 'Treasury',
        },
        {
          label: 'Foundation',
          href: 'https://dao.inverse.finance/transparency/foundation',
          isExternal: true,
        },
        {
          label: 'INV buybacks',
          href: 'https://dao.inverse.finance/transparency/buybacks',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/transparency/veNfts',
          label: 'veNfts',
           isExternal: true
        },
        {
          label: 'FiRM users',
          href: 'https://firm.inverse.finance/stats#users',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/transparency/liquidity',
          label: 'Liquidity',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/governance/inv',
          label: 'INV & DAO',
           isExternal: true
        },
        {
          href: 'https://firm.inverse.finance/stats#fees',
          label: 'DBR & FiRM',
          isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/transparency/dola',
          label: 'DOLA & Feds',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/transparency/feds',
          label: 'Feds Policy & Income',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/governance/dao',
          label: 'DAO & Multisigs',
           isExternal: true
        },
        {
          href: 'https://dao.inverse.finance/transparency/bad-debts',
          label: 'Bad Debts',
           isExternal: true
        },
        // {
        //   href: '/transparency/frontier/overview',
        //   label: 'Frontier & Other',
        // },
      ],
    },
    // {
    //   label: 'Bond',
    //   href: '/bonds',
    // },
    // {
    //   label: 'sDOLA',
    //   href: '/sdola',
    //   submenus: [
    //     {
    //       label: 'sDOLA',
    //       href: '/sdola',
    //     },
    //     {
    //       label: 'sDOLA stats',
    //       href: '/sdola/stats',
    //     },
    //     {
    //       label: 'DOLA Savings Account',
    //       href: '/dsa',
    //     },
    //     {
    //       label: 'DSA stats',
    //       href: '/dsa/stats',
    //     },
    //     {
    //       label: 'DBR auctions',
    //       href: '/dbr/auction',
    //     },
    //     {
    //       label: 'DBR auctions stats',
    //       href: '/dbr/auction/stats',
    //     },
    //   ],
    // },
    {
      label: 'More',
      href: undefined,
      submenus: [
        {
          href: 'https://docs.inverse.finance',
          label: 'Docs',
        },
        {
          label: 'Compare Rates',
          href: '/firm/comparator',
        },
        {
          label: 'Compare sDOLA',
          href: 'https://stableyields.info',
          isExternal: true,
        },
        {
          label: 'Swap',
          href: '/swap?fromToken=DOLA&toToken=INV',
          needReload: true,
        },
        {
          label: 'Request Collateral',
          href: 'https://firm.inverse.finance/community',
          isExternal: true
        },
        // {
        //   label: 'Blog',
        //   href: '/blog',
        // },
        {
          label: 'Audits',
          href: '/audits',
        },
        {
          label: 'Yield Opportunities',
          href: '/yield-opportunities',
        },
        // {
        //   label: 'Native Base Bridge',
        //   href: '/base',
        //   needReload: true,
        // },
        // {
        //   label: 'Native Blast Bridge',
        //   href: '/blast',
        //   needReload: true,
        // },
        {
          label: 'Analytics',
          href: 'https://inverse.watch/',
        },
        // {
        //   label: 'About FiRM',
        //   href: '/about-firm',
        // },
        {
          label: 'Research',
          href: '/research',
        },
        {
          label: 'PSM',
          href: '/psm',
        },
        {
          label: 'Frontier - Debt Converter',
          href: '/frontier/debt-converter',
        },
        {
          label: 'Frontier - Debt Repayer',
          href: '/frontier/debt-repayer',
        },
        {
          label: 'Discover Monolith',
          href: 'https://monolith.market',
          isExternal: true,
        },
      ],
    },
    // {
    //   label: 'Claim',
    //   href: '/claim-dbr',
    // },
    // {
    //   label: 'Swap',
    //   href: '/swap',
    //   submenus: [
    //     {
    //       label: 'Buy INV',
    //       href: '/swap?fromToken=DOLA&toToken=INV',
    //       needReload: true,
    //     },
    //     {
    //       label: 'Buy DBR',
    //       href: '/swap?fromToken=DOLA&toToken=DBR',
    //       needReload: true,
    //     },
    //     {
    //       label: 'Buy DBR (auction)',
    //       href: '/dbr/auction',
    //     },
    //     {
    //       label: 'Buy DOLA',
    //       href: '/swap?fromToken=DAI&toToken=DOLA',
    //       needReload: true,
    //     },
    //     {
    //       label: 'Bridge DOLA',
    //       href: '/swap?fromToken=DOLA&toToken=DOLA&fromChain=ethereum&toChain=optimism',
    //       needReload: true,
    //     },
    //     {
    //       label: 'Native Base Bridge',
    //       href: '/base',
    //       needReload: true,
    //     },
    //   ]
    // },
    // {
    //   label: 'Swap',
    //   href: '/swap/DAI/DOLA',
    //   submenus: [
    //     {
    //       label: 'Buy DOLA with DAI',
    //       href: '/swap/DAI/DOLA',
    //     },
    //     {
    //       label: 'Buy DOLA with USDC',
    //       href: '/swap/USDC/DOLA',
    //     },
    //     {
    //       label: 'Buy DOLA with USDT',
    //       href: '/swap/USDT/USDT',
    //     },
    //   ]
    // },

    // {
    //   label: 'Bonds',
    //   href: '/bonds',
    //   submenus: [
    //     {
    //       label: 'Bonds',
    //       href: '/bonds',
    //     },
    //     {
    //       label: 'Bonds Stats',
    //       href: '/bonds/stats',
    //     },
    //   ],
    // },
    // {
    //   label: 'Learn',
    //   href: 'https://docs.inverse.finance',
    //   submenus: [
    //     {
    //       href: 'https://docs.inverse.finance',
    //       label: 'Docs',
    //     },
    //     {
    //       label: 'Blog',
    //       href: '/blog',
    //     },
    //     {
    //       label: 'Audits',
    //       href: '/audits',
    //     },
    //     {
    //       label: 'About FiRM',
    //       href: '/about-firm',
    //     },
    //     {
    //       label: 'FiRM Whitepaper',
    //       href: '/whitepaper',
    //     },
    //     {
    //       href: '/analytics',
    //       label: 'Analytics',
    //     },
    //   ]
    // },
    // {
    //   label: 'Blog',
    //   href: '/blog',
    // },
  ],
  "footerGroups": [
    {
      groupLabel: 'Products',
      items: [
        {
          label: 'sDOLA Earn',
          href: 'https://earn.inverse.finance',
          isExternal: true,
        },
        // {
        //   label: 'sINV',
        //   href: 'https://docs.inverse.finance/inverse-finance/inverse-finance/products/tokens/sinv',
        // },
        // {
        //   label: 'INV',
        //   href: 'https://docs.inverse.finance/inverse-finance/inverse-finance/products/tokens/inv',
        // },
        {
          label: 'FiRM',
          href: 'https://firm.inverse.finance/markets',
        },
        {
          label: 'Monolith',
          href: 'https://monolith.market',
          isExternal: true,
        },
        {
          label: 'Compare Stablecoin Yields',
          href: 'https://stableyields.info',
          isExternal: true,
        },
        {
          label: 'Mantis',
          href: 'https://mantis.inverse.finance',
          isExternal: true,
        },
        // {
        //   label: 'Bonds',
        //   href: '/bonds',
        // },
      ],
    },
    {
      groupLabel: 'Governance',
      items: [
        {
          label: 'Voting',
          href: 'https://dao.inverse.finance/governance',
            isExternal: true,
        },
        {
          label: 'Transparency',
          href: 'https://dao.inverse.finance/transparency',
            isExternal: true,
        },
        {
          label: 'Analytics',
          href: '/analytics',
        },
        {
          label: 'Forum',
          href: 'https://forum.inverse.finance',
            isExternal: true,
        },
      ],
    },
    {
      groupLabel: 'Support',
      items: [
        {
          label: 'Docs',
          href: 'https://docs.inverse.finance/',
            isExternal: true,
        },
        {
          label: 'Audits',
          href: 'https://firm.inverse.finance/security',
            isExternal: true,
        },
        {
          label: 'Risk Gitbook',
          href: 'https://inverse-dao.gitbook.io/inverse-finance-risk/',
            isExternal: true,
        },
        {
          label: 'Github',
          href: 'https://github.com/InverseFinance',
            isExternal: true,
        },
        {
          label: 'Research',
          href: '/research',
        },
        {
          label: 'About FiRM',
          href: 'https://firm.inverse.finance/',
            isExternal: true,
        },
        {
          label: 'Brand Assets',
          href: '/brand-assets-2025-v1.1.0.pdf',
        },
      ],
    },
    {
      groupLabel: 'Community',
      items: [
        // {
        //   label: 'Blog',
        //   href: '/blog',
        // },
        {
          label: 'Bug Bounty',
          href: 'https://immunefi.com/bug-bounty/inversefinance/information',
        },
        {
          label: 'Discord',
          href: 'https://discord.gg/YpYJC7R5nv',
        },
        {
          label: 'Debank',
          href: 'https://debank.com/official/Inverse_Finance/follower',
        },
        {
          label: 'Ecosystem',
          href: '/ecosystem',
        },
        // {
        //   label: 'Telegram',
        //   href: 'https://t.me/InverseFinance',
        // },
        {
          label: 'Newsletter',
          href: '/newsletter',
        },
      ],
    },
  ],
  "socials": [
    {
      href: 'https://twitter.com/InverseFinance',
      image: '/assets/socials/twitter.svg',
    },
    {
      href: 'https://discord.gg/YpYJC7R5nv',
      image: '/assets/socials/discord.svg',
    },
    {
      href: 'https://warpcast.com/inversefinance',
      image: '/assets/socials/warpcast-white.webp',
    },
    // {
    //   href: 'https://t.me/InverseFinance',
    //   image: '/assets/socials/telegram.svg',
    // },
    {
      href: 'https://github.com/InverseFinance',
      image: '/assets/socials/github.svg',
    },
  ]
}
