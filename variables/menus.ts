export const MENUS = {
  "nav": [
    {
      label: 'Anchor',
      href: '/anchor',
      submenus: [
        {
          label: 'Overview',
          href: '/anchor',
        },
        {
          label: 'Stake INV',
          href: '/anchor?marketType=supply&market=inv#',
        },
        {
          label: 'Borrow DOLA',
          href: '/anchor?marketType=borrow&market=dola#',
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
          href: '/governance/propose?proposalLinkData=%7B"title"%3A"Draft"%2C"description"%3A"Draft+content"%2C"actions"%3A%5B%5D%7D#',
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
      ]
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
          label: 'Anchor',
          href: '/anchor',
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
          href: 'https://discord.com/invite/InverseFinance',
        },
        {
          label: 'Telegram',
          href: 'https://t.me/InverseFinance',
        },
        {
          label: 'Blog',
          href: '/blog',
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
      href: 'https://discord.com/invite/InverseFinance',
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