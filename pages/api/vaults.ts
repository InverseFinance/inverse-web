import { HARVESTER_ABI, VAULT_ABI } from "./config/abis";
import {
  DAYS_PER_YEAR,
  HARVESTER,
  SECONDS_PER_DAY,
  VAULT_TOKENS,
} from "./config/constants";
import { InfuraProvider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";

export default async function handler(req, res) {
  try {
    const provider = new InfuraProvider("homestead", process.env.INFURA_ID);
    const harvester = new Contract(HARVESTER, HARVESTER_ABI, provider);

    const rates = await Promise.all(
      VAULT_TOKENS.map((address: string) => harvester.ratePerToken(address))
    );

    const lastDistribution = await new Contract(
      VAULT_TOKENS[0],
      VAULT_ABI,
      provider
    ).lastDistribution();

    res.status(200).json( {
      lastDistribution: lastDistribution.toNumber(),
      rates: rates.reduce((res, rate, i) => {
        res[VAULT_TOKENS[i]] =
          parseFloat(
            formatUnits(
              rate.mul(DAYS_PER_YEAR * SECONDS_PER_DAY),
              BigNumber.from(36).sub(i === 0 ? 6 : 18)
            )
          ) * 100;
        return res;
      }, {}),
    });
  } catch (err) {
    console.error(err);
  }
};
