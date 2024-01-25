import { InfoMessage } from '@app/components/common/Messages'
import { Link } from '@app/components/common/Link'
import { VStack, Image } from '@chakra-ui/react'
import { GovernanceRules } from './GovernanceRules'

export const GovernanceInfos = ({
    proposalBlock
}: {
    proposalBlock?: number
}) => {
    return (
        <VStack w='full'>
            <Link href="https://docs.inverse.finance/inverse-finance/inverse-finance/introduction/governance" isExternal={true} target="_blank">
                <Image
                    cursor="pointer"
                    borderRadius="5px"
                    src="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80"
                />
            </Link>
            <InfoMessage
                alertProps={{ fontSize: '12px', w: 'full' }}
                title="Governance data is updated every 15 min"
            />
            <GovernanceRules proposalBlock={proposalBlock} />
        </VStack>
    )
}