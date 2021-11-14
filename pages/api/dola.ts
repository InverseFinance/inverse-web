import { CloudflareProvider } from '@ethersproject/providers'
import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { ERC20_ABI } from '@inverse/config/abis'
import { getNetworkConfig } from '@inverse/config/networks'

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true)!;
    const { DOLA } = networkConfig;
    const provider = new CloudflareProvider(Number(networkConfig.chainId))
    const contract = new Contract(DOLA, ERC20_ABI, provider)

    const totalSupply = await contract.totalSupply()

    res.status(200).json({
      totalSupply: parseFloat(formatEther(totalSupply)),
    })
  } catch (err) {
    console.error(err)
  }
}
