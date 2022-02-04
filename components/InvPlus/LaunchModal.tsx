import { Modal } from '@app/components/common/Modal';
import { Stack, Text, VStack } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { LaunchAnim } from '@app/components/common/Animation';
import { useRouter } from 'next/router';

export type ModalProps = {
    isOpen: boolean
    onClose: () => void
}

const InvPlusLaunchModal = ({ onClose, isOpen }: ModalProps) => {
    const router = useRouter()

    const handleLearnMore = () => {
        onClose();
        router.push('/inv');
    }

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            minW={{ base: undefined, md: "500px" }}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <LaunchAnim loop={true} width={50} height={50} />
                    <Text>Big News! INV+ Just Launched!</Text>
                </Stack>
            }
            footer={
                <SubmitButton onClick={handleLearnMore}>
                    Learn More about INV+
                </SubmitButton>
            }
        >
            <Stack p={'5'} minH={150} overflowY="auto">
                <Text textAlign="center"><b>INV</b> becomes a Positive Sum Rewards Token: <b>Inverse Plus</b> !</Text>

                <VStack alignItems="flex-start" style={{ margin:'auto' }}>
                    <Text pt="5" fontWeight="bold">Key changes:</Text>
                    <Text fontSize="14px">- Positive Sum Rewards Token</Text>
                    <Text fontSize="14px">- xINV Continuous Rewards</Text>
                    <Text fontSize="14px">- Future DOLA Revenue Sharing Rewards</Text>
                    <Text fontSize="14px">- Permanent protocol-owned liquidity</Text>
                    <Text fontSize="14px">- Low-interest DOLA borrowing</Text>
                    <Text fontSize="14px">- No escrow to withdraw staked INV</Text>
                    <Text fontWeight="bold" pt="5">No action required for existing stakers</Text>
                </VStack>

                {/* <Text>
                    <b>INV</b> just completed a major upgrade to a Positive Sum Rewards Token - <b>Inverse Plus</b> - that issues staking rewards at a much higher APY as well as future revenue sharing rewards to all stakers. No action required for existing stakers.
                </Text> */}
            </Stack>
        </Modal>
    )
}

export default InvPlusLaunchModal;