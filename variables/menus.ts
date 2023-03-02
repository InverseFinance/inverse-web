export const MENUS = {
  "nav": [
    {
      label: 'Borrow',
      href: '/firm',
      submenus: [
        {
          label: 'FiRM',
          href: '/firm',
        },
        // {
        //   label: 'WETH Market',
        //   href: '/firm/WETH',
        // },
        {
          label: 'Frontier (deprecated)',
          href: '/frontier',
        },
        {
          label: 'Frontier - Debt Converter',
          href: '/frontier/debt-converter',
        },
        {
          label: 'Frontier - Debt Repayer',
          href: '/frontier/debt-repayer',
        },
        // {
        //   label: 'Borrow DOLA',
        //   href: '/frontier?marketType=borrow&market=dola#',
        // },
      ],
    },
    {
      label: 'Stake',
      href: '/frontier',
    },
    {
      label: 'Bond',
      href: '/bonds',
    },
    {
      label: 'Earn',
      href: '/yield-opportunities',
      submenus: [
        {
          label: 'Yield Opportunities',
          href: '/yield-opportunities',
        },
        {
          label: 'Liquidate Loans',
          href: '/firm/positions',
        },
        {
          label: 'Replenish DBR',
          href: '/firm/dbr-spenders',
        },
      ],
    },
    // {
    //   label: 'Claim',
    //   href: '/claim-dbr',
    // },
    {
      label: 'Swap',
      href: '/swap/DAI/DOLA',
      // submenus: [
      //   {
      //     label: 'Swap DOLA',
      //     href: '/swap/DAI/DOLA',
      //   },
      //   {
      //     label: 'Tokens',
      //     href: '/tokens',
      //   },
      // ]
    },
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
    {
      label: 'Learn',
      href: 'https://docs.inverse.finance',
      submenus: [
        {
          href: 'https://docs.inverse.finance',
          label: 'Docs',
        },
        {
          label: 'About FiRM',
          href: '/about-firm',
        },
        {
          label: 'FiRM Whitepaper',
          href: '/whitepaper',
        },
        {
          href: '/analytics',
          label: 'Analytics',
        },
        {
          label: 'Blog',
          href: '/blog',
        },
        // {
        //   href: '/transparency/treasury',
        //   label: 'Treasury',
        // },
        // {
        //   href: '/transparency/dao',
        //   label: 'DAO',
        // },
        // {
        //   href: '/transparency/inv',
        //   label: 'INV',
        // },
        // {
        //   href: '/transparency/dola',
        //   label: 'DOLA & the Feds',
        // },
        // {
        //   href: '/transparency/feds/policy/all',
        //   label: 'Feds',
        // },
        // {
        //   href: '/transparency/interest-model',
        //   label: 'Interest Rates',
        // },
        // {
        //   href: '/transparency/multisigs',
        //   label: 'Multisig Wallets',
        // },
        // {
        //   href: '/transparency/stabilizer',
        //   label: 'Stabilizer',
        // },
        // {
        //   href: '/transparency/shortfalls',
        //   label: 'Shortfalls',
        // },
        // {
        //   href: '/transparency/liquidations',
        //   label: 'Liquidations',
        // },
      ]
    },        
    {
      label: 'Transparency',
      href: '/transparency/overview',
      submenus: [
        {
          href: '/transparency/overview',
          label: 'Overview',
        },
        {
          href: '/transparency/treasury',
          label: 'Treasury',
        },
        {
          href: '/transparency/dao',
          label: 'DAO',
        },
        {
          href: '/transparency/inv',
          label: 'INV',
        },
        {
          href: '/transparency/dbr',
          label: 'DBR',
        },
        {
          href: '/transparency/dola',
          label: 'DOLA & Feds',
        },
        {
          href: '/transparency/feds/policy/all',
          label: 'Feds Policy & Income',
        },
        {
          href: '/transparency/multisigs',
          label: 'Multisig Wallets',
        },
        {
          href: '/transparency/frontier/overview',
          label: 'Frontier (deprecated)',
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
  ],
  "footerGroups": [
    {
      groupLabel: 'Products',
      items: [
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
          href: '/frontier',
        },
        {
          label: 'Bonds',
          href: '/bonds',
        },
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
          label: 'About FiRM',
          href: '/about-firm',
        },
      ],
    },
    {
      groupLabel: 'Community',
      items: [
        {
          label: 'Bug Bounty',
          href: 'https://discord.gg/YpYJC7R5nv',
        },
        {
          label: 'Discord',
          href: 'https://discord.gg/YpYJC7R5nv',
        },
        {
          label: 'Telegram',
          href: 'https://t.me/InverseFinance',
        },
        {
          label: 'Blog',
          href: '/blog',
        },
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
      href: 'https://t.me/InverseFinance',
      image: '/assets/socials/telegram.svg',
    },
    {
      href: 'https://github.com/InverseFinance',
      image: '/assets/socials/github.svg',
    },
  ]
}