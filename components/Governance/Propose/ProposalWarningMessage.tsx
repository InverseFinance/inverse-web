import { Text } from '@chakra-ui/react'
import { InfoMessage } from '@app/components/common/Messages'
import { SubmitButton } from '@app/components/common/Button';

export const ProposalWarningMessage = ({ onOk }: { onOk: () => void }) => {
    return (
        <InfoMessage
            alertProps={{ w: 'full' }}
            description={
                <>
                    <Text>Please be sure on how to create a Proposal, otherwise the proposal may fail to execute properly</Text>
                    <SubmitButton onClick={() => onOk()} textTransform="none" mt="2" fontSize="12" w="fit-content">
                        Yes, I Understand
                    </SubmitButton>
                </>
            }
        />
    )
}