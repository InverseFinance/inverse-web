import useEtherSWR from '@app/hooks/useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Flex, Text } from '@chakra-ui/react'
import { commify, formatEther, parseEther } from '@ethersproject/units'
import { ShrinkableInfoMessage } from '../common/Messages'

const { GOVERNANCE } = getNetworkConfigConstants();

export const GovernanceRules = () => {
    const { data: otherData } = useEtherSWR([
        [GOVERNANCE, 'quorumVotes'],
        [GOVERNANCE, 'proposalThreshold'],
      ]);
    
      const [quorumVotes, proposalThreshold] =
        otherData || [parseEther('4000'), parseEther('1000')];

    return <ShrinkableInfoMessage
        title="🏛️ Governance Rules"
        description={
            <>
                <Flex direction="row" w='full' justify="space-between">
                    <Text>- Min. Quorum for a vote to pass:</Text>
                    <Text>{commify(parseFloat(formatEther(quorumVotes)))}</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                    <Text>- Min. Voting Power to submit proposals:</Text>
                    <Text>{commify(parseFloat(formatEther(proposalThreshold)))}</Text>
                </Flex>
            </>
        }
    />
}