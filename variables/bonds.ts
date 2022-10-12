import { getToken, TOKENS } from "./tokens";

export const BOND_V2_CONTRACT = '0x007FEA7A23da99F3Ce7eA34F976f32BF79A09C43'

export const BONDS_V2 = [
    {
        // existing OHM example
        id: 1,
        input: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5',
        ouput: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5',
        underlying: getToken(TOKENS, 'DOLA')!,
        howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
    },
]