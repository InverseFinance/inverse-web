import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Contract, ethers } from 'ethers';
import { submitProposal } from '@app/util/governance';
import { CURRENT_ERA } from '@app/config/constants';
import { getGovernanceContract } from '@app/util/contracts';
import { FunctionFragment } from 'ethers/lib/utils';
import { INV_ABI } from '@app/config/abis';
import { ProposalStatus } from '@app/types';

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
  const isNotDraft = !!form.id;
  let proposalId;

  try {
    const forkResponse = await mainnetFork();
    const fork = await forkResponse.json();

    const forkId = fork?.simulation_fork.id;
    const rpcUrl = `https://rpc.tenderly.co/fork/${forkId}`;

    const forkProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const accounts = await forkProvider.listAccounts();
    const signers = accounts.map(acc => forkProvider.getSigner(acc));

    // const snapStart = await forkProvider.send("evm_snapshot", []);

    const forkProposer = accounts[0];
    const forkProposerSigner = signers[0];

    await forkProvider.send('tenderly_setBalance', [
      [TREASURY],
      ethers.utils.hexValue(ethers.utils.parseUnits('1', 'ether').toHexString()),
    ]);

    const invContract = new Contract(INV, INV_ABI, forkProvider);
    const govContract = getGovernanceContract(forkProposerSigner, CURRENT_ERA);

    if (!isNotDraft) {
      await forkProvider.send("eth_sendTransaction", [
        {
          from: TREASURY,
          to: INV,
          data: invContract.interface.encodeFunctionData('delegate', [
            forkProposer,
          ]),
        }
      ]);
      const formWithRedbuiltFragments = { ...form, actions: form.actions.map(action => ({ ...action, fragment: FunctionFragment.from(action.func) })) };
      await submitProposal(forkProposerSigner, formWithRedbuiltFragments);
      proposalId = parseInt(await govContract.proposalCount());
    } else {
      proposalId = form.id;
    }

    if (!form.status || form.status === ProposalStatus.active) {
      await forkProvider.send('evm_increaseBlocks', [
        ethers.utils.hexValue(1000)
      ]);
      // // vote
      await govContract.castVote(proposalId, true);
      // pass blocks
      await forkProvider.send('evm_increaseBlocks', [
        ethers.utils.hexValue(17281)
      ]);
    }

    if (!form.status || form.status === ProposalStatus.succeeded) {
      await govContract.queue(proposalId);
    }

    if (!form.status || form.status === ProposalStatus.queued) {
      //pass time      
      if(!form.status || (!!form.etaTimestamp && Date.now() < form.etaTimestamp)) {
        await forkProvider.send('evm_increaseTime', [
          ethers.utils.hexValue(60 * 60 * 24 * 5)
        ]);
      }
      await govContract.execute(proposalId, {
        gasLimit: 8000000,
      });
    }

    // reset
    const snapEnd = await forkProvider.send("evm_snapshot", []);
    // await forkProvider.send("evm_revert", [snapStart]);

    // share
    await fetch(`https://api.tenderly.co/api/v1/account/theAlienTourist/project/inverse-finance/fork/${forkId}/share`, {
      method: 'POST',
      headers: {
        'X-Access-Key': TENDERLY_KEY as string,
      },
    });

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