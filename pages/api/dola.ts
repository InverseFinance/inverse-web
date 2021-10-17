import { AlchemyProvider } from '@ethersproject/providers'
import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { ERC20_ABI } from './config/abis'
import { DOLA } from './config/constants'

export default async function handler(req, res) {
  try {
    const provider = new AlchemyProvider('homestead', process.env.ALCHEMY_API)
    const contract = new Contract(DOLA, ERC20_ABI, provider)

    const totalSupply = await contract.totalSupply()

    res.status(200).json({
      totalSupply: parseFloat(formatEther(totalSupply)),
    })
  } catch (err) {
    console.error(err)
  }
}
