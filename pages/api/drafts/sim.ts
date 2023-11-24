import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'

const { TREASURY } = getNetworkConfigConstants();

const { TENDERLY_USER, TENDERLY_KEY } = process.env;

export default async function handler(req, res) {
  const { actions } = req.body;

  try {
    const tenderkyUrl = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance/simulate-bundle`;
    const body = JSON.stringify({      
      simulations: actions.map((transaction) => ({
        network_id: '1', // network to simulate on
        save: true,        
        save_if_fails: true,
        simulation_type: 'full',
        from: TREASURY,
        // gas: 1000000,
        gas_price: 0,
        value: (transaction.value || 0),
        input: transaction.data,
        to: transaction.to,
      })),
    });
    // console.log(body)
    const response = await fetch(tenderkyUrl, {
      method: 'POST',
      headers: {
        'X-Access-Key': TENDERLY_KEY as string,
      },
      body,
    });
    const simData = await response.json();
    const errorMsg = simData.error?.message;
    let hasError = !!errorMsg || !!simData?.simulation_results?.find(s => s.status === false);

    const result = {
      status: 'success',
      simData,
      errorMsg,
      results: simData?.simulation_results,
      hasError,
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, hasError: true })
  }
}