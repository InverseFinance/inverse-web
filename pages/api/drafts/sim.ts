import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { ethers } from 'ethers';
import { submitProposal } from '@app/util/governance';
import { CURRENT_ERA } from '@app/config/constants';
import { getGovernanceContract } from '@app/util/contracts';
import { FunctionFragment } from 'ethers/lib/utils';
import { ProposalStatus } from '@app/types';
import { genTransactionParams } from '@app/util/web3';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';

const { TREASURY, DEPLOYER } = getNetworkConfigConstants();

const { TENDERLY_USER, TENDERLY_KEY } = process.env;

export const SLUG_BASE = process.env.VERCEL_ENV === 'production' ? 'p' : 'd';

async function mainnetFork(newSimId: number) {
  return await fetch(
    `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance2/vnets`,
    {
      method: 'POST',
      body: JSON.stringify({
        "slug": SLUG_BASE+"prop-sim-"+newSimId,
        "display_name": "Gov prop sim "+newSimId,
        "fork_config": {
          "network_id": 1,
          // "block_number": "0x12c50f0"
        },
        "virtual_network_config": {
          "chain_config": {
            "chain_id": 1
          }
        },
        "sync_state_config": {
          "enabled": false
        },
        "explorer_page_config": {
          "enabled": true,
          "verification_visibility": "src"
        }
      }),
      headers: {
        'X-Access-Key': TENDERLY_KEY as string,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  );
}

export default async function handler(req, res) {
  const form = req.body;
  const isNotDraft = !!form.id;
  let proposalId;
  const cacheKey = 'gp-sim-id';

  try {
    const cached = (await getCacheFromRedis(cacheKey, false));    
    const { lastSimId } =  cached || { lastSimId: 0 };
    const newSimId = (lastSimId||0) + 1;   
    const forkResponse = await mainnetFork(newSimId);
    await redisSetWithTimestamp(cacheKey, { lastSimId: newSimId });
    // const tdlyRemaining = forkResponse.headers.get('X-Tdly-Remaining');
    // const rateLimitRemaining = forkResponse.headers.get('x-ratelimit-remaining');
    
    const fork = await forkResponse.json();

    // const forkId = fork?.id;
    const adminRpc = fork.rpcs[0].url;
    const publicRpc = fork.rpcs[1].url;
    const publicId = publicRpc.substring(publicRpc.lastIndexOf("/")+1);

    const forkProvider = new ethers.providers.JsonRpcProvider(adminRpc);
    const accounts = await forkProvider.listAccounts();
    const signers = accounts.map(acc => forkProvider.getSigner(acc));

    // const snapStart = await forkProvider.send("evm_snapshot", []);

    const forkProposer = accounts[0];
    const forkProposerSigner = signers[0];

    await forkProvider.send('tenderly_setBalance', [
      [TREASURY],
      ethers.utils.hexValue(ethers.utils.parseUnits('1', 'ether').toHexString()),
    ]);
    const govContract = getGovernanceContract(forkProposerSigner, CURRENT_ERA);

    // if draft simulate submitting proposal
    if (!isNotDraft) {
      await forkProvider.send("eth_sendTransaction", [
        {
          from: TREASURY,
          to: govContract.address,
          data: govContract.interface.encodeFunctionData('updateProposerWhitelist', [
            forkProposer, true
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
      // try make vote two biggest delegates   
      try {
        await forkProvider.send("eth_sendTransaction", [
          {
            ...genTransactionParams(govContract.address, 'function castVote(uint256, bool)', [proposalId, true]),
            from: DEPLOYER,
            value: undefined,
          }
        ]);
      } catch (e) {
        console.log('error voting')
        console.log(e)
      }
      try {
        await forkProvider.send("eth_sendTransaction", [
          {
            ...genTransactionParams(govContract.address, 'function castVote(uint256, bool)', [proposalId, true]),
            from: '0x759a159D78342340EbACffB027c05910c093f430',
            value: undefined,
          }
        ]);
      } catch (e) {
        console.log('error voting 2')
        console.log(e)
      }
      // pass blocks
      await forkProvider.send('evm_increaseBlocks', [
        ethers.utils.hexValue(17281)
      ]);
      await forkProvider.send('evm_increaseTime', [
        ethers.utils.hexValue(60 * 60 * 24 * 3)
      ]);
      form.status = ProposalStatus.succeeded;
    }

    if (!form.status || form.status === ProposalStatus.succeeded) {      
      await govContract.queue(proposalId);
      form.status = ProposalStatus.queued;
    }

    let txHash = '';
    if (!form.status || form.status === ProposalStatus.queued) {      
      //pass time      
      if(!form.status || !form.etaTimestamp || (!!form.etaTimestamp && Date.now() < form.etaTimestamp)) {
        await forkProvider.send('evm_increaseTime', [
          ethers.utils.hexValue(60 * 60 * 24 * 5)
        ]);
      }      
      const executeTx = await govContract.execute(proposalId, {
        gasLimit: 20000000,
      });
      txHash = executeTx.hash;
    }

    // reset
    // const snapEnd = await forkProvider.send("evm_snapshot", []);
    // await forkProvider.send("evm_revert", [snapStart]);

    // // share
    // await fetch(`https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance/testnet/${forkId}/share`, {
    //   method: 'POST',
    //   headers: {
    //     'X-Access-Key': TENDERLY_KEY as string,
    //   },
    // });

    res.status(200).json({
      status: 'success',
      hasError: false,
      simUrl: `https://dashboard.tenderly.co/explorer/vnet/${publicId}/tx/${txHash}`,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, hasError: true, errorMsg: err })
  }
}