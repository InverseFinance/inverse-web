export const MENUS = {
  "nav": [
    {
      label: 'Frontier',
      href: '/frontier',
      submenus: [
        {
          label: 'Overview',
          href: '/frontier',
        },
        {
          label: 'Stake INV',
          href: '/frontier?marketType=supply&market=inv#',
        },
        {
          label: 'Borrow DOLA',
          href: '/frontier?marketType=borrow&market=dola#',
        },
      ],
    },
    {
      label: 'INV',
      href: '/inv',
    },
    {
      label: 'Swap',
      href: '/swap/DAI/DOLA',
      submenus: [
        {
          label: 'Buy DOLA with DAI',
          href: '/swap/DAI/DOLA',
        },
        {
          label: 'Buy DOLA with USDC',
          href: '/swap/USDC/DOLA',
        },
        {
          label: 'Buy DOLA with USDT',
          href: '/swap/USDT/USDT',
        },
      ]
    },
    {
      label: 'Bonds',
      href: '/bonds',
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
          href: '/transparency/dola',
          label: 'DOLA & the Feds',
        },
        {
          href: '/transparency/feds/policy/all',
          label: 'Feds',
        },
        {
          href: '/transparency/interest-model',
          label: 'Interest Rates',
        },
        {
          href: '/transparency/multisigs',
          label: 'Multisig Wallets',
        },
        {
          href: '/transparency/stabilizer',
          label: 'Stabilizer',
        },
        {
          href: '/transparency/liquidations',
          label: 'Liquidations',
        },
      ]
    },
    {
      href: '/analytics',
      label: 'Analytics',
      submenus: [
        {
          href: '/analytics',
          label: 'Dashboard',
        },
        {
          href: 'https://analytics.inverse.finance',
          label: 'Docs',
        }
      ],
    },
    {
      label: 'Blog',
      href: '/blog',
    },
  ],
  "footerGroups": [
    {
      groupLabel: 'Products',
      items: [
        {
          label: 'INV',
          href: '/inv',
        },
        {
          label: 'Frontier',
          href: '/frontier',
        },
        {
          label: 'DOLA',
          href: '/swap',
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
          label: 'Github',
          href: 'https://github.com/InverseFinance',
        },
      ],
    },
    {
      groupLabel: 'Community',
      items: [
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
    {
      groupLabel: 'Social',
      items: [
        {
          label: 'Twitter',
          href: 'https://twitter.com/InverseFinance',
        },
        {
          label: 'Medium',
          href: 'https://medium.com/inverse-finance',
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
      href: 'https://medium.com/inverse-finance',
      image: '/assets/socials/medium.svg',
    },
    {
      href: 'https://github.com/InverseFinance',
      image: '/assets/socials/github.svg',
    },
    {
      href: 'https://defipulse.com/inverse',
      image: '/assets/socials/defipulse.svg',
    },
  ]
}