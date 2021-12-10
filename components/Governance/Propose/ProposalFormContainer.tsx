import { useState } from 'react';
import { InfoMessage } from '@inverse/components/common/Messages';
import { ProposalForm } from './ProposalForm';
import { Box, Text } from '@chakra-ui/react';
import Link from '@inverse/components/common/Link';
import { TEST_IDS } from '@inverse/config/test-ids';
import { GovEra } from '@inverse/types';
import { useEffect } from 'react';
import { getGovernanceContract } from '@inverse/util/contracts';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { formatUnits } from 'ethers/lib/utils';

const DEFAULT_REQUIRED_VOTING_POWER = 1000;

export const ProposalFormContainer = ({ votingPower }: { votingPower: number }) => {
    const { library, account } = useWeb3React<Web3Provider>();
    const [requiredVotingPower, setRequiredVotingPower] = useState(DEFAULT_REQUIRED_VOTING_POWER);
    const [lastProposalId, setLastProposalId] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!account) { return }
            const govContract = getGovernanceContract(library?.getSigner(), GovEra.mils);
            const threshold = await govContract.proposalThreshold();
            const lastId = await govContract.proposalCount();
            if(!isMounted) { return }
            const parsedThreshold = parseFloat(formatUnits(threshold));
            setRequiredVotingPower(parsedThreshold)
            setLastProposalId(parseInt(lastId))
        }
        init();
        return () => { isMounted = false }
    }, [library])

    return (
        <Box w="full" p={6} pb={0} data-testid={TEST_IDS.governance.newProposalContainer}>
            {
                votingPower < requiredVotingPower ?
                    <Box w="full" textAlign="center">
                        <InfoMessage
                            alertProps={{ textAlign: "center", p: '6' }}
                            description={
                                <>
                                    At least <b>1000 voting power</b> is required to make a new proposal.
                                </>
                            } />
                        <Text mt="3">
                            You can share your proposal idea in our
                            <Link fontWeight="bold" ml="1" href="https://discord.gg/YpYJC7R5nv" isExternal>
                                Discord
                            </Link>
                        </Text>
                    </Box>
                    :
                    <Box w="full" textAlign="center">
                        <ProposalForm lastProposalId={lastProposalId} />
                    </Box>
            }
        </Box>
    )
}