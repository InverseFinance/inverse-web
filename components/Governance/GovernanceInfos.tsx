import { InfoMessage } from '@app/components/common/Messages'
import { useDAO } from '@app/hooks/useDAO'
import { VStack } from '@chakra-ui/react'
import { GovernanceRules } from './GovernanceRules'

export const GovernanceInfos = () => {
    const {  } = useDAO()
    return (
        <VStack w='full'>
            <InfoMessage
                alertProps={{ fontSize: '12px', w: 'full' }}
                title="Governance data is updated every 15 min"
            />
            <GovernanceRules />
        </VStack>
    )
}