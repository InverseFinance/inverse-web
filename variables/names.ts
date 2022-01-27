import { UNDERLYING } from './tokens'
import { getToken } from '@app/util/markets';
import { TOKENS } from '@app/variables/tokens';

const namedAddresses: { [key: string]: string } = {
    '0xE8929AFd47064EfD36A7fB51dA3F8C5eb40c4cb4': 'Oracle',
    '0x0000000000000000000000000000000000000000': 'BurnAddress',
    '0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89': 'ETHDOLAStakingPool',
    '0xFBAB1B85A145Cd648374aCebf84cDD0247268587': 'Vester',
    // Feds
    '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664': 'Fed Fuse6',
    '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7': 'Fed Anchor',
    // Cross-Chain Feds
    '0x4d7928e993125A9Cefe7ffa9aB637653654222E2': 'Fed Scream',
    // dao members
    '0x7165ac4008c3603AfE432787419eB61B3a2CEe8B': 'BenLavabo',
    '0x4db09171350Be4f317a67223825abeCC65482E32': 'Mr Brown Whale',
    '0x2f80E5163A7A774038753593010173322eA6f9fe': 'Alan',
    '0x724F321C4efeD5e3C7CcA40168610c258c82d02F': 'Somer',
    '0x46B14628fFBC01a87AB2d66e95600b8dC4A49Ce2': 'Keen',
    '0x23E01e05AA1376FA3AC83C954816B967A7302891': 'zombiehobbes',
    '0x575F5b61D3e5a011080A0Df0865b81f2352DB83b': 'adamQ',
    '0x00A5af2D7DA07dF76073A6f478f0fB4942D2659a': 'cs',
    '0x7705E47BD6Eb6Dc5a11aA1839639F3Dc6E1a6EaF': 'DefiChad',
    '0x2492897E6138ae7E56D3d3ceB5AD76B801ec7d3f': 'ees2oo',
    '0xB12bc4A0c497F1C3BaEe7031c5bfD119ECc0c906': 'goldenandy73',
    '0xfe97B38192Cb30aDD0bBe5e01E6a617562CC8318': 'Key',
    '0x99f18ae1543A2B952180AAe9DbFBC3c594D14293': 'Block Dance',
    '0xD72B03B7F2E0b8D92b868E73e12b1f888BEFBeDA': 'Longinverse',
    '0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48': 'Kiwi',
    '0xb9F43E250dadf6b61872307396AD1b8bEBa27bCD': 'BasedXeno',
    '0x34A7a276eD77c6FE866c75Bbc8d79127c4E14a09': 'TheAlienTourist',
    '0xE58ED128325A33afD08e90187dB0640619819413': 'PatB',
    '0x41225088326fE055Fbf40AD34d862bbd7bd0c9B4': 'PatB GWG',
}

Object.entries(UNDERLYING).forEach(([key, value]) => {
    namedAddresses[key] = `an${value.symbol}`
    if(value.address) {
        namedAddresses[value.address] = value.symbol
    }
})

namedAddresses[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN)?.symbol

if(process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD) {
    namedAddresses[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN)?.symbol+'-old'
}

export const CUSTOM_NAMED_ADDRESSES = namedAddresses;