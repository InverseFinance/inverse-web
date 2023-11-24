import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Contract, ethers } from 'ethers';
import { submitProposal } from '@app/util/governance';
import { CURRENT_ERA } from '@app/config/constants';
import { getGovernanceContract } from '@app/util/contracts';
import { FunctionFragment } from 'ethers/lib/utils';
import { INV_ABI } from '@app/config/abis';

const { TREASURY, INV } = getNetworkConfigConstants();

const { TENDERLY_USER, TENDERLY_KEY } = process.env;

async function mainnetFork() {
  return await fetch(
    `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance/fork`,
    {
      method: 'POST',
      body: JSON.stringify({
        network_id: '1',
      }),
      headers: {
        'X-Access-Key': TENDERLY_KEY as string,
      },
    },
  );
}

export default async function handler(req, res) {
  const form = req.body;

  try {
    // const forkResponse = await mainnetFork();
    // const fork = await forkResponse.json();
    
    // const forkId = fork?.simulation_fork.id;  
    const forkId = '882d93a4-650e-486a-b9a3-5be857024259';
    const rpcUrl = `https://rpc.tenderly.co/fork/${forkId}`;    

    const forkProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const accounts = await forkProvider.listAccounts();
    const signers = accounts.map(acc => forkProvider.getSigner(acc));

    const snapStart = await forkProvider.send("evm_snapshot", []);

    const forkProposer = accounts[0];
    const forkProposerSigner = signers[0];

    await forkProvider.send('tenderly_setBalance', [
      [TREASURY],
      ethers.utils.hexValue(ethers.utils.parseUnits('1', 'ether').toHexString()),
    ]);

    const invContract = new Contract(INV, INV_ABI, forkProvider);
    const govContract = getGovernanceContract(forkProposerSigner, CURRENT_ERA);

    await forkProvider.send("eth_sendTransaction", [
      {
        from: TREASURY,
        to: INV,
        data: invContract.interface.encodeFunctionData('delegate', [
          forkProposer,
        ]),
      }
    ]);

    await invContract.getCurrentVotes(forkProposer);
    
    const formWithRedbuiltFragments = { ...form, actions: form.actions.map(action => ({ ...action, fragment: FunctionFragment.from(action.func) })) };
    await submitProposal(forkProposerSigner, formWithRedbuiltFragments);
    const newProposalId = parseInt(await govContract.proposalCount());
    
    await forkProvider.send('evm_increaseBlocks', [
      ethers.utils.hexValue(1000)
    ]);
    // vote
    await govContract.castVote(newProposalId, true);
    // pass blocks     
    await forkProvider.send('evm_increaseBlocks', [
      ethers.utils.hexValue(17281)
    ]);
    await govContract.queue(newProposalId);
    // pass time
    await forkProvider.send('evm_increaseTime', [
      ethers.utils.hexValue(60 * 60 * 24 * 5)
    ]);
    await govContract.execute(newProposalId, {
      gasLimit: 8000000,
    });   

    // reset
    const snapEnd = await forkProvider.send("evm_snapshot", []);    
    await forkProvider.send("evm_revert", [snapStart]);

    res.status(200).json({
      status: 'success',
      hasError: false,
      simUrl: `https://dashboard.tenderly.co/shared/fork/${forkId}/simulation/${snapEnd}`
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, hasError: true, errorMsg: err })
  }
}