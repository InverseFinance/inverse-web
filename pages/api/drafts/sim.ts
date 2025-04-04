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

const { TREASURY, DEPLOYER, F2_MARKETS, DBR } = getNetworkConfigConstants();

const { TENDERLY_USER, TENDERLY_KEY } = process.env;

export const SLUG_BASE = process.env.VERCEL_ENV === 'production' ? 'p' : 'd';

const getMarketCheckerReport = async (marketAddress: string, vnetId: string) => {
  // const response = await fetch('https://domain.com/api/analyze', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     market_address: marketAddress,
  //     vnet_id: vnetId,
  //   }),
  // });
  // const data = await response.json();
  // return data;
  return {
    "market": {
      "address": "0x2D4788893DE7a4fB42106D9Db36b65463428FBD9",
      "collateral": {
        "address": "0xb7de5dFCb74d25c2f21841fbd6230355C50d9308",
        "symbol": "PT-sUSDE-29MAY2025",
        "name": "PT Ethena sUSDE 29MAY2025",
        "decimals": 18
      },
      "dbr_allowed": true
    },
    "oracle": {
      "address": {
        "before": "0xaBe146CF570FD27ddD985895ce9B138a7110cce8",
        "after": "0xaBe146CF570FD27ddD985895ce9B138a7110cce8"
      },
      "is_newest": true,
      "price": {
        "raw": 969524980974124810,
        "unit_price_usd": 0.9695249809741248
      }
    },
    "liquidation": {
      "collateral_factor": {
        "before": 91.5,
        "after": 91.5
      },
      "liquidation_incentive": {
        "before": 5.0,
        "after": 5.0
      },
      "liquidation_fee": {
        "before": 0.0,
        "after": 0.0
      },
      "max_safe_liquidation_incentive": 9.28,
      "profitable_self_liquidation_possible": false
    },
    "borrow_controller": {
      "address": {
        "before": "0x2DbAd53A647A86b8988E007a33FE78bd55e9Dd6f",
        "after": "0x2DbAd53A647A86b8988E007a33FE78bd55e9Dd6f"
      },
      "is_newest": false,
      "min_debt": {
        "before": 3000.0,
        "after": 3000.0
      },
      "daily_limit": {
        "before": 2000000.0,
        "after": 2000000.0
      }
    },
    "active_positions": {
      "borrowers": []
    },
    "summary": {
      "errors": [],
      "warnings": [
        {
          "message": "Collateral Factor is above 90%",
          "category": "liquidation"
        },
        {
          "message": "BorrowController isn't newest implementation",
          "category": "borrow_controller"
        }
      ],
      "info": []
    }
  }
}

const getProposalAddresses = (actions: { args: { type: string, value: string }[], contractAddress: string }[]) => {
  let ads: string[] = [];
  for (const action of actions) {
    ads.push(action.contractAddress.toLowerCase());
    ads = ads.concat(action.args.filter(arg => arg.type === 'address').map(arg => arg.value.toLowerCase()));
  }
  return [...new Set(ads)];
}

async function mainnetFork(newSimId: number, title: string) {
  return await fetch(
    `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance2/vnets`,
    {
      method: 'POST',
      body: JSON.stringify({
        "slug": SLUG_BASE+"prop-sim-"+newSimId,
        "display_name": title,
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

export const SIMS_CACHE_KEY = 'gp-sim-id';

export default async function handler(req, res) {
  const form = req.body;
  const isNotDraft = !!form.id;
  let proposalId;

  try {
    const cached = (await getCacheFromRedis(SIMS_CACHE_KEY, false));    
    const { lastSimId, ids } =  cached || { lastSimId: 0, ids: [] };
    const newSimId = (lastSimId||0) + 1;
    const vnetTitle = `Sim-${newSimId}: ${form.title.substring(0, 100)}`;
    const forkResponse = await mainnetFork(newSimId, vnetTitle);
    const now = Date.now();
    let hasError = false;
    
    // const tdlyRemaining = forkResponse.headers.get('X-Tdly-Remaining');
    // const rateLimitRemaining = forkResponse.headers.get('x-ratelimit-remaining');
    
    const fork = await forkResponse.json();

    const forkId = fork?.id;
    let _ids = ids || [];
    const adminRpc = fork.rpcs[0].url;
    const publicRpc = fork.rpcs[2].url;
    const publicId = publicRpc.substring(publicRpc.lastIndexOf("/")+1);

    _ids.push({ timestamp: now, id: forkId, publicId, publicRpc, adminRpc, title: form.title });
    await redisSetWithTimestamp(SIMS_CACHE_KEY, { lastSimId: newSimId, ids: _ids });

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
      if(!form.status || !form.etaTimestamp || (!!form.etaTimestamp && now < form.etaTimestamp)) {
        await forkProvider.send('evm_increaseTime', [
          ethers.utils.hexValue(60 * 60 * 24 * 5)
        ]);
      }
      try {
        const executeTx = await govContract.execute(proposalId, {
          gasLimit: 20000000,
        });
        txHash = executeTx.hash;
        const receipt = await executeTx.wait();
        if (receipt.status === 0) {
          hasError = true;
        }
        // avoid stale price reverts
        await forkProvider.send('evm_setNextBlockTimestamp', [
          parseInt(now/1000).toString()
        ]);
      } catch (e) {
        console.log('error executing')
        console.log(e)
        res.status(200).json({
          status: 'success',
          hasError: true,
          vnetPublicId: publicId,
          vnetTitle,
          simUrl: `https://dashboard.tenderly.co/explorer/vnet/${publicId}/tx/${txHash}`,
          errorMsg: e,
        });
        return;
      }
    }

    let marketsReports: any[] = [];
    const proposalAddresses = getProposalAddresses(form.actions);
    const marketsInProposal = F2_MARKETS.filter(m => proposalAddresses.includes(m.address.toLowerCase() || proposalAddresses.includes(m.collateral.toLowerCase()))).map(m => m.address.toLowerCase());
    for (const action of form.actions) {
      if(action.func === 'addMarket(address)' && action.contractAddress.toLowerCase() === DBR.toLowerCase()) {
        const marketToAdd = action.args[0].value.toLowerCase();
        if(!marketsInProposal.includes(marketToAdd)){
          marketsInProposal.push(marketToAdd);
        }
      }
    }
    if(!hasError) {
      const reports = await Promise.allSettled(marketsInProposal.map(address => getMarketCheckerReport(address, publicId)));
      marketsReports = reports.map((r,i) => {
        const marketAddress = marketsInProposal[i];
        const market = F2_MARKETS.find(m => m.address.toLowerCase() === marketAddress);
        const report = r.status === 'fulfilled' ? r.value : null;
        return {
          marketAddress,
          market,
          report,
        };
      });
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
      hasError,
      vnetPublicId: publicId,
      vnetTitle,
      marketsReports,
      simUrl: `https://dashboard.tenderly.co/explorer/vnet/${publicId}/tx/${txHash}`,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, hasError: true, errorMsg: err })
  }
}