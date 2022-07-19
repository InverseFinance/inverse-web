import { InfoMessage } from '@app/components/common/Messages'
import { useDAO } from '@app/hooks/useDAO'
import { VStack, Image } from '@chakra-ui/react'
import { GovernanceRules } from './GovernanceRules'

export const GovernanceInfos = () => {
    const { } = useDAO()
    return (
        <VStack w='full'>
            <Image
                borderRadius="5px"
                src="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=3840&q=75"
            />
            <InfoMessage
                alertProps={{ fontSize: '12px', w: 'full' }}
                title="Governance data is updated every 15 min"
            />
            <GovernanceRules />
        </VStack>
    )
}