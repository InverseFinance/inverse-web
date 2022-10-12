import { getToken, TOKENS } from "./tokens";

export const BOND_V2_FIXED_TERM = '0x007F7A6012A5e03f6F388dd9F19Fd1D754Cfc128'
export const BOND_V2_FIXED_EXPIRY = ''

export const BONDS_V2 = [
    {
        // existing OHM example
        id: 91,
        input: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
        ouput: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        underlying: getToken(TOKENS, 'WETH')!,
        howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
        inputPrice: 1,
    },
]