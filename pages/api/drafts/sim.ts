import { ethers, utils } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import ganache from 'ganache'
import { getRandomFromStringList } from '@app/util/misc';
import { parseUnits } from '@ethersproject/units';

const { TREASURY } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { actions } = req.body;

  try {
    // forking options
    const options = {
      namespace: { option: "fork" },
      fork: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${getRandomFromStringList(process.env.ALCHEMY_KEYS!)}`,
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
      params: [],
    });

    await provider.send("eth_sendTransaction", [
      {
        from: accounts[0],
        to: TREASURY,
        value: "0x056bc75e2d63100000",
      }
    ]);

    const receipts = [];
    let hasError = false

    for (let action of actions) {
      const hash = await provider.send("eth_sendTransaction", [
        {
          from: TREASURY,
          to: action.to,
          data: action.data,
          value: action.value ? utils.hexStripZeros(parseUnits(action.value, 0).toHexString()) : undefined,
          gasLimit: '0x0f4240',
        }
      ]);

      const tx = await web3provider.getTransaction(hash);
      const receipt = await web3provider.getTransactionReceipt(hash);
      receipts.push(receipt);

      if (receipt.status === 0) {
        hasError = true
        break
      }
    }

    const result = {
      status: 'success',
      hasError,
      receipts,
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, hasError: true })
  }
}