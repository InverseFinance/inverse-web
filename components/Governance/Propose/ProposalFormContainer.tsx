import { Container } from '@inverse/components/common/Container';
import { InfoMessage } from '@inverse/components/common/Messages';
import { ProposalForm } from './ProposalForm';
import { Text } from '@chakra-ui/react';

const REQUIRED_VOTING_POWER = 1000;

export const ProposalFormContainer = ({ votingPower }: { votingPower: number }) => {
    return (
        <Container
            label="New Proposal"
            description="Participate in governance of the DAO"
            href="https://docs.inverse.finance/governance"
        >
            {
                votingPower <= REQUIRED_VOTING_POWER ?
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            <>
                                At least <b>1000 voting power</b> is required to propose
                            </>
                        } />
                    : <ProposalForm />
            }
        </Container>
    )
}