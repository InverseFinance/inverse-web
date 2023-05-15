import 'source-map-support'
import { isInvalidGenericParam } from '@app/util/redis'
import { getZapperApps } from '@app/util/zapper';
import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';
import { Contract } from 'ethers';
import { F2_MARKET_ABI } from '@app/config/abis';
import { getProvider } from '@app/util/providers';
import { NetworkIds } from '@app/types';
import { BURN_ADDRESS } from '@app/config/constants';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { account } = req.query;

  if (!account || !isAddress(account) || isInvalidGenericParam(account)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }

  try {
    const provider = getProvider(NetworkIds.mainnet);

    const userEscrows = await Promise.all(
      F2_MARKETS
        .filter(market => market.hasClaimableRewards)
        .map(market => {
          const contract = new Contract(market.address, F2_MARKET_ABI, provider);
          return contract.escrows(account);
        })
    );

    const activeEscrows = userEscrows.filter(escrow => escrow !== BURN_ADDRESS);

    const data = await getZapperApps(activeEscrows, true);

    const resultData = {
      status: !!data?.jobId ? 'ok' : 'ko',
    }

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'ko' });
  }
}