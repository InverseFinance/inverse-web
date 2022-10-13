import { getToken, TOKENS } from "./tokens";

export const BOND_V2_FIXED_TERM = '0x007F7A6012A5e03f6F388dd9F19Fd1D754Cfc128'
export const BOND_V2_FIXED_EXPIRY = ''
export const BOND_V2_REFERRER = '0x926dF14a23BE491164dCF93f4c468A50ef659D5B'

export const BONDS_V2 = [
    {
        // existing OHM example
        id: 91,
        bondContract: BOND_V2_FIXED_TERM,
        referrer: BOND_V2_REFERRER,
        input: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        output: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
        underlying: getToken(TOKENS, 'WETH')!,
        howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
        inputPrice: 1,
    },
    {
        // existing OHM example
        id: 92,
        bondContract: BOND_V2_FIXED_TERM,
        referrer: BOND_V2_REFERRER,
        input: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        output: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
        underlying: getToken(TOKENS, 'WETH')!,
        howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
        // inputPrice: 1,
    },
]