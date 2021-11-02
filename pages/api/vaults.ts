import { HARVESTER_ABI, VAULT_ABI } from "@inverse/config/abis";
import {
  DAYS_PER_YEAR,
  SECONDS_PER_DAY,
} from "@inverse/config/constants";
import { AlchemyProvider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks';

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true);
    if(!networkConfig?.governance) {
      res.status(403).json({ success: false, message: `No Cron support on ${chainId} network` });
    }

    const {
      HARVESTER,
      VAULT_TOKENS,
    } = getNetworkConfigConstants(networkConfig);

    const provider = new AlchemyProvider(Number(networkConfig.chainId), process.env.ALCHEMY_API);
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
