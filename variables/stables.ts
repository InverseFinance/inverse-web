
import { getToken, TOKENS } from "@app/variables/tokens";
import { TOKEN_IMAGES } from "./images";

const USDC = getToken(TOKENS, 'USDC');
const DAI = getToken(TOKENS, 'DAI');
const USDT = getToken(TOKENS, 'USDT');
const LUSD = { address: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', symbol: 'LUSD', image: TOKEN_IMAGES["LUSD"], decimals: 18 }
const USDP = { address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1', symbol: 'USDP', image: TOKEN_IMAGES["USDP"], decimals: 18 }
const USDE = { address: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3', symbol: 'USDe', image: TOKEN_IMAGES["USDE"], decimals: 18 }
const FDUSD = { address: '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409', symbol: 'FDUSD', image: TOKEN_IMAGES["FDUSD"], decimals: 18 }
const TUSD = { address: '0x0000000000085d4780b73119b644ae5ecd22b376', symbol: 'TUSD', image: TOKEN_IMAGES["TUSD"], decimals: 18 }
const GUSD = { address: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', symbol: 'GUSD', image: TOKEN_IMAGES["GUSD"], decimals: 2 }
const GHO = { address: '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f', symbol: 'GHO', image: TOKEN_IMAGES["GHO"], decimals: 18 }
const USD0 = { address: '0x73a15fed60bf67631dc6cd7bc5b6e8da8190acf5', symbol: 'USD0', image: TOKEN_IMAGES["USD0"], decimals: 18 }
const BUSD = { address: '0x4fabb145d64652a948d72533023f6e7a623c7c53', symbol: 'BUSD', image: TOKEN_IMAGES["BUSD"], decimals: 18 }
const ALUSD = { address: '0xbc6da0fe9ad5f3b0d58160288917aa56653660e9', symbol: 'ALUSD', image: TOKEN_IMAGES["ALUSD"], decimals: 18 }
const USDM = { address: '0x59d9356e565ab3a36dd77763fc0d87feaf85508c', symbol: 'USDM', image: TOKEN_IMAGES["USDM"], decimals: 18 }
const USDA = { address: '0x0000206329b97db379d5e1bf586bbdb969c63274', symbol: 'USDA', image: TOKEN_IMAGES["USDA"], decimals: 18 }
const MIM = { address: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3', symbol: 'MIM', image: TOKEN_IMAGES["MIM"], decimals: 18 }
const FXUSD = { address: '0x085780639cc2cacd35e474e71f4d000e2405d8f6', symbol: 'FXUSD', image: TOKEN_IMAGES["FXUSD"], decimals: 18 }
const USD3 = { address: '0x0d86883faf4ffd7aeb116390af37746f45b6f378', symbol: 'USD3', image: TOKEN_IMAGES["USD3"], decimals: 18 }
const EUSD = { address: '0xa0d69e286b938e21cbf7e51d71f6a4c8918f482f', symbol: 'EUSD', image: TOKEN_IMAGES["EUSD"], decimals: 18 }
const FEI = { address: '0x956f47f50a910163d8bf957cf5846d573e7f87ca', symbol: 'FEI', image: TOKEN_IMAGES["FEI"], decimals: 18 }
const MKUSD = { address: '0x4591dbff62656e7859afe5e45f6f47d3669fbb28', symbol: 'MKUSD', image: TOKEN_IMAGES["MKUSD"], decimals: 18 }
const PYUSD = getToken(TOKENS, 'PYUSD');
const CRVUSD = getToken(TOKENS, 'crvUSD');
const FRAX = getToken(TOKENS, 'FRAX');
const DOLA = getToken(TOKENS, 'DOLA');
const USDS = getToken(TOKENS, 'USDS');
const FRXUSD = getToken(TOKENS, 'frxUSD');

export const STABLE_LIST = [
    DOLA, DAI, USDT, USDS, FRXUSD, LUSD, USDE, USDP, USDC, CRVUSD, PYUSD, FEI, MIM, USD3, FXUSD, EUSD, MKUSD, GHO, USDM, USDA, USD0, BUSD, ALUSD, GUSD, TUSD, FDUSD
];
export const ETH_SAVINGS_STABLECOINS = STABLE_LIST.reduce((acc, curr) => {
    acc[curr.address] = curr;
    return acc;
}, {});
export const STABLE_ADDRESSES = STABLE_LIST.map(t => t.address!);
export const STABLE_SYMBOLS = STABLE_LIST.map(t => t.symbol!);
export const STABLE_SYMBOLS_LOWER = STABLE_SYMBOLS.map(s => s.toLowerCase());