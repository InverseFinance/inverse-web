export const ACTIVE_POLL = '';

export const POLLS = {
    'firm-stand-alone-design': {
        active: true,
        question: 'Which design do you prefer?',
        answers: [
            {
                value: 'emerald',
                label: "Emerald",
            },
            {
                value: 'gold',
                label: "Gold",
            },
            {
                value: 'tradfi',
                label: "Elegant TradFi",
            },
            {
                value: 'amethyst',
                label: "Amethyst",
            },
             {
                value: 'terminal',
                label: "Terminal",
            },
             {
                value: 'aurora',
                label: "Aurora",
            },
             {
                value: 'liquid-glass',
                label: "Liquid glass",
            },
             {
                value: 'cyber',
                label: "Cyber",
            },
        ],
    },
}

export const GATED_POLLS = {
    'new-designs': {
        active: true,
        theme: 'design',
        question: 'Which design do you prefer?',
        answers: [
            {
                value: 'emerald',
                label: "Emerald",
            },
            {
                value: 'gold',
                label: "Gold",
            },
            {
                value: 'tradfi',
                label: "Elegant TradFi",
            },
            {
                value: 'amethyst',
                label: "Amethyst",
            },
             {
                value: 'terminal',
                label: "Terminal",
            },
             {
                value: 'aurora',
                label: "Aurora",
            },
             {
                value: 'liquid-glass',
                label: "Liquid glass",
            },
             {
                value: 'cyber',
                label: "Cyber",
            },
        ],
    },
    'new-designs-b': {
        active: true,
        theme: 'design',
        question: 'Which design do you not like at all?',
        answers: [
            {
                value: 'emerald',
                label: "Emerald",
            },
            {
                value: 'gold',
                label: "Gold",
            },
            {
                value: 'tradfi',
                label: "Elegant TradFi",
            },
            {
                value: 'amethyst',
                label: "Amethyst",
            },
             {
                value: 'terminal',
                label: "Terminal",
            },
             {
                value: 'aurora',
                label: "Aurora",
            },
             {
                value: 'liquid-glass',
                label: "Liquid glass",
            },
             {
                value: 'cyber',
                label: "Cyber",
            },
        ],
    },
    'anime-girl': {
        active: true,
        theme: 'brand',
        question: 'Should we have an anime-girl avatar Mascot on the website and/or as an X ai social media account?',
        answers: [
            {
                value: 'yes',
                label: "Yes that sounds interesting",
            },
            {
                value: 'web-only',
                label: "Not sure, maybe just on the website",
            },
            {
                value: 'x-only',
                label: "Not sure, maybe just as a X ai social media account",
            },
            {
                value: 'no',
                label: "No I don't think it's a good idea",
            },
        ],
    },
    'public-polls': {
        active: true,
        theme: 'website',
        question: 'Website: Should we have non-tokengated polls as well?',
        answers: [
            {
                value: 'yes',
                label: "Yes, let's also have public polls",
            },
            {
                value: 'no',
                label: "No, polls should remain for tokenholders only",
            },
        ],
    },
}