import { Contract, ethers } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import ganache from 'ganache'
import { INV_ABI, VESTER_FACTORY_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';

const { TREASURY, XINV_VESTOR_FACTORY, INV } = getNetworkConfigConstants();

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
      params: [],
    });

    await provider.send("eth_sendTransaction", [
      {
        from: accounts[0],
        to: TREASURY,
        value: "0x27f86babdb9b933",
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
        }
      ]);
      const tx = await web3provider.getTransaction(hash);
      const receipt = await web3provider.getTransactionReceipt(hash);
      receipts.push(receipt);

      if(receipt.status === 0) {
        hasError = true
        break
       }
    }

    // const contract = new Contract(INV, INV_ABI, web3provider);

    // const r = await contract.allowance(TREASURY, XINV_VESTOR_FACTORY);
    // console.log(getBnToNumber(r))

    const result = {
      status: 'success',
      hasError,
      receipts,
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}