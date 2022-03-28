import { ethers } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import ganache from 'ganache'

const { TREASURY } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { actions } = req.body;

  try {
    // forking options
    const options = {
      namespace: { option: "fork" },
      fork: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API}`,
      },
      wallet: {
        // unlock TREASURY account to use as "from"
        unlockedAccounts: [TREASURY],
      }
    };

    // init ganache Ethereum fork
    const provider = await ganache.provider(options);
    const web3provider = new ethers.providers.Web3Provider(provider);

    const accounts = await provider.request({
      method: "eth_accounts",
      params: []
    });

    await provider.send("eth_sendTransaction", [
      {
        from: accounts[0],
        to: TREASURY,
        value: "0x27f86babdb9b933",
      }
    ]);

    const results = [];

    for (let action of actions) {
      const result = await provider.send("eth_sendTransaction", [
        {
          from: TREASURY,
          to: action.to,
          data: action.data,
        }
      ]);
      results.push(result);
    }

    const result = {
      results,
    }

    res.status(200).json(result)
  } catch (err) {
    console.error(err);
    res.status(200).json(err)
    // if an error occured, try to return last cached results
    try {

    } catch (e) {
      console.error(e);
    }
  }
}