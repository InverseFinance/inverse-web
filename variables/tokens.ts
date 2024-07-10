import { HAS_REWARD_TOKEN } from '@app/config/constants';
import { Token, TokenList } from '@app/types';
import { isAddress } from 'ethers/lib/utils';
import { PROTOCOLS_BY_IMG, PROTOCOL_IMAGES, TOKEN_IMAGES } from './images';

// TODO: refacto in cleaner way with markets and tokens

export const getToken = (tokens: TokenList, symbolOrAddress: string, extend = {}) => {
  const t = Object.entries(tokens)
    .map(([address, token]) => token)
    .find(token => isAddress(symbolOrAddress) ? token?.address?.toLowerCase() === symbolOrAddress?.toLowerCase() : token?.symbol?.toLowerCase() === symbolOrAddress?.toLowerCase())
  return { ...t, ...extend }
}

export const getRewardToken = () => {
  return getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN!)
}

const deprecatedBadge = {
  text: "DEPRECATED",
  color: "gray",
}

const pausedBadge = {
  text: "PAUSED",
  color: "gray",
}

const chainTokenAddresses = {
  "1": {
    INV: '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68',
    DOLA: '0x865377367054516e17014CcdED1e7d814EDC9ce4',
    SDOLA: '0xb45ad160634c528Cc3D2926d9807104FA3157305',
    PYUSD: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    XSUSHI: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    WSTETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    INVDOLASLP: '0x5BA61c0a8c4DccCc200cd0ccC40a5725a426d002',
    INVDOLAAURA: '0x6992299d078858C2f64D046A172AC963b89038f7',
    INVDOLABLP: '0x441b8a1980f2F2E43A9397099d15CC2Fe6D36250',
    INVDOLAULP: '0xb268c1c44a349d06a42cf24988162dadc48d839e',
    INVETHSLP: '0x328dFd0139e26cB0FEF7B0742B49b0fe4325F821',
    INVETHLP: '0x73e02eaab68a41ea63bdae9dbd4b7678827b2352',
    DOLAWETHULP: '0xecfbe9b182f6477a93065c1c11271232147838e5',
    DOLA3POOLCRV: '0xAA5A67c256e27A5d80712c51971408db3370927D',
    DOLAUSDCUNIV3: '0x7c082BF85e01f9bB343dbb460A14e51F67C58cFB',
    DOLADBRUNIV3: '0x6a279e847965ba5dDc0AbFE8d669642F73334A2C',
    THREECRV: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
    FLOKI: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e',
    WFTM: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
    MIM: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3',
    DOLAWETHLP: '0xb204bf10bc3a5435017d3db247f56da601dfe08a',
    CVX: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B',
    CVXCRV: '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7',
    CVXFXS: '0xFEEf77d3f69374f66429C91d732A244f074bdf74',
    FXS: '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
    CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    VLCVX: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
    VLAURA: '0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC',
    LOCKEDDOLAFRAXBP: '0xF06c8696730cf760619e4fA0eDd0f79ea50531A9',    
    BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
    AURA: '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF',
    DOLAUSDCBALANCER: '0xFf4ce5AAAb5a627bf82f4A571AB1cE94Aa365eA6',
    SDOLADOLABALANCER: '0x264062CA46A1322c2E6464471764089E01F22F19',
    SDOLADOLAAUR: '0xA36d3799eA28f4B75653EBF9D91DDA4519578086',
    SDOLAPYUSDBALANCER: '0x09B03b7cBB19b3daE94F884cF60dBc3c99a3947b',
    DBRDOLABALANCER: '0x445494F823f3483ee62d854eBc9f58d5B9972A25',
    DOLAMKUSDBALANCER: '0x383e7859271B2D0589B013b6d944572a0a8bE3cB',
    MKUSD: '0x4591DBfF62656E7859Afe5e45f6f47D3669fBB28',
    INVDOLALIQUIS: '0x21e83dbfD8F11d885eBA9f9ba126Da11AE0671b7',
    // DOLABBEUSD: '0x133d241F225750D2c92948E464A5a80111920331',
    // DOLABBEUSDALP: '0xFdbd847B7593Ef0034C58258aD5a18b34BA6cB29',
    // BBEUSD: '0x50Cf90B954958480b8DF7958A9E965752F627124',
    SDCRV: '0xd1b5651e55d4ceed36251c61c50c889b36f6abb5',
    SDCRVGAUGE: '0x7f50786A0b15723D741727882ee99a0BF34e3466',
    // yearn vaults
    YVDOLA3POOLCRV: '0xd88dBBA3f9c4391Ee46f5FF548f289054db6E51C',
    YVUSDT: '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
    YVUSDC: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
    YVDAI: '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
    YVYFI: '0xdb25cA703181E7484a155DD612b06f57E12Be5F0',
    YVWETH: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c',
    YVCRVCVXETH: '0x1635b506a88fBF428465Ad65d00e8d6B6E5846C3',
    YVCRVIB: '0x27b7b1ad7288079A66d12350c828D3C00A6F07d7',
    YVCRV3CRYPTO: '0xE537B5cc158EB71037D4125BDD7538421981E6AA',
    YVCRVSTEHWETH: '0x5faF6a2D186448Dfa667c51CB3D695c7A6E52d8E',
    DOLAFRAXUSDC: '0xE57180685E3348589E9521aa53Af0BCD497E884d',
    DOLAFRAXPYUSD: '0xef484de8C07B6e2d732A92B5F78e81B38f99f95E',
    DOLAFRAXPYUSDCVX: '0xE8cBdBFD4A1D776AB1146B63ABD1718b2F92a823',
    FRAXPYUSD: '0xA5588F7cdf560811710A2D82D3C9c99769DB1Dcb',
    DOLAFXUSDLP: '0x189B4e49B5cAf33565095097b4B960F14032C7D0',
    DOLAFXUSDLPCVX: '0x2ef1dA0368470B2603BAb392932E70205eEb9046',
    INVETHCLP: '0xEAc004214F2ACa7a6BA01C7558cb4a85E7958ddD',
    DOLADBRCLP: '0x0a6B1d9F920019BAbc4De3F10c94ECB822106104',
    FRAXUSDC: '0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC',
    FRAX: '0x853d955acef822db058eb8505911ed77f175b99e',
    FXUSD: '0x085780639CC2cACd35E474e71f4d000e2405d8f6',
    DBR: '0xAD038Eb671c44b853887A7E32528FaB35dC5D710',
    GOHM: '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f',
    CUSD: '0xC285B7E09A4584D027E5BC36571785B515898246',
    DOLACUSDBLP: '0x384F67aA430376efc4f8987eaBf7F3f84eB9EA5d',
    DOLACUSDALP: '0x0995a508dF9606f1C6D512a2d6BA875Cf3cE94C3',
    // DOLAUSDCALP: '0x22915f309ec0182c85cd8331c23bd187fd761360',
    DOLAUSDCALP2: '0xb139946D2F0E71b38e2c75d03D87C5E16339d2CD',
    DOLAFRAXUSDCCVX: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c',
    DOLACRVUSDLP: '0x8272e1a3dbef607c04aa6e5bd3a1a134c8ac063b',
    CRVUSD: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E',
    INVTRICRYPTO: '0x5426178799ee0a0181A89b4f57eFddfAb49941Ec',
    INVTRICRYPTOYEARNV2: '0x6949145469362F9eeaB3c96Ea41b51D9B4cC2b21',
    DBRTRICRYPTO: '0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a',
    INVTRICRYPTOCVX: '0x21E2d7f66DF6F4e8199210b9490a51831C9847C7',
    DBRTRICRYPTOCVX: '0x9a2d1b49b7c8783E37780AcE4ffA3416Eea64357',
    STYCRV: '0x27B5739e22ad9033bcBf192059122d163b60349D',
    YCRV: '0xFCc5c47bE19d06BF83eB04298b026F81069ff65b',
    STCVX: '0xCF50b810E57Ac33B91dCF525C6ddd9881B139332',
    DOLAINVUNIV3: '0xbD1F921786e12a80F2184E4d6A5cAcB25dc673c9',
    RGUSD: '0x78da5799CF427Fee11e9996982F4150eCe7a99A7',
    DOLARGUSDCRVLP: '0x20BB4a325924917E3336753BA5350a84F70f392e',
    STYETH: '0x583019fF0f430721aDa9cfb4fac8F06cA104d0B4',
    SFRAX: '0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32',
    // PAL: '0xAB846Fb6C81370327e784Ae7CbB6d6a6af6Ff4BF',
  },
  "250": {
    DOLA2POOLCRV: '0x28368d7090421ca544bc89799a2ea8489306e3e5',
    SPOOKYLP: '0x49ec56cc2adaf19c1688d3131304dbc3df5e1ccd',
    DOLA: '0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c',
    INV: '0xb84527D59b6Ecb96F433029ECc890D4492C5dCe1',
    USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    VELOCIMETERDOLAERNLP: '0xDcA71A777ADDc68709Ae7583658Ba554b5e6085C',
    ERN: '0xce1E3cc1950D2aAEb47dE04DE2dec2Dc86380E0A',
  },
  // optimisim
  "10": {
    DOLA: '0x8aE125E8653821E851F12A49F7765db9a9ce7384',
    VELOV1: '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05',
    VELO: '0x9560e827af36c94d2ac33a39bce1fe78631088db',
    VEVELO: '0xFAf8FD17D9840595845582fCB047DF13f006787d',
    // VEVELOV1: '0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26',
    VELODOLAUSDCLP: '0x6C5019D345Ec05004A7E7B0623A91a0D9B8D590d',
    VELOV2DOLAUSDCLP: '0xB720FBC32d60BB6dcc955Be86b98D8fD3c4bA645',
    VELODOLALP: '0x1eBE6427f037385dDcB95aa688c18272415e3F46',
    VELODOLAMAILP: '0x21950a0cA249A0ef3d182338c86c8C066B24D801',
    VELOV2DOLAMAILP: '0xBE418771bC91F75C4d2BcE1d5E2b7286F50992da',
    VELODOLAUSDplusLP: '0xa99817d2d286C894F8f3888096A5616d06F20d46',
    VELOV2DOLAUSDplusLP: '0x0b28C2e41058EDc7D66c516c617b664Ea86eeC5d',
    VELOV2DOLAERNLP: '0xEea82dCab12C855E3736558d80500ED52c8598cd',
    VELOV2DOLAUSDC2LP: '0xA56a25Dee5B3199A9198Bbd48715EE3D0ed98378',
    VELOV2DOLAALUSDLP: '0x67C253eB6C2e69F9E1114aEeAD0DB4FA8F417AC3',
    ALUSD: '0xCB8FA9a76b8e203D8C3797bF438d8FB81Ea3326A',
    ERN: '0xc5b001DC33727F8F26880B184090D3E252470D45',
    USDCE: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDplus: '0x73cb180bf0521828d8849bc8CF2B920918e23032',
    MAI: '0xdFA46478F9e5EA86d57387849598dbFB2e964b02',
    VELODOLAFRAXLP: '0xD29DE64c1a9Dd3e829A7345BE1E9c32a9414541f',
    VELOV2DOLAFRAXLP: '0x1f8b46abe1EAbF5A60CbBB5Fb2e4a6A46fA0b6e6',
    FRAX: '0x2E3D870790dC77A83DD1d18184Acc7439A53f475',
    ARCHLYDOLAUSDCLP: '0x5b701874FFFc9dFF9305E1cA09705247E13cF717',
    DOLAUSDCBEETLP: '0xACfE9b4782910A853b68abbA60f3FD8049Ffe638',
    DOLAUSDCALP: '0x5a473b418193C6a3967aF0913135534B7b3B23E9',
  },
  "5": {
    DOLA: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
    WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    WBTC: '0xDAc02EE9f5F0Fe62d248be235f4ACd0d5E0451a0',
    INV: '0x4C1948bf7E33c711c488f765B3A8dDD9f7bEECb4',
  },
  // bsc
  "56": {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    DOLA: '0x2F29Bc0FFAF9bff337b31CBe6CB5Fb3bf12e5840',
    THENA: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    VETHENA: '0xfBBF371C9B0B994EebFcC977CEf603F7f31c070D',
    CUSD: '0xFa4BA88Cf97e282c505BEa095297786c16070129',
    THENADOLACUSDLP: '0x7061F52ed4942021924745D454d722E52e057e03',
    THENADOLAWBNBLP: '0xc5856601712E8a74d57cdc7a47fB1B41C1a6Fae2',
    THENADOLAFRAXLP: '0xFD66A4a4c921CD7194ABAb38655476a06fbAEa05',
    FRAX: '0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40',
    WUSDR: '0x2952beb1326acCbB5243725bd4Da2fC937BCa087',
    THENADOLAWUSDRLP: '0x92104a7BeC32297DdD022A8f242bf498d0470876',
  },
  // polygon
  "137": {
    DOLA: '0xbC2b48BC930Ddc4E5cFb2e87a45c379Aab3aac5C',
    CASH: '0x80487b4f8f70e793A81a42367c225ee0B94315DF',
    MAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    MAIDOLASATLP: '0x72b11596523B35b2ACac5A33915b6297f5e942Ac',
    CASHDOLASATLP: '0x2c5BE0526343A5057B2e10372e64845d666e7140',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDR: '0xb5DFABd7fF7F83BAB83995E72A52B97ABb7bcf63',
    RUSDR: '0x40379a439D4F6795B6fc9aa5687dB461677A2dBa',
    DOLAUSDRPEARLLP: '0x394DeB5c87e1df9aa7400e99F5cd27a0cD0A64f2',
    DOLAUSDRPEARLLP2: '0x8B0630Cb57d8E63444E97C19a2e82Bb1988399e2',
    DOLACASHRETROLP: '0x4b4B895a0dD744B4893aA4370A8F7eDbde5Fd90e',
    DOLAUSDCRETROLP: '0x896ffE2cd28Ba13ddDa98103a3B66E82bb36BeE3',
    CASHV2: '0x5D066D022EDE10eFa2717eD3D79f22F949F8C175',
  },
  // arbitrum
  "42161": {
    DOLA: '0x6A7661795C374c0bFC635934efAddFf3A7Ee23b6',
    USDCE: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    FRAX: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F',
    MAI: '0x3F56e0c36d275367b8C502090EDF38289b3dEa0d',
    RAM: '0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418',
    STR: '0x5DB7b150c5F38c5F5db11dCBDB885028fcC51D68',
    SLIZ: '0x463913D3a3D3D291667D53B8325c598Eb88D3B0e',
    VESLIZ: '0x29d3622c78615A1E7459e4bE434d816b7de293e4',
    VESTR: '0x450330Df68E1ed6e0683373D684064bDa9115fEe',
    VERAM: '0xAAA343032aA79eE9a6897Dab03bef967c3289a06',
    SLIZDOLAUSDCLP: '0xDf58C5f73ea1c9003ABFEB9194EB817D256cb3Ad',
    RAMDOLAUSDCLP: '0xDd8b120DdaE0F19b922324012816F2F3Ce529BF8',
    RAMDOLAMAILP: '0x052f7890E50fb5b921BCAb3B10B79a58A3B9d40f',
    RAMDOLAFRAXLP: '0x1850e96550d6716d43bA4d7DF815FfC32bD0d03e',
    STERLINGDOLAUSDCLP: '0x8806e6B5F57C780180827E77115794d9C8100Cb7',
    CHRONOS: '0x15b2fb8f08E4Ac1Ce019EADAe02eE92AeDF06851',
    VECHRONOS: '0x9A01857f33aa382b1d5bb96C3180347862432B0d',
    DOLAUSDPLUSCHRONOS: '0xBbD7fF1728963A5Eb582d26ea90290F84E89bd66',
    USDPLUS: '0xe80772Eaf6e2E18B651F160Bc9158b2A5caFCA65',
    DOLAUSDCBALLP: '0x8bc65Eed474D1A00555825c91FeAb6A8255C2107',
    DOLAUSDCALP: '0xAc7025Dec5E216025C76414f6ac1976227c20Ff0',
    BAL: '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8',
    AURA: '0x1509706a6c66CA549ff0cB464de88231DDBe213B',
    RAMDOLAUSDCLP2: '0xBa3A2CA37b5208f8efde90dA22060692Dd3De9b1',
    // VLAURA: '',
  },
  // avalanche
  "43114": {
    DOLA: '0x221743dc9E954bE4f86844649Bf19B43D6F8366d',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    SOLISNEK: '0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d',
    VESOLISNEK: '0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350',    
    DOLAUSDCSOLISNEDKLP: '0x7680D9F07f80B11A7a96E4443398245D917998e6',
  },
  // base
  "8453": {
    DOLA: '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
    USDBC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    MAI: '0xbf1aeA8670D2528E08334083616dD9C5F3B087aE',
    AERODOLAMAILP: '0x8b432C54d6e8E1B8D1802753514AB53044Af1861',
    AERODOLAUSDBCLP: '0x0B25c51637c43decd6CC1C1e3da4518D54ddb528',
    VEAERO: '0xeBf418Fe2512e7E6bd9b87a8F0f294aCDC67e6B4',
    AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    USDPLUS: '0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376',
    AERODOLAUSDPLUS: '0x8E9154AC849e839d60299E85156bcb589De2693A',    
    AERODOLAUSDCLP: '0xf213F2D02837012dC0236cC105061e121bB03e37',
    // native usdc
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    PAL: '0x224114c444e3C3d936532fE08351648700570909',
    RGUSD: '0x8E5E9DF4F0EA39aE5270e79bbABFCc34203A3470',
    AERODOLARGUSD: '0xBA15D0494fE4f0cAECD7730F6D77BeB6DD0feca9',
    EUSD: '0xCfA3Ef56d303AE4fAabA0592388F19d7C3399FB4',
    AERODOLAEUSD: '0x867dFdb75786c58f6fDf64d955EA2524A147a98C',
  },
  // blast
  "81457": {
    DOLA: "0x8e38179D361402f6a94767757e807146609E9B3d",
    USDB: "0x4300000000000000000000000000000000000003",
    // DOLAUSDBFENIX: "",
  },
  // mode
  "34443": {
    DOLA: "0x00eA4344e90c741560f08667961A8dE39FF506D7",
    USDC: "0xd988097fb8612cc24eeC14542bC03424c656005f",
    VELODOLAUSDCLP: "0x90a0b21936785164103eb9AC7d76792EB5F6c49C",    
  },
}
chainTokenAddresses["31337"] = chainTokenAddresses["1"];

const ETH = {
  address: '',
  name: 'Ether',
  symbol: 'ETH',
  coingeckoId: 'ethereum',
  image: TOKEN_IMAGES.ETH,
  decimals: 18,
}

const DOLA = {
  name: 'Dola',
  symbol: 'DOLA',
  coingeckoId: 'dola-usd',
  image: TOKEN_IMAGES.DOLA,
  decimals: 18,
}

const USDC = {
  name: 'USD Coin',
  symbol: 'USDC',
  coingeckoId: 'usd-coin',
  image: TOKEN_IMAGES.USDC,
  decimals: 6,
}

const FRAX = {
  name: 'FRAX',
  symbol: 'FRAX',
  coingeckoId: 'frax',
  image: TOKEN_IMAGES.FRAX,      
  decimals: 18,
}

const MAI = {
  name: 'MIMATIC',
  symbol: 'MAI',
  image: TOKEN_IMAGES['MAI'],
  decimals: 18,
  coingeckoId: 'mimatic',
}

const chainTokens = {
  "1": {
    // Chain's coin
    CHAIN_COIN: {
      ...ETH,
    },
    // Tokens
    [chainTokenAddresses["1"].SDOLA]: {
      ...DOLA,
      image: TOKEN_IMAGES.SDOLA,
      address: chainTokenAddresses["1"].SDOLA,
      symbol: 'sDOLA',
      name: 'sDOLA',
    },
    [chainTokenAddresses["1"].PYUSD]: {
      decimals: 6,
      image: TOKEN_IMAGES.PYUSD,
      address: chainTokenAddresses["1"].PYUSD,
      symbol: 'PYUSD',
      name: 'PayPal USD',
    },
    [chainTokenAddresses["1"].DAI]: {
      address: chainTokenAddresses["1"].DAI,
      name: 'Dai',
      symbol: 'DAI',
      coingeckoId: 'dai',
      image: TOKEN_IMAGES.DAI,
      decimals: 18,
    },
    [chainTokenAddresses["1"].USDT]: {
      address: chainTokenAddresses["1"].USDT,
      name: 'Tether',
      symbol: 'USDT',
      coingeckoId: 'tether',
      image: TOKEN_IMAGES.USDT,
      decimals: 6,
    },
    [chainTokenAddresses["1"].USDC]: {
      ...USDC,
      address: chainTokenAddresses["1"].USDC,
    },
    [chainTokenAddresses["1"].WETH]: {
      address: chainTokenAddresses["1"].WETH,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      coingeckoId: 'weth',
      image: TOKEN_IMAGES.WETH,
      decimals: 18,
      isWrappedChainCoin: true,
    },
    [chainTokenAddresses["1"].YFI]: {
      address: chainTokenAddresses["1"].YFI,
      name: 'Yearn',
      symbol: 'YFI',
      coingeckoId: 'yearn-finance',
      image: TOKEN_IMAGES.YFI,
      decimals: 18,
    },
    [chainTokenAddresses["1"].XSUSHI]: {
      address: chainTokenAddresses["1"].XSUSHI,
      name: 'xSUSHI',
      symbol: 'xSUSHI',
      coingeckoId: 'xsushi',
      image: TOKEN_IMAGES.xSUSHI,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.SUSHI,
    },
    [chainTokenAddresses["1"].WBTC]: {
      address: chainTokenAddresses["1"].WBTC,
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      coingeckoId: 'wrapped-bitcoin',
      image: TOKEN_IMAGES.WBTC,
      decimals: 8,
    },
    [chainTokenAddresses["1"].STETH]: {
      address: chainTokenAddresses["1"].STETH,
      name: 'Lido Staked Ether',
      symbol: 'stETH',
      coingeckoId: 'staked-ether',
      image: TOKEN_IMAGES.stETH,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.LIDO,
    },
    [chainTokenAddresses["1"].FXUSD]: {
      address: chainTokenAddresses["1"].FXUSD,
      name: 'fxUSD',
      symbol: 'fxUSD',
      coingeckoId: 'f-x-protocol-fxusd',
      image: TOKEN_IMAGES.FXUSD,
      decimals: 18,      
    },
    [chainTokenAddresses["1"].WSTETH]: {
      address: chainTokenAddresses["1"].WSTETH,
      name: 'Lido Wrapped Staked Ether',
      symbol: 'wstETH',
      coingeckoId: 'wrapped-steth',
      image: TOKEN_IMAGES.wstETH,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.LIDO,
    },
    [chainTokenAddresses["1"].GOHM]: {
      address: chainTokenAddresses["1"].GOHM,
      name: 'Governance OHM',
      symbol: 'gOHM',
      coingeckoId: 'governance-ohm',
      image: TOKEN_IMAGES.gOHM,
      decimals: 18,      
    },
    [chainTokenAddresses["1"].INVDOLASLP]: {
      address: chainTokenAddresses["1"].INVDOLASLP,
      name: 'INV-DOLA SLP',
      symbol: 'INV-DOLA-SLP',
      image: TOKEN_IMAGES.INV,
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.SUSHI,
    },
    [chainTokenAddresses["1"].INVETHCLP]: {
      address: chainTokenAddresses["1"].INVETHCLP,
      poolAddress: '0x2AF0a09b3421240f32953FffB13D2D2B8d24fbaE',
      name: 'INV-ETH LP',
      symbol: 'INV-ETH-LP',
      image: TOKEN_IMAGES.INV,
      decimals: 18,
      isLP: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].WETH, chainTokenAddresses["1"].INV
      ],
      protocolImage: PROTOCOL_IMAGES.CRV,
    },
    [chainTokenAddresses["1"].DOLADBRCLP]: {
      address: chainTokenAddresses["1"].DOLADBRCLP,
      poolAddress: '0x056ef502C1Fc5335172bc95EC4cAE16C2eB9b5b6',
      name: 'DOLA-DBR clp',
      symbol: 'DOLA-DBR clp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].DBR, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.CRV,
      link: 'https://curve.fi/#/ethereum/pools/factory-crypto-233/deposit',
    },
    [chainTokenAddresses["1"].INVDOLAAURA]: {
      address: chainTokenAddresses["1"].INVDOLAAURA,
      name: 'INV-DOLA AURA',
      symbol: 'INV-DOLA-AURA',
      image: TOKEN_IMAGES.INV,
      decimals: 18,
      isLP: true,
      balancerInfos: {
        poolId: '0x441b8a1980f2f2e43a9397099d15cc2fe6d3625000020000000000000000035f',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.AURA,
    },
    [chainTokenAddresses["1"].INVDOLABLP]: {
      address: chainTokenAddresses["1"].INVDOLABLP,
      name: 'INV-DOLA blp',
      symbol: 'INV-DOLA blp',
      image: TOKEN_IMAGES.INV,
      decimals: 18,
      isLP: true,
      balancerInfos: {
        poolId: '0x441b8a1980f2f2e43a9397099d15cc2fe6d3625000020000000000000000035f',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.BAL,
      deduce: [chainTokenAddresses["1"].INVDOLAAURA],
    },
    // deprecated
    // [chainTokenAddresses["1"].INVDOLAULP]: {
    //   address: chainTokenAddresses["1"].INVDOLAULP,
    //   name: 'INV-DOLA LP',
    //   symbol: 'INV-DOLA-LP',
    //   image: TOKEN_IMAGES.INV,
    //   decimals: 18,
    //   isLP: true,
    //   pairs: [
    //     chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
    //   ],
    //   protocolImage: PROTOCOL_IMAGES.UNI,
    // },
    [chainTokenAddresses["1"].DOLAUSDCUNIV3]: {
      address: chainTokenAddresses["1"].DOLAUSDCUNIV3,
      name: 'DOLA-USDC LP',
      symbol: 'DOLA-USDC-LP',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.UNIV3,
    },
    [chainTokenAddresses["1"].DOLADBRUNIV3]: {
      address: chainTokenAddresses["1"].DOLADBRUNIV3,
      name: 'DOLA-DBR LP',
      symbol: 'DOLA-DBR-LP',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].DBR
      ],
      protocolImage: PROTOCOL_IMAGES.UNIV3,
    },
    [chainTokenAddresses["1"].DOLAINVUNIV3]: {
      address: chainTokenAddresses["1"].DOLAINVUNIV3,
      name: 'DOLA-INV LP',
      symbol: 'DOLA-INV uv3lp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.UNIV3,
    },
    [chainTokenAddresses["1"].RGUSD]: {
      address: chainTokenAddresses["1"].RGUSD,
      name: 'RGUSD',
      symbol: 'RGUSD',
      coingeckoId: 'revenue-generating-usd',
      image: TOKEN_IMAGES.RGUSD,
      decimals: 18,   
    },
    [chainTokenAddresses["1"].DOLARGUSDCRVLP]: {
      address: chainTokenAddresses["1"].DOLARGUSDCRVLP,
      name: 'DOLA-RGUSD',
      symbol: 'DOLA-RGUSD clp', 
      protocolImage: PROTOCOL_IMAGES.CRV,
      decimals: 18,
      isLP: true,
      isStable: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].RGUSD, chainTokenAddresses["1"].DOLA
      ],
      image: TOKEN_IMAGES.DOLA,
      link: 'https://curve.fi/#/ethereum/pools/factory-stable-ng-126/deposit',
    },
    [chainTokenAddresses["1"].INVDOLALIQUIS]: {
      address: chainTokenAddresses["1"].INVDOLALIQUIS,
      name: 'DOLA-INV LP',
      symbol: 'DOLA-INV liqlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isUniV3: true,
      uniV3Pool: chainTokenAddresses["1"].DOLAINVUNIV3,      
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.LIQUIS,
    },
    [chainTokenAddresses["1"].INVETHSLP]: {
      address: chainTokenAddresses["1"].INVETHSLP,
      name: 'INV-ETH SLP',
      symbol: 'INV-ETH-SLP',
      image: TOKEN_IMAGES.INV,
      protocolImage: PROTOCOL_IMAGES.SUSHI,
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].WETH
      ],
    },
    [chainTokenAddresses["1"].INVETHLP]: {
      address: chainTokenAddresses["1"].INVETHLP,
      name: 'INV-WETH LP',
      symbol: 'INV-WETH-LP',
      image: TOKEN_IMAGES.INV,
      protocolImage: PROTOCOL_IMAGES.UNI,
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].WETH
      ],
    },
    [chainTokenAddresses["1"].DOLAWETHULP]: {
      address: chainTokenAddresses["1"].DOLAWETHULP,
      name: 'DOLA-WETH LP',
      symbol: 'DOLA-WETH-LP',
      image: TOKEN_IMAGES.DOLA,
      protocolImage: PROTOCOL_IMAGES.UNI,
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].WETH
      ],
    },
    // deprecated
    // [chainTokenAddresses["1"].DOLAWETHLP]: {
    //   address: chainTokenAddresses["1"].DOLAWETHLP,
    //   name: 'DOLA-WETH',
    //   symbol: 'DOLA-WETH',
    //   image: TOKEN_IMAGES.DOLA,
    //   decimals: 18,
    //   isLP: true,
    //   balancerInfos: {
    //     poolId: '0xb204bf10bc3a5435017d3db247f56da601dfe08a000200000000000000000230',
    //     vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
    //   },
    //   pairs: [
    //     chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].WETH
    //   ],
    //   protocolImage: PROTOCOL_IMAGES.BAL,
    // },
    [chainTokenAddresses["1"].DOLA3POOLCRV]: {
      address: chainTokenAddresses["1"].DOLA3POOLCRV,
      name: 'Dola-3pool CRV LP',
      symbol: 'DOLA-3POOL',
      coingeckoId: 'dai',
      protocolImage: PROTOCOL_IMAGES.CRV,
      decimals: 18,
      isLP: true,
      isStable: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].THREECRV
      ],      
      image: TOKEN_IMAGES.DOLA,
      link: 'https://curve.fi/#/ethereum/pools/factory-v2-27/deposit',
    },
    [chainTokenAddresses["1"].DOLAFRAXUSDC]: {
      address: chainTokenAddresses["1"].DOLAFRAXUSDC,
      name: 'DOLA-FRAX-USDC',
      symbol: 'DOLA-FRAX-USDC',      
      protocolImage: PROTOCOL_IMAGES.CRV,
      decimals: 18,
      isLP: true,
      isStable: true,
      isCrvLP: true,
      isNestedCrvLp: true,
      nestedLpAddress: '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FRAXUSDC
      ],
      image: TOKEN_IMAGES.DOLA,
      link: 'https://curve.fi/#/ethereum/pools/factory-v2-176/deposit',
      deduce: [chainTokenAddresses["1"].DOLAFRAXUSDCCVX],
    },
    [chainTokenAddresses["1"].DOLAFRAXUSDCCVX]: {
      address: chainTokenAddresses["1"].DOLAFRAXUSDCCVX,
      name: 'DOLA-FRAX-USDC',
      symbol: 'DOLA-FRAX-USDC cvxlp',
      protocolImage: PROTOCOL_IMAGES.CVX,
      decimals: 18,
      isLP: true,
      isStable: true,
      pairs: [
        '0x865377367054516e17014CcdED1e7d814EDC9ce4', chainTokenAddresses["1"].FRAXUSDC
      ],
      image: TOKEN_IMAGES.DOLA,
      link: 'https://www.convexfinance.com/stake/ethereum/115',
    },
    [chainTokenAddresses["1"].DOLAFRAXPYUSD]: {
      address: chainTokenAddresses["1"].DOLAFRAXPYUSD,
      name: 'DOLA-FRAX-PYUSD',
      symbol: 'DOLA-FRAX-PYUSD',      
      protocolImage: PROTOCOL_IMAGES.CRV,
      decimals: 18,
      isLP: true,
      isStable: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FRAXPYUSD
      ],
      image: TOKEN_IMAGES.DOLA,
      link: 'https://curve.fi/#/ethereum/pools/factory-stable-ng-96/deposit',
      deduce: [chainTokenAddresses["1"].DOLAFRAXPYUSDCVX],
    },    
    [chainTokenAddresses["1"].DOLAFRAXPYUSDCVX]: {
      address: chainTokenAddresses["1"].DOLAFRAXPYUSDCVX,
      isCrvLP: true,
      poolAddress: chainTokenAddresses["1"].DOLAFRAXPYUSD,
      name: 'DOLA-FRAX-PYUSD',
      symbol: 'DOLA-FRAX-PYUSD cvxlp', 
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FRAXPYUSD
      ],
      convexInfos:{
        fromPrice: chainTokenAddresses["1"].DOLAFRAXPYUSD,
      },
      protocolImage: PROTOCOL_IMAGES.CVX,      
    },
    // [chainTokenAddresses["1"].DOLACUSDALP]: {
    //   address: chainTokenAddresses["1"].DOLACUSDALP,
    //   name: 'DOLA-FRAX-USDC',
    //   symbol: 'DOLA-FRAX-USDC cvxlp',
    //   image: TOKEN_IMAGES.DOLA,
    //   decimals: 18,
    //   isLP: true,
    //   isStable: true,
    //   balancerInfos: {
    //     poolId: '0x384f67aa430376efc4f8987eabf7f3f84eb9ea5d00020000000000000000043d',
    //     vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    //   },
    //   pairs: [
    //     chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FRAXUSDC
    //   ],
    //   protocolImage: PROTOCOL_IMAGES.AURA,
    // },
    [chainTokenAddresses["1"].DOLAUSDCBALANCER]: {
      address: chainTokenAddresses["1"].DOLAUSDCBALANCER,
      name: 'DOLA-USDC blp',
      symbol: 'DOLA-USDC blp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },     
      pairs: [
        '0x865377367054516e17014CcdED1e7d814EDC9ce4', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      ],
      image: TOKEN_IMAGES.DOLA,
      deduce: [chainTokenAddresses["1"].DOLAUSDCALP2],
    },
    [chainTokenAddresses["1"].SDOLADOLABALANCER]: {
      address: chainTokenAddresses["1"].SDOLADOLABALANCER,
      name: 'DOLA-SDOLA blp',
      symbol: 'DOLA-SDOLA blp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x264062ca46a1322c2e6464471764089e01f22f1900000000000000000000066b',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },     
      isComposableMetapool: true,
      pairs: [
        chainTokenAddresses["1"].SDOLADOLABALANCER, chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].SDOLA
      ],
      image: TOKEN_IMAGES.DOLA,      
      deduce: [chainTokenAddresses["1"].SDOLADOLAAUR],
    },
    [chainTokenAddresses["1"].SDOLADOLAAUR]: {
      address: chainTokenAddresses["1"].SDOLADOLAAUR,
      name: 'DOLA-SDOLA alp',
      symbol: 'DOLA-SDOLA alp',
      protocolImage: PROTOCOL_IMAGES.AURA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x264062ca46a1322c2e6464471764089e01f22f1900000000000000000000066b',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },     
      isComposableMetapool: true,
      pairs: [
        chainTokenAddresses["1"].SDOLADOLABALANCER, chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].SDOLA
      ],
      image: TOKEN_IMAGES.DOLA,      
    },
    [chainTokenAddresses["1"].SDOLAPYUSDBALANCER]: {
      address: chainTokenAddresses["1"].SDOLAPYUSDBALANCER,
      name: 'SDOLA-PYUSD blp',
      symbol: 'SDOLA-PYUSD blp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x09b03b7cbb19b3dae94f884cf60dbc3c99a3947b00000000000000000000066c',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },     
      isComposableMetapool: true,
      pairs: [
        chainTokenAddresses["1"].SDOLAPYUSDBALANCER, chainTokenAddresses["1"].PYUSD, chainTokenAddresses["1"].SDOLA
      ],
      image: TOKEN_IMAGES.DOLA,      
    },
    [chainTokenAddresses["1"].DBRDOLABALANCER]: {
      address: chainTokenAddresses["1"].DBRDOLABALANCER,
      name: 'DOLA-DBR blp',
      symbol: 'DOLA-DBR blp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      balancerInfos: {
        poolId: '0x445494f823f3483ee62d854ebc9f58d5b9972a25000200000000000000000415',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },     
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].DBR
      ],
      image: TOKEN_IMAGES.DOLA
    },
    [chainTokenAddresses["1"].DOLAMKUSDBALANCER]: {
      address: chainTokenAddresses["1"].DOLAMKUSDBALANCER,
      name: 'DOLA-MKUSD blp',
      symbol: 'DOLA-MKUSD blp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x383e7859271b2d0589b013b6d944572a0a8be3cb000000000000000000000657',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      isComposableMetapool: true,
      pairs: [
        chainTokenAddresses["1"].DOLAMKUSDBALANCER, chainTokenAddresses["1"].MKUSD, chainTokenAddresses["1"].DOLA,
      ],
      image: TOKEN_IMAGES.DOLA
    },
    // [chainTokenAddresses["1"].DOLABBEUSD]: {
    //   address: chainTokenAddresses["1"].DOLABBEUSD,
    //   name: 'DOLA-BB-E-USD blp',
    //   symbol: 'DOLA-bb-e-usd blp',
    //   protocolImage: PROTOCOL_IMAGES.BAL,
    //   decimals: 18,
    //   isLP: true,
    //   isStable: true,
    //   balancerInfos: {
    //     poolId: '0x133d241f225750d2c92948e464a5a80111920331000000000000000000000476',
    //     vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    //   },     
    //   pairs: [
    //     '0x133d241F225750D2c92948E464A5a80111920331', '0x50Cf90B954958480b8DF7958A9E965752F627124', '0x865377367054516e17014CcdED1e7d814EDC9ce4'
    //   ],
    //   isComposableMetapool: true,
    //   image: TOKEN_IMAGES.DOLA,
    //   deduce: [chainTokenAddresses["1"].DOLABBEUSDALP],
    // },
    // [chainTokenAddresses["1"].DOLABBEUSDALP]: {
    //   address: chainTokenAddresses["1"].DOLABBEUSDALP,
    //   name: 'DOLA-BB-E-USD alp',
    //   symbol: 'DOLA-bb-e-usd alp',
    //   protocolImage: PROTOCOL_IMAGES.AURA,
    //   decimals: 18,
    //   isLP: true,
    //   isStable: true,
    //   balancerInfos: {
    //     poolId: '0x133d241f225750d2c92948e464a5a80111920331000000000000000000000476',
    //     vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    //   },     
    //   pairs: [
    //     '0x133d241F225750D2c92948E464A5a80111920331', '0x50Cf90B954958480b8DF7958A9E965752F627124', '0x865377367054516e17014CcdED1e7d814EDC9ce4'
    //   ],
    //   isComposableMetapool: true,
    //   image: TOKEN_IMAGES.DOLA
    // },
    // [chainTokenAddresses["1"].BBEUSD]: {
    //   address: chainTokenAddresses["1"].BBEUSD,
    //   name: 'BB-EULER-USD',
    //   symbol: 'BB-EULER-USD',   
    //   image: TOKEN_IMAGES['BB-EULER-USD'],
    //   protocolImage: PROTOCOL_IMAGES.EULER,
    //   decimals: 18,
    // },
    [chainTokenAddresses["1"].MKUSD]: {
      address: chainTokenAddresses["1"].MKUSD,
      name: 'MKUSD',
      symbol: 'MKUSD',
      coingeckoId: 'prisma-mkusd',
      image: TOKEN_IMAGES.MKUSD,
      decimals: 18,
    },
    [chainTokenAddresses["1"].THREECRV]: {
      address: chainTokenAddresses["1"].THREECRV,
      name: 'lp-3pool-curve',
      symbol: '3CRV',
      coingeckoId: 'lp-3pool-curve',
      image: TOKEN_IMAGES.THREECRV,
      decimals: 18,
    },
    [chainTokenAddresses["1"].FRAXUSDC]: {
      address: chainTokenAddresses["1"].FRAXUSDC,
      name: 'crvFRAX',
      symbol: 'crvFRAX',
      coingeckoId: 'curve-fi-frax-usdc',
      image: TOKEN_IMAGES.FRAX,
      protocolImage: TOKEN_IMAGES.USDC,
      decimals: 18,
    },
    [chainTokenAddresses["1"].FRAXPYUSD]: {
      address: chainTokenAddresses["1"].FRAXPYUSD,
      name: 'FRAXPYUSD',
      symbol: 'FRAXPYUSD',
      coingeckoId: 'paypal-usd',
      image: TOKEN_IMAGES.FRAX,
      protocolImage: TOKEN_IMAGES.PYUSD,
      decimals: 18,
    },
    [chainTokenAddresses["1"].FRAX]: {
      address: chainTokenAddresses["1"].FRAX,
      ...FRAX,
    },
    [chainTokenAddresses["1"].FLOKI]: {
      address: chainTokenAddresses["1"].FLOKI,
      name: 'Floki',
      symbol: 'FLOKI',
      coingeckoId: 'floki-inu',
      image: TOKEN_IMAGES.FLOKI,
      decimals: 9,
      isInPausedSection: true,
      badge: deprecatedBadge,
    },
    [chainTokenAddresses["1"].WFTM]: {
      address: chainTokenAddresses["1"].WFTM,
      name: 'Fantom',
      symbol: 'WFTM',
      coingeckoId: 'fantom',
      image: TOKEN_IMAGES.WFTM,
      decimals: 18,
    },
    [chainTokenAddresses["1"].MIM]: {
      address: chainTokenAddresses["1"].MIM,
      name: 'MIM',
      symbol: 'MIM',
      coingeckoId: 'magic-internet-money',
      image: TOKEN_IMAGES.MIM,
      decimals: 18,
    },
    [chainTokenAddresses["1"].YVCRVCVXETH]: {
      address: chainTokenAddresses["1"].YVCRVCVXETH,
      name: 'YV-CrvCvxEth',
      symbol: 'yvcrvCVXETH',
      image: TOKEN_IMAGES.THREECRV,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.YFI,
    },
    [chainTokenAddresses["1"].YVCRVIB]: {
      address: chainTokenAddresses["1"].YVCRVIB,
      name: 'YV-CrvIB',
      symbol: 'yvcrvIB',
      image: TOKEN_IMAGES.yvcrvIB,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.YFI,
    },
    [chainTokenAddresses["1"].YVCRV3CRYPTO]: {
      address: chainTokenAddresses["1"].YVCRV3CRYPTO,
      name: 'YV-Crv3crypto',
      symbol: 'yvcrv3Crypto',
      image: TOKEN_IMAGES.yvcrv3Crypto,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.YFI,
    },
    [chainTokenAddresses["1"].YVCRVSTEHWETH]: {
      address: chainTokenAddresses["1"].YVCRVSTEHWETH,
      name: 'yvcrvstETH-WETH',
      symbol: 'yvcrvstETH-WETH',
      image: TOKEN_IMAGES.stETH,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.YFI,
    },
    [chainTokenAddresses["1"].CVX]: {
      address: chainTokenAddresses["1"].CVX,
      name: 'CVX',
      symbol: 'CVX',
      image: TOKEN_IMAGES.CVX,
      decimals: 18,
      coingeckoId: 'convex-finance',
    },
    [chainTokenAddresses["1"].CVXCRV]: {
      address: chainTokenAddresses["1"].CVXCRV,
      name: 'cvxCRV',
      symbol: 'cvxCRV',
      image: TOKEN_IMAGES.cvxCRV,
      decimals: 18,
      coingeckoId: 'convex-crv',
      protocolImage: PROTOCOL_IMAGES.CVX,
    },
    [chainTokenAddresses["1"].CVXFXS]: {
      address: chainTokenAddresses["1"].CVXFXS,
      name: 'cvxFXS',
      symbol: 'cvxFXS',
      image: TOKEN_IMAGES.cvxFXS,
      decimals: 18,
      coingeckoId: 'convex-fxs',
      protocolImage: PROTOCOL_IMAGES.CVX,
    },
    [chainTokenAddresses["1"].FXS]: {
      address: chainTokenAddresses["1"].FXS,
      name: 'FXS',
      symbol: 'FXS',
      image: TOKEN_IMAGES.FXS,
      decimals: 18,
      coingeckoId: 'frax-share',
    },
    [chainTokenAddresses["1"].CRV]: {
      address: chainTokenAddresses["1"].CRV,
      name: 'CRV',
      symbol: 'CRV',
      image: TOKEN_IMAGES.CRV,
      decimals: 18,
      coingeckoId: 'curve-dao-token',
    },
    [chainTokenAddresses["1"].SDCRV]: {
      address: chainTokenAddresses["1"].SDCRV,
      name: 'sdCRV',
      symbol: 'sdCRV',
      image: TOKEN_IMAGES.sdCRV,
      decimals: 18,
      coingeckoId: 'stake-dao-crv',
    },
    [chainTokenAddresses["1"].SDCRVGAUGE]: {
      address: chainTokenAddresses["1"].SDCRVGAUGE,
      name: 'sdCRV-g',
      symbol: 'sdCRV-g',
      image: TOKEN_IMAGES['sdCRV-g'],
      decimals: 18,
      coingeckoId: 'stake-dao-crv',
    },
    [chainTokenAddresses["1"].VLCVX]: {
      address: chainTokenAddresses["1"].VLCVX,
      name: 'vlCVX',
      symbol: 'vlCVX',
      image: TOKEN_IMAGES.CVX,
      decimals: 18,
      coingeckoId: 'convex-finance',
    },
    [chainTokenAddresses["1"].DBR]: {
      address: chainTokenAddresses["1"].DBR,
      name: 'DBR',
      symbol: 'DBR',
      image: TOKEN_IMAGES.DBR,
      decimals: 18,
      coingeckoId: 'dola-borrowing-right',
    },
    [chainTokenAddresses["1"].VLAURA]: {
      address: chainTokenAddresses["1"].VLAURA,
      name: 'vlAURA',
      symbol: 'vlAURA',
      image: TOKEN_IMAGES.vlAURA,
      decimals: 18,
      coingeckoId: 'aura-finance',
    },
    [chainTokenAddresses["1"].LOCKEDDOLAFRAXBP]: {
      address: chainTokenAddresses["1"].LOCKEDDOLAFRAXBP,
      name: 'vlDOLA-FRAXBP',
      symbol: 'vlDOLA-FRAXBP',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      protocolImage: PROTOCOL_IMAGES.CVX,
      convexInfos: {
        account: '0x5170793C4D96f9ca058E2A581BADdA9413EF4b0d',
        fromPrice: '0xE57180685E3348589E9521aa53Af0BCD497E884d',    
      },      
    },
    [chainTokenAddresses["1"].AURA]: {
      address: chainTokenAddresses["1"].AURA,
      name: 'AURA',
      symbol: 'AURA',
      coingeckoId: 'aura-finance',
      image: TOKEN_IMAGES.AURA,
      decimals: 18,
    },
    [chainTokenAddresses["1"].BAL]: {
      address: chainTokenAddresses["1"].BAL,
      name: 'BAL',
      symbol: 'BAL',
      coingeckoId: 'balancer',
      image: TOKEN_IMAGES.BAL,     
      decimals: 18,
    },
    [chainTokenAddresses["1"].CUSD]: {
      address: chainTokenAddresses["1"].CUSD,
      name: 'CUSD',
      symbol: 'CUSD',
      coingeckoId: 'coin98-dollar',
      image: TOKEN_IMAGES.CUSD,
      decimals: 18,
    },
    [chainTokenAddresses["1"].DOLACUSDBLP]: {
      address: chainTokenAddresses["1"].DOLACUSDBLP,
      name: 'DOLA-CUSD blp',
      symbol: 'DOLA-CUSD blp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x384f67aa430376efc4f8987eabf7f3f84eb9ea5d00020000000000000000043d',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].CUSD
      ],
      protocolImage: PROTOCOL_IMAGES.BAL,
      deduce: [chainTokenAddresses["1"].DOLACUSDALP],
    },
    [chainTokenAddresses["1"].DOLACUSDALP]: {
      address: chainTokenAddresses["1"].DOLACUSDALP,
      name: 'DOLA-CUSD alp',
      symbol: 'DOLA-CUSD alp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x384f67aa430376efc4f8987eabf7f3f84eb9ea5d00020000000000000000043d',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].CUSD
      ],
      protocolImage: PROTOCOL_IMAGES.AURA,
    },
    // [chainTokenAddresses["1"].DOLAUSDCALP]: {
    //   address: chainTokenAddresses["1"].DOLAUSDCALP,
    //   name: 'DOLA-USDC alp',
    //   symbol: 'DOLA-USDC alp',
    //   image: TOKEN_IMAGES.DOLA,
    //   decimals: 18,
    //   isLP: true,
    //   isStable: true,
    //   balancerInfos: {
    //     poolId: '0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426',
    //     vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    //   },
    //   pairs: [
    //     chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].USDC
    //   ],
    //   protocolImage: PROTOCOL_IMAGES.AURA,
    // },
    [chainTokenAddresses["1"].DOLAUSDCALP2]: {
      address: chainTokenAddresses["1"].DOLAUSDCALP2,
      name: 'DOLA-USDC aulp',
      symbol: 'DOLA-USDC aulp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.AURA,
    },
    [chainTokenAddresses["1"].DOLACRVUSDLP]: {
      address: chainTokenAddresses["1"].DOLACRVUSDLP,
      name: 'DOLA-crvUSD',
      symbol: 'DOLA-crvUSD clp', 
      protocolImage: PROTOCOL_IMAGES.CRV,
      decimals: 18,
      isLP: true,
      isStable: true,
      isCrvLP: true,
      pairs: [
        '0x865377367054516e17014CcdED1e7d814EDC9ce4', '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
      ],
      image: TOKEN_IMAGES.DOLA,
      link: 'https://curve.fi/#/ethereum/pools/factory-crvusd-12/deposit',
    },
    [chainTokenAddresses["1"].CRVUSD]: {
      address: chainTokenAddresses["1"].CRVUSD,
      name: 'crvUSD',
      symbol: 'crvUSD',
      coingeckoId: 'crvusd',
      image: TOKEN_IMAGES.CRVUSD,
      decimals: 18,
    },
    [chainTokenAddresses["1"].STYCRV]: {
      address: chainTokenAddresses["1"].STYCRV,
      name: 'st-yCRV',
      symbol: 'st-yCRV',
      coingeckoId: 'staked-yearn-crv-vault',
      image: TOKEN_IMAGES.STYCRV,
      decimals: 18,
    },
    [chainTokenAddresses["1"].STCVX]: {
      address: chainTokenAddresses["1"].STCVX,
      name: 'st-CVX',
      symbol: 'st-CVX',
      coingeckoId: 'convex-finance',
      image: TOKEN_IMAGES.CVX,
      decimals: 18,
    },
    [chainTokenAddresses["1"].STYETH]: {
      address: chainTokenAddresses["1"].STYETH,
      name: 'st-yETH',
      symbol: 'st-yETH',
      coingeckoId: 'staked-yearn-ether',
      image: TOKEN_IMAGES.stYETH,
      decimals: 18,
    },
    [chainTokenAddresses["1"].SFRAX]: {
      address: chainTokenAddresses["1"].SFRAX,
      name: 'sFRAX',
      symbol: 'sFRAX',
      coingeckoId: 'staked-frax',
      image: TOKEN_IMAGES.sFRAX,
      decimals: 18,
    },
    // [chainTokenAddresses["1"].PAL]: {
    //   address: chainTokenAddresses["1"].PAL,
    //   name: 'PAL',
    //   symbol: 'PAL',
    //   coingeckoId: 'paladin',
    //   image: TOKEN_IMAGES.PAL,
    //   decimals: 18,
    // },
    [chainTokenAddresses["1"].YCRV]: {
      address: chainTokenAddresses["1"].YCRV,
      name: 'yCRV',
      symbol: 'yCRV',
      coingeckoId: 'yearn-crv',
      image: TOKEN_IMAGES.YCRV,
      decimals: 18,
    },
    [chainTokenAddresses["1"].DOLAFXUSDLP]: {
      address: chainTokenAddresses["1"].DOLAFXUSDLP,      
      name: 'DOLA-FXUSD',
      symbol: 'DOLA-FXUSD clp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isCrvLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FXUSD
      ],
      protocolImage: PROTOCOL_IMAGES.CRV,
      deduce: [chainTokenAddresses["1"].DOLAFXUSDLPCVX],  
    },
    [chainTokenAddresses["1"].DOLAFXUSDLPCVX]: {
      address: chainTokenAddresses["1"].DOLAFXUSDLPCVX,      
      name: 'DOLA-FXUSD',
      symbol: 'DOLA-FXUSD cvxlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true, 
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].FXUSD
      ],
      convexInfos:{
        fromPrice: chainTokenAddresses["1"].DOLAFXUSDLP,
        // priceField: 'lp_price',
      },
      protocolImage: PROTOCOL_IMAGES.CVX,   
    },
    [chainTokenAddresses["1"].INVTRICRYPTO]: {
      address: chainTokenAddresses["1"].INVTRICRYPTO,      
      name: 'TricryptoINV',
      symbol: 'TricryptoINV clp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].USDC, chainTokenAddresses["1"].WETH, chainTokenAddresses["1"].INV
      ],
      protocolImage: PROTOCOL_IMAGES.CRV,
      link: 'https://curve.fi/#/ethereum/pools/factory-tricrypto-3/deposit',
      deduce: [chainTokenAddresses["1"].INVTRICRYPTOCVX, chainTokenAddresses["1"].INVTRICRYPTOYEARNV2],
    },
    [chainTokenAddresses["1"].INVTRICRYPTOYEARNV2]: {
      address: chainTokenAddresses["1"].INVTRICRYPTOYEARNV2,    
      rootCrvPool: chainTokenAddresses["1"].INVTRICRYPTO,  
      name: 'yvTricryptoINV',
      symbol: 'TricryptoINV yclp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isYearnV2LP: true,
      pairs: [
        chainTokenAddresses["1"].USDC, chainTokenAddresses["1"].WETH, chainTokenAddresses["1"].INV
      ],
      protocolImage: PROTOCOL_IMAGES.YEARN,
    },    
    [chainTokenAddresses["1"].INVTRICRYPTOCVX]: {
      address: chainTokenAddresses["1"].INVTRICRYPTOCVX,      
      name: 'TricryptoINV',
      symbol: 'TricryptoINV cvxlp',
      image: TOKEN_IMAGES.INV,
      decimals: 18,
      isLP: true,    
      pairs: [
        chainTokenAddresses["1"].USDC, chainTokenAddresses["1"].WETH, chainTokenAddresses["1"].INV
      ],
      convexInfos:{
        fromPrice: chainTokenAddresses["1"].INVTRICRYPTO,
        priceField: 'lp_price',
      },
      protocolImage: PROTOCOL_IMAGES.CVX,      
    },
    [chainTokenAddresses["1"].DBRTRICRYPTO]: {
      address: chainTokenAddresses["1"].DBRTRICRYPTO,      
      name: 'INV-DBR-DOLA',
      symbol: 'INV-DBR-DOLA clp',
      image: TOKEN_IMAGES.DBR,
      decimals: 18,
      isLP: true,
      isCrvLP: true,
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].DBR, chainTokenAddresses["1"].INV
      ],
      protocolImage: PROTOCOL_IMAGES.CRV,
      link: 'https://curve.fi/#/ethereum/pools/factory-tricrypto-18/deposit',
      deduce: [chainTokenAddresses["1"].DBRTRICRYPTOCVX],  
    },
    [chainTokenAddresses["1"].DBRTRICRYPTOCVX]: {
      address: chainTokenAddresses["1"].DBRTRICRYPTOCVX,      
      name: 'INV-DBR-DOLA',
      symbol: 'INV-DBR-DOLA cvxlp',
      image: TOKEN_IMAGES.DBR,
      decimals: 18,
      isLP: true,
      convexInfos:{
        fromPrice: chainTokenAddresses["1"].DBRTRICRYPTO,
        priceField: 'lp_price',
      },
      pairs: [
        chainTokenAddresses["1"].DOLA, chainTokenAddresses["1"].DBR, chainTokenAddresses["1"].INV
      ],
      protocolImage: PROTOCOL_IMAGES.CVX,      
    },
  },
  "43114": {
    CHAIN_COIN: {
      address: '',
      name: 'Avax',
      symbol: 'AVAX',
      coingeckoId: 'avalanche-2',
      image: TOKEN_IMAGES.AVAX,
      decimals: 18,
    },
    [chainTokenAddresses["43114"].DOLA]: {
      address: chainTokenAddresses["43114"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["43114"].USDC]: {
      address: chainTokenAddresses["43114"].USDC,
      ...USDC,
    },
    [chainTokenAddresses["43114"].SOLISNEK]: {
      address: chainTokenAddresses["43114"].SOLISNEK,
      name: 'SoliSnek',
      symbol: 'SNEK',
      coingeckoId: 'solisnek',
      image: TOKEN_IMAGES.SOLISNEK,
      decimals: 18,
    },
    [chainTokenAddresses["43114"].VESOLISNEK]: {
      address: chainTokenAddresses["43114"].VESOLISNEK,
      name: 'veSNEK',
      symbol: 'veSNEK',
      image: TOKEN_IMAGES.SOLISNEK,
      decimals: 18,
      isLockedVeNft: true,
      coingeckoId: 'solisnek',
      veNftId: '892',
    },
    [chainTokenAddresses["43114"].DOLAUSDCSOLISNEDKLP]: {
      address: chainTokenAddresses["43114"].DOLAUSDCSOLISNEDKLP,
      name: 'DOLA-USDC solisnek lp',
      symbol: 'DOLA-USDC slsnlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["43114"].DOLA, chainTokenAddresses["43114"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.SOLISNEK,
    },
  },
  "250": {
    CHAIN_COIN: {
      address: '',
      name: 'Fantom',
      symbol: 'FTM',
      coingeckoId: 'fantom',
      image: TOKEN_IMAGES.FTM,
      decimals: 18,
    },
    // deprecated
    // [chainTokenAddresses["250"].DOLA2POOLCRV]: {
    //   address: chainTokenAddresses["250"].DOLA2POOLCRV,
    //   name: 'Dola-2Pool CRV LP',
    //   symbol: 'DOLA-2POOL',
    //   coingeckoId: 'dai',
    //   image: TOKEN_IMAGES.CRV,
    //   decimals: 18,
    //   isLP: true,
    //   isCrvLP: true,
    // },
    // deprecated
    // [chainTokenAddresses["250"].SPOOKYLP]: {
    //   address: chainTokenAddresses["250"].SPOOKYLP,
    //   name: 'Spooky LP',
    //   symbol: 'SPOOKY-LP',
    //   coingeckoId: '',
    //   image: 'https://assets.coingecko.com/markets/images/662/small/spookyswap.png?1639279823',
    //   decimals: 18,
    //   isLP: true,
    //   pairs: [
    //     chainTokenAddresses["250"].DOLA, chainTokenAddresses["250"].WFTM
    //   ],
    // },
    [chainTokenAddresses["250"].VELOCIMETERDOLAERNLP]: {
      address: chainTokenAddresses["250"].VELOCIMETERDOLAERNLP,
      name: 'DOLA-ERN',
      symbol: 'DOLA-ERN vclp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["250"].DOLA, chainTokenAddresses["250"].ERN
      ],
      protocolImage: PROTOCOL_IMAGES.VELOCIMETER,
    },
    [chainTokenAddresses["250"].ERN]: {
      address: chainTokenAddresses["250"].ERN,
      name: 'ERN',
      symbol: 'ERN',
      image: TOKEN_IMAGES['ERN'],
      decimals: 18,
      coingeckoId: 'ethos-reserve-note',
    },
  },
  "5": {
    CHAIN_COIN: {
      ...ETH
    },
    [chainTokenAddresses["5"].DOLA]: {
      address: chainTokenAddresses["5"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["5"].WETH]: {
      address: chainTokenAddresses["5"].WETH,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      coingeckoId: 'weth',
      image: TOKEN_IMAGES.WETH,
      decimals: 18,
      isWrappedChainCoin: true,
    },
    [chainTokenAddresses["5"].WBTC]: {
      address: chainTokenAddresses["5"].WBTC,
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      coingeckoId: 'wrapped-bitcoin',
      image: TOKEN_IMAGES.WBTC,
      decimals: 8,
    },
  },
  "10": {
    CHAIN_COIN: {
      ...ETH,
    },
    [chainTokenAddresses["10"].DOLA]: {
      address: chainTokenAddresses["10"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["10"].USDC]: {
      ...USDC,
      address: chainTokenAddresses["10"].USDC,
    },
    [chainTokenAddresses["10"].USDCE]: {
      ...USDC,
      symbol: 'USDCe',
      address: chainTokenAddresses["10"].USDCE,
    },
    [chainTokenAddresses["10"].VELO]: {
      address: chainTokenAddresses["10"].VELO,
      name: 'VELO',
      symbol: 'VELO',
      image: TOKEN_IMAGES.VELO,
      decimals: 18,
      coingeckoId: 'velodrome-finance',
    },
    [chainTokenAddresses["10"].VELOV1]: {
      address: chainTokenAddresses["10"].VELOV1,
      name: 'VELO-v1',
      symbol: 'VELO-v1',
      image: TOKEN_IMAGES.VELO,
      decimals: 18,
      coingeckoId: 'velodrome-finance',
    },
    [chainTokenAddresses["10"].USDplus]: {
      address: chainTokenAddresses["10"].USDplus,
      name: 'USD+',
      symbol: 'USD+',
      image: TOKEN_IMAGES['USD+'],
      decimals: 6,
      coingeckoId: 'usd',
    },
    [chainTokenAddresses["10"].ERN]: {
      address: chainTokenAddresses["10"].ERN,
      name: 'ERN',
      symbol: 'ERN',
      image: TOKEN_IMAGES['ERN'],
      decimals: 18,
      coingeckoId: 'ethos-reserve-note',
    },
    [chainTokenAddresses["10"].MAI]: {
      address: chainTokenAddresses["10"].MAI,
      ...MAI,
    },
    [chainTokenAddresses["10"].FRAX]: {
      address: chainTokenAddresses["10"].FRAX,
      ...FRAX,
    },
    [chainTokenAddresses["10"].ALUSD]: {
      address: chainTokenAddresses["10"].ALUSD,
      name: 'alUSD',
      symbol: 'alUSD',
      image: TOKEN_IMAGES['ALUSD'],
      decimals: 18,
      coingeckoId: 'alchemix-usd',
    },
    [chainTokenAddresses["10"].VEVELO]: {
      address: chainTokenAddresses["10"].VEVELO,
      name: 'veVELO',
      symbol: 'veVELO',
      image: TOKEN_IMAGES.veVELO,
      decimals: 18,
      coingeckoId: 'velodrome-finance',
      veNftId: '4130',
    },
    // [chainTokenAddresses["10"].VEVELOV1]: {
    //   address: chainTokenAddresses["10"].VEVELOV1,
    //   name: 'veVELO V1',
    //   symbol: 'veVELO v1',
    //   image: TOKEN_IMAGES.veVELO,
    //   decimals: 18,
    //   coingeckoId: 'velodrome-finance',
    //   veNftId: '4',
    //   endBlock: 106144709,
    // },
    [chainTokenAddresses["10"].VELODOLAUSDCLP]: {
      address: chainTokenAddresses["10"].VELODOLAUSDCLP,
      name: 'DOLA-USDCe',
      symbol: 'DOLA-USDCe vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["10"].USDCE, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
    [chainTokenAddresses["10"].VELOV2DOLAUSDCLP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAUSDCLP,
      name: 'DOLA-USDCe',
      symbol: 'DOLA-USDCe vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["10"].USDCE, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    // native usdc
    [chainTokenAddresses["10"].VELOV2DOLAUSDC2LP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAUSDC2LP,
      name: 'DOLA-USDC',
      symbol: 'DOLA-USDC vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["10"].USDC, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    [chainTokenAddresses["10"].VELOV2DOLAALUSDLP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAALUSDLP,
      name: 'DOLA-ALUSD',
      symbol: 'DOLA-ALUSD vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].ALUSD
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
      defillamaPoolId: 'c391cdd2-eb17-423c-a21b-761c904c0cd6',
    },
    [chainTokenAddresses["10"].VELODOLALP]: {
      address: chainTokenAddresses["10"].VELODOLALP,
      name: 'DOLA-VELO',
      symbol: 'DOLA-VELO',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["10"].VELO, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
    [chainTokenAddresses["10"].VELODOLAMAILP]: {
      address: chainTokenAddresses["10"].VELODOLAMAILP,
      name: 'DOLA-MAI',
      symbol: 'DOLA-MAI',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].MAI
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
    [chainTokenAddresses["10"].VELOV2DOLAMAILP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAMAILP,
      name: 'DOLA-MAI',
      symbol: 'DOLA-MAI vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].MAI
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    [chainTokenAddresses["10"].VELODOLAFRAXLP]: {
      address: chainTokenAddresses["10"].VELODOLAFRAXLP,
      name: 'DOLA-FRAX',
      symbol: 'DOLA-FRAX',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["10"].FRAX, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
    [chainTokenAddresses["10"].VELOV2DOLAFRAXLP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAFRAXLP,
      name: 'DOLA-FRAX',
      symbol: 'DOLA-FRAX vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["10"].FRAX, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    [chainTokenAddresses["10"].ARCHLYDOLAUSDCLP]: {
      address: chainTokenAddresses["10"].ARCHLYDOLAUSDCLP,
      name: 'DOLA-USDCe archlp',
      symbol: 'DOLA-USDCe archlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true, 
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["10"].USDCE, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.ARCHLY,
    },
    [chainTokenAddresses["10"].VELODOLAUSDplusLP]: {
      address: chainTokenAddresses["10"].VELODOLAUSDplusLP,
      name: 'DOLA-USD+',
      symbol: 'DOLA-USD+',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      lpBalanceContract: '0x05d74f34ff651e80b0a1a4bD96D8867626Ac2ddD',
      pairs: [
        chainTokenAddresses["10"].USDplus, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
    [chainTokenAddresses["10"].VELOV2DOLAUSDplusLP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAUSDplusLP,
      name: 'DOLA-USD+',
      symbol: 'DOLA-USD+ vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      lpBalanceContract: '0x05d74f34ff651e80b0a1a4bD96D8867626Ac2ddD',
      pairs: [
        chainTokenAddresses["10"].USDplus, chainTokenAddresses["10"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    [chainTokenAddresses["10"].VELOV2DOLAERNLP]: {
      address: chainTokenAddresses["10"].VELOV2DOLAERNLP,
      name: 'DOLA-ERN',
      symbol: 'DOLA-ERN vlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      lpBalanceContract: '0x05d74f34ff651e80b0a1a4bD96D8867626Ac2ddD',
      pairs: [
        chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].ERN
      ],
      protocolImage: PROTOCOL_IMAGES.VELOV2,
    },
    [chainTokenAddresses["10"].DOLAUSDCBEETLP]: {
      address: chainTokenAddresses["10"].DOLAUSDCBEETLP,
      name: 'DOLA-USDCe',
      symbol: 'DOLA-USDCe beetlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      balancerInfos: {
        poolId: '0xacfe9b4782910a853b68abba60f3fd8049ffe6380000000000000000000000ff',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["10"].USDCE, chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].DOLAUSDCBEETLP
      ],
      isStable: true,
      isComposableMetapool: true,
      protocolImage: PROTOCOL_IMAGES.BEETHOVEN,
      deduce: [chainTokenAddresses["10"].DOLAUSDCALP],
    },
    [chainTokenAddresses["10"].DOLAUSDCALP]: {
      address: chainTokenAddresses["10"].DOLAUSDCALP,
      name: 'DOLA-USDCe',
      symbol: 'DOLA-USDCe opalp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0xacfe9b4782910a853b68abba60f3fd8049ffe6380000000000000000000000ff',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["10"].USDCE, chainTokenAddresses["10"].DOLA, chainTokenAddresses["10"].DOLAUSDCBEETLP
      ],
      isComposableMetapool: true,
      protocolImage: PROTOCOL_IMAGES.AURA,
    },
  },
  "56": {
    CHAIN_COIN: {
      address: '',
      name: 'BNB',
      symbol: 'BNB',
      coingeckoId: 'binancecoin',
      image: TOKEN_IMAGES.BNB,
      decimals: 18,
    },
    [chainTokenAddresses["56"].WBNB]: {
      address: chainTokenAddresses["56"].WBNB,
      name: 'WBNB',
      symbol: 'WBNB',
      coingeckoId: 'wbnb',
      image: TOKEN_IMAGES.WBNB,
      decimals: 18,
    },
    [chainTokenAddresses["56"].THENA]: {
      address: chainTokenAddresses["56"].THENA,
      name: 'THENA',
      symbol: 'THENA',
      image: TOKEN_IMAGES.THENA,
      decimals: 18,
      coingeckoId: 'thena',
    },
    [chainTokenAddresses["56"].VETHENA]: {
      address: chainTokenAddresses["56"].VETHENA,
      name: 'veTHENA',
      symbol: 'veTHENA',
      image: TOKEN_IMAGES.veTHENA,
      decimals: 18,
      coingeckoId: 'thena',
      veNftId: '13',
      isLockedVeNft: true,
    },
    [chainTokenAddresses["56"].DOLA]: {
      address: chainTokenAddresses["56"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["56"].FRAX]: {
      address: chainTokenAddresses["56"].FRAX,
      ...FRAX,
    },
    [chainTokenAddresses["56"].CUSD]: {
      address: chainTokenAddresses["56"].CUSD,
      name: 'CUSD',
      symbol: 'CUSD',
      coingeckoId: 'coin98-dollar',
      image: TOKEN_IMAGES.CUSD,
      decimals: 18,
    },
    [chainTokenAddresses["56"].WUSDR]: {
      address: chainTokenAddresses["56"].WUSDR,
      name: 'Wrapped USDR',
      symbol: 'WUSDR',
      coingeckoId: 'wrapped-usdr',
      image: TOKEN_IMAGES.WUSDR,
      decimals: 9,
    },
    [chainTokenAddresses["56"].THENADOLAWUSDRLP]: {
      address: chainTokenAddresses["56"].THENADOLAWUSDRLP,
      name: 'DOLA-WUSDR tlp',
      symbol: 'DOLA-WUSDR tlp',
      image: TOKEN_IMAGES.WUSDR,
      decimals: 18,
      isLP: true,
      isStable: false,
      isVeloLP: true,
      isFusionLP: true,
      pairs: [
        chainTokenAddresses["56"].WUSDR, chainTokenAddresses["56"].DOLA,
      ],
      protocolImage: PROTOCOL_IMAGES.THENA,
    },
    [chainTokenAddresses["56"].THENADOLACUSDLP]: {
      address: chainTokenAddresses["56"].THENADOLACUSDLP,
      name: 'DOLA-CUSD',
      symbol: 'DOLA-CUSD',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["56"].DOLA, chainTokenAddresses["56"].CUSD
      ],
      protocolImage: PROTOCOL_IMAGES.THENA,
    },
    [chainTokenAddresses["56"].THENADOLAFRAXLP]: {
      address: chainTokenAddresses["56"].THENADOLAFRAXLP,
      name: 'DOLA-FRAX tlp',
      symbol: 'DOLA-FRAX tlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["56"].DOLA, chainTokenAddresses["56"].FRAX
      ],
      protocolImage: PROTOCOL_IMAGES.THENA,
    },
    [chainTokenAddresses["56"].THENADOLAWBNBLP]: {
      address: chainTokenAddresses["56"].THENADOLAWBNBLP,
      name: 'DOLA-WBNB',
      symbol: 'DOLA-WBNB',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["56"].DOLA, chainTokenAddresses["56"].WBNB
      ],
      protocolImage: PROTOCOL_IMAGES.THENA,
    },
  },
  "137": {
    CHAIN_COIN: {
      address: '',
      name: 'MATIC',
      symbol: 'MATIC',
      coingeckoId: 'matic-network',
      image: TOKEN_IMAGES.MATIC,
      decimals: 18,
    },
    [chainTokenAddresses["137"].DOLA]: {
      ...DOLA,
      address: chainTokenAddresses["137"].DOLA,
    },
    [chainTokenAddresses["137"].MAI]: {
      address: chainTokenAddresses["137"].MAI,
      ...MAI,
    },
    [chainTokenAddresses["137"].USDC]: {
      address: chainTokenAddresses["137"].USDC,
      ...USDC,
    },
    [chainTokenAddresses["137"].CASH]: {
      address: chainTokenAddresses["137"].CASH,
      name: 'CASH',
      symbol: 'CASH',
      image: TOKEN_IMAGES['CASH'],
      decimals: 18,
      coingeckoId: 'stabl-fi',
    },
    [chainTokenAddresses["137"].CASHV2]: {
      address: chainTokenAddresses["137"].CASHV2,
      name: 'CASH v2',
      symbol: 'CASH',
      image: TOKEN_IMAGES['CASH'],
      decimals: 18,
      coingeckoId: 'stabl-fi',
    },
    [chainTokenAddresses["137"].USDR]: {
      address: chainTokenAddresses["137"].USDR,
      name: 'USDR',
      symbol: 'USDR',
      image: TOKEN_IMAGES['WUSDR'],
      decimals: 9,
      coingeckoId: 'wrapped-usdr',
    },
    [chainTokenAddresses["137"].RUSDR]: {
      address: chainTokenAddresses["137"].RUSDR,
      name: 'RUSDR',
      symbol: 'RUSDR',
      image: TOKEN_IMAGES['RUSDR'],
      decimals: 9,
      coingeckoId: 'real-usd',
    },
    [chainTokenAddresses["137"].DOLAUSDRPEARLLP]: {
      address: chainTokenAddresses["137"].DOLAUSDRPEARLLP,
      name: 'DOLA-USDR plp',
      symbol: 'DOLA-USDR plp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["137"].USDR, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.PEARL,
    },
    [chainTokenAddresses["137"].DOLAUSDRPEARLLP2]: {
      address: chainTokenAddresses["137"].DOLAUSDRPEARLLP2,
      name: 'DOLA-USDR plp',
      symbol: 'DOLA-USDR newplp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["137"].RUSDR, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.PEARL,
    },
    [chainTokenAddresses["137"].MAIDOLASATLP]: {
      address: chainTokenAddresses["137"].MAIDOLASATLP,
      name: 'DOLA-MAI satlp',
      symbol: 'DOLA-MAI satlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["137"].MAI, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.SATIN,      
    },
    [chainTokenAddresses["137"].CASHDOLASATLP]: {
      address: chainTokenAddresses["137"].CASHDOLASATLP,
      name: 'DOLA-CASH satlp',
      symbol: 'DOLA-CASH satlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["137"].CASH, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.SATIN,      
    },
    [chainTokenAddresses["137"].DOLACASHRETROLP]: {
      address: chainTokenAddresses["137"].DOLACASHRETROLP,
      name: 'DOLA-CASH LP',
      symbol: 'DOLA-CASH retrolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["137"].CASHV2, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.RETRO,
    },
    [chainTokenAddresses["137"].DOLAUSDCRETROLP]: {
      address: chainTokenAddresses["137"].DOLAUSDCRETROLP,
      name: 'DOLA-USDC LP',
      symbol: 'DOLA-USDC retrolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["137"].USDC, chainTokenAddresses["137"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.RETRO,
    },
  },
  "42161": {
    CHAIN_COIN: {
      ...ETH,
    },
    [chainTokenAddresses["42161"].DOLA]: {
      ...DOLA,
      address: chainTokenAddresses["42161"].DOLA,
    },
    [chainTokenAddresses["42161"].USDCE]: {
      ...USDC,
      symbol: 'USDC.E',
      address: chainTokenAddresses["42161"].USDCE,
    },
    [chainTokenAddresses["42161"].USDC]: {
      ...USDC,
      address: chainTokenAddresses["42161"].USDC,
    },
    [chainTokenAddresses["42161"].FRAX]: {
      ...FRAX,
      address: chainTokenAddresses["42161"].FRAX,
    },
    [chainTokenAddresses["42161"].MAI]: {
      ...MAI,
      address: chainTokenAddresses["42161"].MAI,
    },
    [chainTokenAddresses["42161"].RAM]: {
      address: chainTokenAddresses["42161"].RAM,
      name: 'RAM',
      symbol: 'RAM',
      coingeckoId: 'ramses-exchange',
      image: TOKEN_IMAGES.RAM,
      decimals: 18,
    },
    [chainTokenAddresses["42161"].STR]: {
      address: chainTokenAddresses["42161"].STR,
      name: 'STR',
      symbol: 'STR',
      coingeckoId: 'sterling-finance',
      image: TOKEN_IMAGES.STR,
      decimals: 18,
    },
    [chainTokenAddresses["42161"].SLIZ]: {
      address: chainTokenAddresses["42161"].SLIZ,
      name: 'SLIZ',
      symbol: 'SLIZ',
      image: TOKEN_IMAGES.SLIZ,
      decimals: 18,
      coingeckoId: 'solidlizard',
    },
    [chainTokenAddresses["42161"].VESTR]: {
      address: chainTokenAddresses["42161"].VESTR,
      name: 'veSTR',
      symbol: 'veSTR',
      image: TOKEN_IMAGES.STR,
      decimals: 18,
      coingeckoId: 'sterling-finance',
      veNftId: '23',
      twgAddress: '0x233Ca46D4882609C53fcbD2FCFaAe92D2eA89538',
    },
    [chainTokenAddresses["42161"].VESLIZ]: {
      address: chainTokenAddresses["42161"].VESLIZ,
      name: 'veSLIZ',
      symbol: 'veSLIZ',
      image: TOKEN_IMAGES.SLIZ,
      decimals: 18,
      coingeckoId: 'solidlizard',
      veNftId: '1449',
      twgAddress: '0x233Ca46D4882609C53fcbD2FCFaAe92D2eA89538',
    },
    [chainTokenAddresses["42161"].VERAM]: {
      address: chainTokenAddresses["42161"].VERAM,
      name: 'veRAM',
      symbol: 'veRAM',
      image: TOKEN_IMAGES.RAM,
      decimals: 18,
      coingeckoId: 'ramses-exchange',
      veNftId: '31',
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].CHRONOS]: {
      address: chainTokenAddresses["42161"].CHRONOS,
      name: 'CHRONOS',
      symbol: 'CHRONOS',
      coingeckoId: 'chronos-finance',
      image: TOKEN_IMAGES.CHRONOS,
      decimals: 18,
    },
    [chainTokenAddresses["42161"].USDPLUS]: {
      address: chainTokenAddresses["42161"].USDPLUS,
      name: 'USD+',
      symbol: 'USD+',
      image: TOKEN_IMAGES['USD+'],
      decimals: 6,
      coingeckoId: 'usd',
    },
    [chainTokenAddresses["42161"].VECHRONOS]: {
      address: chainTokenAddresses["42161"].VECHRONOS,
      name: 'veCHR',
      symbol: 'veCHR',
      image: TOKEN_IMAGES.CHRONOS,
      decimals: 18,
      coingeckoId: 'chronos-finance',
      veNftId: '5395',
      isLockedVeNft: true,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].RAMDOLAUSDCLP]: {
      address: chainTokenAddresses["42161"].RAMDOLAUSDCLP,
      name: 'DOLA-USDC rlp',
      symbol: 'DOLA-USDC rlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].USDCE
      ],
      protocolImage: PROTOCOL_IMAGES.RAMSES,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].RAMDOLAUSDCLP2]: {
      address: chainTokenAddresses["42161"].RAMDOLAUSDCLP2,
      name: 'DOLA-USDC CL',
      symbol: 'DOLA-USDC CL',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isUniV3: true,
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.RAMSES,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].RAMDOLAMAILP]: {
      address: chainTokenAddresses["42161"].RAMDOLAMAILP,
      name: 'DOLA-MAI rlp',
      symbol: 'DOLA-MAI rlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].MAI, chainTokenAddresses["42161"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.RAMSES,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].RAMDOLAFRAXLP]: {
      address: chainTokenAddresses["42161"].RAMDOLAFRAXLP,
      name: 'DOLA-FRAX rlp',
      symbol: 'DOLA-FRAX rlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].FRAX, chainTokenAddresses["42161"].DOLA
      ],
      protocolImage: PROTOCOL_IMAGES.RAMSES,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].STERLINGDOLAUSDCLP]: {
      address: chainTokenAddresses["42161"].STERLINGDOLAUSDCLP,
      name: 'DOLA-USDC stlp',
      symbol: 'DOLA-USDC stlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].USDCE
      ],
      protocolImage: PROTOCOL_IMAGES.STERLING,
      twgAddress: '0x233Ca46D4882609C53fcbD2FCFaAe92D2eA89538',
    },
    [chainTokenAddresses["42161"].SLIZDOLAUSDCLP]: {
      address: chainTokenAddresses["42161"].SLIZDOLAUSDCLP,
      name: 'DOLA-USDC sliz lp',
      symbol: 'DOLA-USDC slizlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].USDCE
      ],
      protocolImage: PROTOCOL_IMAGES.SOLIDLIZARD,
    },
    [chainTokenAddresses["42161"].DOLAUSDPLUSCHRONOS]: {
      address: chainTokenAddresses["42161"].DOLAUSDPLUSCHRONOS,
      name: 'DOLA-USD+ chlp',
      symbol: 'DOLA-USD+ chlp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      isVeloLP: true,
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].USDPLUS
      ],
      protocolImage: PROTOCOL_IMAGES.CHRONOS,
      twgAddress: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
    },
    [chainTokenAddresses["42161"].DOLAUSDCBALLP]: {
      address: chainTokenAddresses["42161"].DOLAUSDCBALLP,
      name: 'DOLA-USDC blp',
      symbol: 'DOLA-USDC arbblp',
      protocolImage: PROTOCOL_IMAGES.BAL,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x8bc65eed474d1a00555825c91feab6a8255c2107000000000000000000000453',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].DOLAUSDCBALLP, chainTokenAddresses["42161"].USDC
      ],
      isComposableMetapool: true,
      image: TOKEN_IMAGES.DOLA,
      deduce: [chainTokenAddresses["42161"].DOLAUSDCALP],
    },
    [chainTokenAddresses["42161"].DOLAUSDCALP]: {
      address: chainTokenAddresses["42161"].DOLAUSDCALP,
      name: 'DOLA-USDC',
      symbol: 'DOLA-USDC arbalp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,
      isStable: true,
      balancerInfos: {
        poolId: '0x8bc65eed474d1a00555825c91feab6a8255c2107000000000000000000000453',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      },
      pairs: [
        chainTokenAddresses["42161"].DOLA, chainTokenAddresses["42161"].DOLAUSDCBALLP, chainTokenAddresses["42161"].USDC
      ],
      isComposableMetapool: true,
      protocolImage: PROTOCOL_IMAGES.AURA,
    },
    [chainTokenAddresses["42161"].AURA]: {
      address: chainTokenAddresses["42161"].AURA,
      name: 'AURA',
      symbol: 'AURA',
      coingeckoId: 'aura-finance',
      image: TOKEN_IMAGES.AURA,
      decimals: 18,
    },
    // [chainTokenAddresses["42161"].VLAURA]: {
    //   address: chainTokenAddresses["42161"].VLAURA,
    //   name: 'vlAURA',
    //   symbol: 'vlAURA',
    //   image: TOKEN_IMAGES.vlAURA,
    //   decimals: 18,
    //   coingeckoId: 'aura-finance',
    // },
    [chainTokenAddresses["42161"].BAL]: {
      address: chainTokenAddresses["42161"].BAL,
      name: 'BAL',
      symbol: 'BAL',
      coingeckoId: 'balancer',
      image: TOKEN_IMAGES.BAL,     
      decimals: 18,
    },
  },
  "81457": {
    CHAIN_COIN: {
      ...ETH,
    },
    [chainTokenAddresses["81457"].DOLA]: {
      address: chainTokenAddresses["81457"].DOLA,
      ...DOLA,
    },
  },
  "34443": {
    CHAIN_COIN: {
      ...ETH,
    },
    [chainTokenAddresses["34443"].DOLA]: {
      address: chainTokenAddresses["34443"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["34443"].USDC]: {
      address: chainTokenAddresses["34443"].USDC,
      ...USDC,
    },
    [chainTokenAddresses["34443"].VELODOLAUSDCLP]: {
      address: chainTokenAddresses["34443"].VELODOLAUSDCLP,
      name: 'DOLA-USDC',
      symbol: 'DOLA-USDC mvelolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["34443"].DOLA, chainTokenAddresses["34443"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.VELO,
    },
  },
  "8453": {
    CHAIN_COIN: {
      ...ETH,
    },
    [chainTokenAddresses["8453"].DOLA]: {
      address: chainTokenAddresses["8453"].DOLA,
      ...DOLA,
    },
    [chainTokenAddresses["8453"].USDBC]: {
      ...USDC,
      address: chainTokenAddresses["8453"].USDBC,
      symbol: 'USDbC',
    },
    [chainTokenAddresses["8453"].USDC]: {
      ...USDC,
      address: chainTokenAddresses["8453"].USDC,      
    },
    [chainTokenAddresses["8453"].MAI]: {
      ...MAI,
      address: chainTokenAddresses["8453"].MAI,
    },
    [chainTokenAddresses["8453"].USDPLUS]: {
      address: chainTokenAddresses["8453"].USDPLUS,
      name: 'USD+',
      symbol: 'USD+',
      image: TOKEN_IMAGES['USD+'],
      decimals: 6,
      coingeckoId: 'usd',
    },
    [chainTokenAddresses["8453"].EUSD]: {
      address: chainTokenAddresses["8453"].EUSD,
      name: 'EUSD',
      symbol: 'EUSD',
      image: TOKEN_IMAGES['EUSD'],
      decimals: 18,
      coingeckoId: 'electronic-usd',
    },
    [chainTokenAddresses["8453"].VEAERO]: {
      address: chainTokenAddresses["8453"].VEAERO,
      name: 'veAERO',
      symbol: 'veAERO',
      image: TOKEN_IMAGES.AERO,
      decimals: 18,
      coingeckoId: 'aerodrome-finance',
      veNftId: '7',
    },
    [chainTokenAddresses["8453"].AERODOLAMAILP]: {
      address: chainTokenAddresses["8453"].AERODOLAMAILP,
      name: 'DOLA-MAI',
      symbol: 'DOLA-MAI aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].MAI
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].AERODOLAUSDCLP]: {
      address: chainTokenAddresses["8453"].AERODOLAUSDCLP,
      name: 'DOLA-USDC',
      symbol: 'DOLA-USDC aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].USDC
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].AERODOLARGUSD]: {
      address: chainTokenAddresses["8453"].AERODOLARGUSD,
      name: 'DOLA-RGUSD',
      symbol: 'DOLA-RGUSD aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].RGUSD
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].AERODOLAEUSD]: {
      address: chainTokenAddresses["8453"].AERODOLAEUSD,
      name: 'DOLA-EUSD',
      symbol: 'DOLA-EUSD aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].EUSD
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].AERODOLAUSDBCLP]: {
      address: chainTokenAddresses["8453"].AERODOLAUSDBCLP,
      name: 'DOLA-USDbC',
      symbol: 'DOLA-USDbC aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].USDBC
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].AERODOLAUSDPLUS]: {
      address: chainTokenAddresses["8453"].AERODOLAUSDPLUS,
      name: 'DOLA-USD+',
      symbol: 'DOLA-USD+ aerolp',
      image: TOKEN_IMAGES.DOLA,
      decimals: 18,
      isLP: true,      
      isVeloLP: true,
      isStable: true,
      pairs: [
        chainTokenAddresses["8453"].DOLA, chainTokenAddresses["8453"].USDPLUS
      ],
      protocolImage: PROTOCOL_IMAGES.AERO,
    },
    [chainTokenAddresses["8453"].PAL]: {
      address: chainTokenAddresses["8453"].PAL,
      name: 'PAL',
      symbol: 'PAL',
      coingeckoId: 'paladin',
      image: TOKEN_IMAGES.PAL,
      decimals: 18,
    },
    [chainTokenAddresses["8453"].RGUSD]: {
      address: chainTokenAddresses["8453"].RGUSD,
      name: 'RGUSD',
      symbol: 'RGUSD',
      coingeckoId: 'revenue-generating-usd',
      image: TOKEN_IMAGES.RGUSD,
      decimals: 18,   
    },
  },
}
chainTokens["31337"] = chainTokens["1"];

const copyAsYearnVault = ['DOLA3POOLCRV', 'USDC', 'USDT', 'DAI', 'YFI', 'WETH'];
copyAsYearnVault.forEach(s => {
  const token = chainTokens["1"][chainTokenAddresses["1"][s]];
  const symbol = `yv${token.symbol}`.replace('yvDOLA-3POOL', 'yvcrvDOLA');
  chainTokens["1"][chainTokenAddresses["1"][`YV${s}`]] = {
    ...token,
    address: chainTokenAddresses["1"][`YV${s}`],
    symbol,
    protocolImage: chainTokens["1"][chainTokenAddresses["1"]['YFI']].image,
    name: symbol,
    coingeckoId: undefined,
    isInPausedSection: false,
    isLP: false,
    isCrvLP: false,
    pairs: undefined,
    image: symbol.startsWith('yvcrv') ? 'https://assets.coingecko.com/markets/images/538/small/Curve.png?1591605481' : token.image,
  }
})

export const TOKENS: TokenList = {
  ...chainTokens[process.env.NEXT_PUBLIC_CHAIN_ID!],
  [process.env.NEXT_PUBLIC_REWARD_TOKEN!]: {
    address: process.env.NEXT_PUBLIC_REWARD_TOKEN,
    name: process.env.NEXT_PUBLIC_REWARD_TOKEN_NAME,
    symbol: process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL,
    coingeckoId: process.env.NEXT_PUBLIC_REWARD_TOKEN_CG_ID,
    image: TOKEN_IMAGES.INV,
    decimals: 18,
    order: 0,
  },
  [process.env.NEXT_PUBLIC_DOLA!]: {
    address: process.env.NEXT_PUBLIC_DOLA,
    ...DOLA,
  },
};

const copyToFtm = ["DOLA", "INV", "USDC", "WFTM"];
copyToFtm.forEach(sym => {
  chainTokens["250"][chainTokenAddresses["250"][sym]] = {
    ...TOKENS[chainTokenAddresses["1"][sym]],
    address: chainTokenAddresses["250"][sym],
  }
});

export const CHAIN_TOKENS: { [key: string]: TokenList } = { ...chainTokens, [process.env.NEXT_PUBLIC_CHAIN_ID!]: TOKENS };

const toV1 = (token: Token) => {
  if(!token) return {};
  return {
    ...token,
    symbol: `${token.symbol}-v1`,
    name: `${token.name}-v1`,
    isInPausedSection: true,
    badge: pausedBadge,
    order: 1000,
  }
}

/* 
 * Anchor Markets Underlyings
 * Markets listed here will appear in UI
 * Key: Anchor Market Address, value: Underlying Token
 */
const chainUnderlying = {
  "1": {
    '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8': toV1(TOKENS.CHAIN_COIN),
    '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b': toV1(getToken(TOKENS, chainTokenAddresses["1"].WBTC)!),
    '0xde2af899040536884e062D3a334F2dD36F34b4a4': toV1(getToken(TOKENS, chainTokenAddresses["1"].YFI)!),
    // v2 markets
    '0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86': { ...TOKENS.CHAIN_COIN, order: 10 },
    '0xE8A2eb30E9AB1b598b6a5fc4aa1B80dfB6F90753': getToken(TOKENS, chainTokenAddresses["1"].WBTC!, { order: 20 }),
    '0x55e9022e1E28831609B22F773fAdb41318F8a8Cc': getToken(TOKENS, chainTokenAddresses["1"].YFI!, { order: 30 }),
    // others
    '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670': getToken(TOKENS, chainTokenAddresses["1"].DOLA, { order: 1 }),
    '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326': getToken(TOKENS, chainTokenAddresses["1"].XSUSHI, { order: 80 }),
    '0xA978D807614c3BFB0f90bC282019B2898c617880': getToken(TOKENS, chainTokenAddresses["1"].STETH, { order: 60 }),
    '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760': getToken(TOKENS, chainTokenAddresses["1"].DOLA3POOLCRV, { order: 70 }),
    '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB': getToken(TOKENS, chainTokenAddresses["1"].INVDOLASLP, { order: 50 }),
    // '0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B': getToken(TOKENS, chainTokenAddresses["1"].FLOKI),
    // yearn vaults
    '0x3cFd8f5539550cAa56dC901f09C69AC9438E0722': getToken(TOKENS, chainTokenAddresses["1"].YVDOLA3POOLCRV, { order: 40 }),
    '0x4597a4cf0501b853b029cE5688f6995f753efc04': getToken(TOKENS, chainTokenAddresses["1"].YVUSDT, { order: 41 }),
    '0x7e18AB8d87F3430968f0755A623FB35017cB3EcA': getToken(TOKENS, chainTokenAddresses["1"].YVUSDC, { order: 42 }),
    '0xD79bCf0AD38E06BC0be56768939F57278C7c42f7': getToken(TOKENS, chainTokenAddresses["1"].YVDAI, { order: 43 }),
    // bacth 2
    '0xE809aD1577B7fF3D912B9f90Bf69F8BeCa5DCE32': getToken(TOKENS, chainTokenAddresses["1"].YVYFI),
    '0xD924Fc65B448c7110650685464c8855dd62c30c0': getToken(TOKENS, chainTokenAddresses["1"].YVWETH),
    '0xa6F1a358f0C2e771a744AF5988618bc2E198d0A0': getToken(TOKENS, chainTokenAddresses["1"].YVCRVCVXETH),
    // batch 3
    '0xb7159DfbAB6C99d3d38CFb4E419eb3F6455bB547': getToken(TOKENS, chainTokenAddresses["1"].YVCRVIB),
    '0x1429a930ec3bcf5Aa32EF298ccc5aB09836EF587': getToken(TOKENS, chainTokenAddresses["1"].YVCRV3CRYPTO),
    '0xD904235Dc0CD28f42AEECc0CD6A7126d871edaa4': getToken(TOKENS, chainTokenAddresses["1"].YVCRVSTEHWETH),
  }
}
chainUnderlying["31337"] = chainUnderlying["1"];

const underlying: TokenList = {
  ...chainUnderlying[process.env.NEXT_PUBLIC_CHAIN_ID!],
}

if (HAS_REWARD_TOKEN) {
  underlying[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN);
  if (process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD) {
    underlying[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD] = {
      ...getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN, { order: 1000 }), isInPausedSection: true,
    };
  }
}

export const UNDERLYING = underlying;

export const REWARD_TOKEN = getRewardToken()
export const RTOKEN_CG_ID = REWARD_TOKEN?.coingeckoId!;
export const RTOKEN_SYMBOL = REWARD_TOKEN?.symbol!;

export const BONDS = [
  {
    input: chainTokenAddresses["1"].INVDOLASLP,
    abiType: 1,
    ctoken: '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].INVDOLASLP)!,
    bondContract: '0x34eb308c932fe3bbda8716a1774ef01d302759d9',
    howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
  },
  {
    input: chainTokenAddresses["1"].DOLA,
    abiType: 0,
    ctoken: '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA)!,
    bondContract: '0xdBfBb1140F8ba147ca4C8c27A2e576dfed0449BD',
    howToGetLink: 'https://www.inverse.finance/swap?fromToken=DAI&toToken=DOLA',
    inputPrice: 1,
  },
  {
    input: chainTokenAddresses["1"].DOLA3POOLCRV,
    abiType: 0,
    ctoken: '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA3POOLCRV)!,
    bondContract: '0x8E57A30A3616f65e7d14c264943e77e084Fddd25',
    howToGetLink: 'https://curve.fi/factory/27/deposit',
    disabled: true,
  },
  {
    input: chainTokenAddresses["1"].DOLA,
    abiType: 0,
    ctoken: '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA)!,
    bondContract: '0xBfB90b9CE47F36841c776a1B82EE49157D4c746b',
    howToGetLink: 'https://www.inverse.finance/swap?fromToken=DAI&toToken=DOLA',
    inputPrice: 1,
  },
  {
    input: chainTokenAddresses["1"].DOLA,
    abiType: 0,
    ctoken: '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA)!,
    bondContract: '0x3Fe012C3a1A747f249a376CC9536f9a94796eE81',
    howToGetLink: 'https://www.inverse.finance/swap?fromToken=DAI&toToken=DOLA',
    inputPrice: 1,
  },
]

export const REPAY_ALL_CONTRACTS = {
  '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8': '0xbE0C9650cf8Ce5279b990e7A6634c63323adfEAE',
  '0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86': '0xa7711C2432af5518fedBeE4b6AA9385e342d844F',
}

export const CHAIN_TOKEN_ADDRESSES = chainTokenAddresses;

export const PROTOCOL_LINKS = {
  "VELO": (lp: Token) => 'https://app.velodrome.finance/liquidity/manage?address='+lp?.address?.toLowerCase(),
  "AERO": (lp: Token) => `https://aerodrome.finance/deposit?token0=${lp.pairs[0].toLowerCase()}&token1=${lp.pairs[1].toLowerCase()}&stable=true`,
  "VELOV2": (lp: Token) => `https://app.velodrome.finance/deposit?token0=${lp.pairs[0].toLowerCase()}&token1=${lp.pairs[1].toLowerCase()}&stable=true`,
  "THENA": (lp: Token) => 'https://thena.fi/liquidity',
  "AURA": (lp: Token) => 'https://app.aura.finance',
  "CRV": (lp: Token) => lp?.link || 'https://curve.fi/#/ethereum/pools',    
  "CVX": (lp: Token) => 'https://www.convexfinance.com/stake',
  "SUSHI": (lp: Token) => `https://www.sushi.com/earn/1:${lp?.address?.toLowerCase()}`,
  "UNI": (lp: Token) => `https://v2.info.uniswap.org/pair/${lp?.address?.toLowerCase()}`,
  "UNIV3": (lp: Token) => `https://info.uniswap.org/#/pools/${lp?.address?.toLowerCase()}`,
  "BAL": (lp: Token) => `https://app.balancer.fi/#/ethereum/pool/${lp?.balancerInfos?.poolId}`,
  "EULER": (lp: Token) => 'https://app.euler.finance',
  "SOLIDLIZARD": (lp: Token) => `https://solidlizard.finance/liquidity/${lp?.address?.toLowerCase()}`,
  "RAMSES": (lp: Token) => `https://app.ramses.exchange/liquidity/${lp?.address?.toLowerCase()}`,
  "STERLING": (lp: Token) => `https://www.sterling.finance/liquidity/${lp?.address?.toLowerCase()}`,
  "ARCHLY": (lp: Token) => `https://archly.fi/liquidity/${lp?.address}`,
  // Satin: 404 on link with address
  "SATIN": (lp: Token) => `https://satin.exchange/liquidity`,
  "SOLISNEK": (lp: Token) => `https://www.solisnek.finance/liquidity/${lp?.address?.toLowerCase()}`,
  "CHRONOS": (lp: Token) => `https://app.chronos.exchange/liquidity`,
}

export const getLpLink = (lp: Token) => {
  const protocol = PROTOCOLS_BY_IMG[lp?.protocolImage];
  return PROTOCOL_LINKS[protocol] ? PROTOCOL_LINKS[protocol](lp) : '';
}