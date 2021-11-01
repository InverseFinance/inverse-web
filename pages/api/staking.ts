import { STAKING_ABI } from "@inverse/config/abis";
import { DAYS_PER_YEAR, DOLA3CRV, SECONDS_PER_DAY } from "@inverse/config/constants";
import { AlchemyProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import "source-map-support";

export default async function handler(req, res) {
  try {
    const provider = new AlchemyProvider("homestead", process.env.ALCHEMY_API);
    const contract = new Contract(DOLA3CRV, STAKING_ABI, provider);

    const rewardRate = await contract.rewardRate();
    const totalSupply = await contract.totalSupply();

    res.status(200).json( {
      rates: {
        [DOLA3CRV]: totalSupply.gt(0)
          ? (parseFloat(
              formatEther(rewardRate.mul(SECONDS_PER_DAY * DAYS_PER_YEAR))
            ) /
              parseFloat(formatUnits(totalSupply))) *
            100
          : 0,
      },
    });
  } catch (err) {
    console.error(err);
  }
};
