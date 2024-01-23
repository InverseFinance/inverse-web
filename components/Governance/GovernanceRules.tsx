import useEtherSWR from '@app/hooks/useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Flex, Text } from '@chakra-ui/react'
import { commify, formatEther, parseEther } from '@ethersproject/units'
import { ShrinkableInfoMessage } from '../common/Messages'
import { getHistoricalGovParamsAsArray } from '@app/util/governance'

const { GOVERNANCE } = getNetworkConfigConstants();

export const GovernanceRules = ({
    proposalBlock
}: {
    proposalBlock?: number
}) => {
    const { data: otherData } = useEtherSWR([
        [GOVERNANCE, 'quorumVotes'],
        [GOVERNANCE, 'proposalThreshold'],
    ]);

    const [quorumVotes, proposalThreshold] =
        proposalBlock ?
            getHistoricalGovParamsAsArray(proposalBlock).map(v => parseEther(v.toString())) :
            otherData || [parseEther('15500'), parseEther('1900')];            

    return <ShrinkableInfoMessage
        title={`🏛️ Governance Rules${proposalBlock ? ' at proposal creation' : ''}`}
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