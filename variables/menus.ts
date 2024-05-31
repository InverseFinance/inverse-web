export const MENUS = {
  "nav": [
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Markets',
      href: '/firm',
      submenus: [
        {
          label: 'FiRM',
          href: '/firm',
        },
        {
          label: 'Stake INV',
          href: '/firm/INV',
        },
        {
          label: 'FiRM rewards',
          href: '/firm/rewards',
        },
        {
          label: 'FiRM stakers',
          href: '/firm/stakers',
        },
        {
          label: 'Liquidate Loans',
          href: '/firm/positions',
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
      label: 'sDOLA',
      href: '/sDOLA',
      submenus: [
        {
          label: 'sDOLA',
          href: '/sDOLA',
        },
        {
          label: 'sDOLA Stats',
          href: '/sdola/stats',
        },
        {
          label: 'DSA',
          href: '/dsa',
        },
        {
          label: 'DSA Stats',
          href: '/dsa/stats',
        },
        {
          label: 'Buy DBR (auction)',
          href: '/dbr/auction',        
        },
      ],
    },
    {
      label: 'Governance',
      href: '/governance',
      submenus: [
        {
          label: 'Drafts & Proposals',
          href: '/governance',
        },
        {
          label: 'Passed Proposals',
          href: '/governance/proposals',
        },
        {
          label: 'Create a Draft',
          href: '/governance/propose?proposalLinkData=%7B"title"%3A"Draft"%2C"description"%3A"Forum+post+link,+Draft+content"%2C"actions"%3A%5B%5D%7D#',
        },
        {
          label: 'Delegates',
          href: '/governance/delegates',
        },
        {
          label: 'Your Profile',
          href: '/governance/delegates/$account',
        },
      ]
    },
    {
      label: 'Transparency',
      href: '/transparency/treasury',
      submenus: [
        // {
        //   href: '/transparency/overview',
        //   label: 'Overview',
        // },
        {
          href: '/transparency/treasury',
          label: 'Treasury',
        },
        {
          href: '/transparency/veNfts',
          label: 'veNfts',
        },
        {
          label: 'FiRM users',
          href: '/transparency/dbr#Users',
        },
        {
          href: '/transparency/liquidity',
          label: 'Liquidity',
        },
        {
          href: '/transparency/dao',
          label: 'INV & DAO',
        },
        {
          href: '/transparency/dbr',
          label: 'DBR & FiRM',
        },
        {
          href: '/transparency/dola',
          label: 'DOLA & Feds',
        },
        {
          href: '/transparency/feds',
          label: 'Feds Policy & Income',
        },
        {
          href: '/transparency/multisigs',
          label: 'Multisig Wallets',
        },
        {
          href: '/transparency/bad-debts',
          label: 'Bad Debts',
        },
        {
          href: '/transparency/frontier/overview',
          label: 'Frontier & Other',
        },
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
      href: 'https://docs.inverse.finance',
      submenus: [
        {
          href: 'https://docs.inverse.finance',
          label: 'Docs',
        },
        {
          label: 'Swap',
          href: '/swap?fromToken=DOLA&toToken=INV',
          needReload: true,
        },
        {
          label: 'Compare Rates',
          href: '/firm/comparator',
        },
        {
          label: 'Blog',
          href: '/blog',
        },
        {
          label: 'Audits',
          href: '/audits',
        },
        {
          label: 'Yield Opportunities',
          href: '/yield-opportunities',
        },        
        {
          label: 'Native Base Bridge',
          href: '/base',
          needReload: true,
        },
        {
          label: 'Analytics',
          href: 'https://inverse.watch/',
        },
        // {
        //   label: 'About FiRM',
        //   href: '/about-firm',
        // },
        {
          label: 'FiRM Whitepaper',
          href: '/whitepaper',
        },
        {
          label: 'sDOLA Whitepaper',
          href: '/whitepaper/sDOLA',
        },        
        {
          label: 'Frontier - Debt Converter',
          href: '/frontier/debt-converter',
        },
        {
          label: 'Frontier - Debt Repayer',
          href: '/frontier/debt-repayer',
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
          label: 'sDOLA',
          href: '/sDOLA',
        },
        {
          label: 'DOLA',
          href: 'https://docs.inverse.finance/inverse-finance/using-dola',
        },
        {
          label: 'DBR',
          href: 'https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights',
        },
        {
          label: 'INV',
          href: 'https://docs.inverse.finance/inverse-finance/using-inv',
        },
        {
          label: 'FiRM',
          href: '/firm',
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
          href: '/governance',
        },
        {
          label: 'Transparency',
          href: '/transparency',
        },
        {
          label: 'Analytics',
          href: '/analytics',
        },
        {
          label: 'Forum',
          href: 'https://forum.inverse.finance',
        },
      ],
    },
    {
      groupLabel: 'Support',
      items: [
        {
          label: 'Docs',
          href: 'https://docs.inverse.finance/',
        },
        {
          label: 'Audits',
          href: '/audits',
        },
        {
          label: 'Risk Gitbook',
          href: 'https://inverse-dao.gitbook.io/inverse-finance-risk/',
        },
        {
          label: 'Github',
          href: 'https://github.com/InverseFinance',
        },
        {
          label: 'Whitepaper',
          href: '/whitepaper',
        },
        {
          label: 'sDOLA',
          href: '/whitepaper/sDOLA',
        },
        {
          label: 'About FiRM',
          href: '/about-firm',
        },
        {
          label: 'Brand Assets',
          href: '/brand-assets-2024-v1.0.1.pdf',
        },
      ],
    },
    {
      groupLabel: 'Community',
      items: [
        {
          label: 'Blog',
          href: '/blog',
        },
        {
          label: 'Bug Bounty',
          href: 'https://discord.gg/YpYJC7R5nv',
        },
        {
          label: 'Discord',
          href: 'https://discord.gg/YpYJC7R5nv',
        },
        {
          label: 'Debank',
          href: 'https://debank.com/official/Inverse_Finance/follower',
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