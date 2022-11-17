import { VStack, HStack, Text, Image, Flex } from '@chakra-ui/react'
import { useCheckDBRAirdrop } from '@app/hooks/useDBR'
import { useRouter } from 'next/router'
import useStorage from '@app/hooks/useStorage'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { Modal } from '@app/components/common/Modal'
import { useAccount } from '@app/hooks/misc'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { ConfettiAnim } from '@app/components/common/Animation'

export const AirdropModalCheck = ({
    isOpen,
    onOpen,
    onClose,
}: {
    isOpen: boolean,
    onOpen: () => void,
    onClose: () => void,
}) => {
    const account = useAccount();
    const router = useRouter();
    const { eligible } = useCheckDBRAirdrop(account);
    const { value: isAlreadyShown, setter } = useStorage('dbr-airdrop');

    useDebouncedEffect(() => {
        if (!isAlreadyShown && eligible) {
            onOpen();
        }
    }, [isAlreadyShown, eligible], 200)

    const handleClose = async () => {
        setter('done');
        onClose();
    }

    const handleOk = async () => {
        setter('done');
        router.push('/claim-dbr');
    }

    return <Flex>
            <Modal scrollBehavior="inside" isOpen={isOpen} onClose={handleClose}
            header={
                <Text>You are eligible for the DBR Airdrop!</Text>
            }
            footer={
                <HStack w='full' justify="center">
                    <RSubmitButton
                        onClick={handleOk}
                        w='auto'
                        px="4"
                        py="2"                    
                    >
                        Go to the Claim Page
                    </RSubmitButton>
                </HStack>
            }
        >
            <VStack p='2'>            
                <Image
                    src="/assets/v2/dbr-airdrop.jpg" w={{ base: '100px', sm: '200px' }} h={{ base: '100px', sm: '200px' }}
                />            
            </VStack>
        </Modal>
        {
            isOpen && <VStack position="fixed" top="0" left="0" zIndex="999">
                <ConfettiAnim width={'100vw'} height={'100vh'} loop={false} />
            </VStack>
        }
    </Flex>
}