import { Contract, ethers } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import ganache from 'ganache'
import { COMPTROLLER_ABI, CTOKEN_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { redisSetWithTimestamp } from '@app/util/redis';

const { COMPTROLLER, UNDERLYING } = getNetworkConfigConstants();

export default async function handler(req, res) {
  // temporary disabled
  return res.status(405).json({ success: false });
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });
  
  try {
    // forking options
    const options = {
      namespace: { option: "fork" },
      fork: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_CRON2}`,
      },
    };

    // init ganache Ethereum fork
    const provider = await ganache.provider(options);
    const web3provider = new ethers.providers.Web3Provider(provider);

    const [signer] = await provider.request({
      method: "eth_accounts",
      params: [],
    });

    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, web3provider);
    const allMarkets: string[] = [...await comptroller.getAllMarkets()];
    const ctokens = allMarkets.filter(address => !!UNDERLYING[address]);

    const currentlyStoredExRates = await Promise.all([
      ...ctokens.map(ctoken => {
        const contract = new Contract(ctoken, CTOKEN_ABI, web3provider);
        return contract.exchangeRateStored();
      })
    ]);

    // accrueInterest()
    await Promise.all([
      ...ctokens.map(ctoken => {
        return web3provider.send("eth_sendTransaction", [
          {
            from: signer,
            to: ctoken,
            data: "0xa6afed95",
            gasLimit: '0x0f4240',
          }
        ]);
      })
    ])

    const realTimeExRates = await Promise.all([
      ...ctokens.map(ctoken => {
        const contract = new Contract(ctoken, CTOKEN_ABI, web3provider);
        return contract.exchangeRateStored();
      })
    ]);

    const exRates = ctokens.map((ctoken, i) => {
      return {
        ctoken, 
        stored: getBnToNumber(currentlyStoredExRates[i]),
        realTime: getBnToNumber(realTimeExRates[i]),
      }
    }).reduce((prev, curr) => ({ ...prev, [curr.ctoken]: { stored: curr.stored, realTime: curr.realTime } }), {});

    const result = {
      status: 'success',
      time: Date.now(),
      exRates,
    }

    await redisSetWithTimestamp('exRates', result);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}