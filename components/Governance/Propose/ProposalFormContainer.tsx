import { useState } from 'react';
import { Container } from '@inverse/components/common/Container';
import { InfoMessage } from '@inverse/components/common/Messages';
import { ProposalForm } from './ProposalForm';
import { Box, Text } from '@chakra-ui/react';
import Link from '@inverse/components/common/Link';
import { SubmitButton } from '@inverse/components/common/Button';
import { TEST_IDS } from '@inverse/config/test-ids';

const REQUIRED_VOTING_POWER = 1000;

export const ProposalFormContainer = ({ votingPower }: { votingPower: number }) => {
    const [isUnderstood, setIsUnderstood] = useState(false);

    return (
        <Container
            label="Submit a new Proposal"
            description="Participate in governance of the DAO"
            href="https://docs.inverse.finance/governance"
            data-testid={TEST_IDS.governance.newProposalContainer}
        >
            {
                votingPower <= REQUIRED_VOTING_POWER ?
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
                        {
                            !isUnderstood ?
                                <InfoMessage description={
                                    <>
                                        You are expected to know what you're doing.
                                        <Text>If you don't, please reach out to someone who can help.</Text>
                                        <Text fontWeight="bold">Otherwise, your proposal <u>may fail to execute</u> after it passes.</Text>
                                        <SubmitButton onClick={() => setIsUnderstood(true)} textTransform="none" mt="2" fontSize="12" w="fit-content">
                                            Yes, I Understand
                                        </SubmitButton>
                                    </>
                                } />
                                : null
                        }
                        <ProposalForm />
                    </Box>
            }
        </Container>
    )
}