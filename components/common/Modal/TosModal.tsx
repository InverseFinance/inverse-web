import { Box, Link, VStack, Text } from "@chakra-ui/react"
import ConfirmModal from "./ConfirmModal"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { useWeb3React } from "@web3-react/core";
import { TOS } from "@app/config/tos-texts";
import { saveTosSig } from "@app/util/tos-api";
import { InfoMessage } from "../Messages";

export const TosModal = ({
    onOk = () => { },
    isOpen = false,
    onClose = () => { },
    onCancel = () => { },
    onSuccess = () => { },
}) => {
    const { provider, account } = useWeb3React();

    const handleOk = async () => {
        if (provider && !!account) {
            const signer = provider?.getSigner();
            const sig = await signer.signMessage(TOS.join('\n\n')).catch(() => '');
            if (!!sig) {
                const saveRes = await saveTosSig(account, sig);
                console.log(saveRes);
                if (saveRes.status === 200) {
                    if (onSuccess) {
                        onSuccess();
                    }
                    onClose();
                    onOk();
                }
            }
        } else {
            onOk();
        }
    }

    return <ConfirmModal
        title={`Proof of Agreement`}
        onClose={onClose}
        onCancel={onClose}
        onOk={() => {
            return handleOk()
        }}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ scrollBehavior: 'inside' }}
    >
        <VStack p='4' spacing="4">
            <Box>
                <Text>
                    Please sign a message with your wallet to confirm your agreement to the <Link target="_blank" href="/" isExternal textDecoration="underline">
                        Terms and Conditions <ExternalLinkIcon />
                    </Link>.
                </Text>
            </Box>
            <VStack spacing="2" bgColor="mainBackgroundColor" borderColor="navBarBorderColor" borderWidth="1px" borderRadius="5px" p="2">
                <Text>
                    {TOS[0]}
                </Text>
                <Text>
                    {TOS[1]}
                </Text>
                <Text>
                    {TOS[2]}
                </Text>
            </VStack>
            <InfoMessage
                alertProps={{ w: 'full' }}
                description="Note: if you can't accept the TOS you can still exit your positions if there is any"
            />
        </VStack>
    </ConfirmModal>
}