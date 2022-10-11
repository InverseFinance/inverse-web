import { VStack, HStack } from '@chakra-ui/react'
import LinkButton, { SubmitButton } from '@app/components/common/Button'
import { useAccountDBR } from '@app/hooks/useDBR'
import { useRouter } from 'next/router'
import useStorage from '@app/hooks/useStorage'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { Modal } from '@app/components/common/Modal'
import { useAccount } from '@app/hooks/misc'
import { MarketsV2Hero } from './MarketsV2Hero'

export const IntroModalCheck = ({
    autoOpenIntroModal = false,
    isIntroOpen,
    onIntroOpen,
    onIntroClose,
}: {
    autoOpenIntroModal?: boolean,
    isIntroOpen: boolean,
    onIntroOpen: () => void,
    onIntroClose: () => void,
}) => {
    const router = useRouter();
    const account = useAccount();
    const { debt } = useAccountDBR(account);    
    const { value: isIntroDone, setter } = useStorage('f2-intro');

    useDebouncedEffect(() => {
        if (!isIntroDone && autoOpenIntroModal) {
            onIntroOpen();
        }
    }, [isIntroDone], 200)

    const handleIntroClose = async () => {
        setter('done');
        onIntroClose();
    }

    const getStarted = () => {
        router.push(debt > 0 ? 'f2/WETH' : 'f2/walkthrough/WETH#step1')
    }

    return <Modal scrollBehavior="inside" h="95vh" maxH='700px' minW={{ base: '98vw', lg: '800px' }} isOpen={isIntroOpen} onClose={handleIntroClose}
        footer={
            <HStack w='full' justify="space-between">
                <LinkButton
                    href="https://docs.google.com/document/d/1xDsuhhXTHqNLIZmlwjzCf-P7bjDvQEI72dS0Z0GGM38/edit"
                    isOutline={true}
                    target='_blank'
                >
                    Learn More
                </LinkButton>
                <SubmitButton onClick={getStarted}>
                    Get Started
                </SubmitButton>
            </HStack>
        }
    >
        <VStack p='8'>
            <MarketsV2Hero showButtons={false} />
        </VStack>
    </Modal>
}