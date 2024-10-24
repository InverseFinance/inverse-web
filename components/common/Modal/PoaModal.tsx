import { Box, VStack, Text } from "@chakra-ui/react"
import ConfirmModal from "./ConfirmModal"
import { useWeb3React } from "@web3-react/core";
import { POA_CURRENT_MSG_TO_SIGN, POA_CURRENT_TEXTS } from "@app/config/proof-of-agreement-texts";
import { savePoaSig } from "@app/util/poa";
import { InfoMessage } from "../Messages";

export const PoaModal = ({
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
            const sig = await signer.signMessage(POA_CURRENT_MSG_TO_SIGN).catch(() => '');
            if (!!sig) {
                const saveRes = await savePoaSig(account, sig);
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
        modalProps={{ scrollBehavior: 'inside', minW: { base: '98vw', lg: '600px' }  }}
    >
        <VStack p='4' spacing="4">
            <Box>
                <Text>
                    Please sign a message with your wallet to confirm your agreement to the following terms.
                </Text>
            </Box>
            <VStack spacing="2" bgColor="mainBackgroundColor" borderColor="navBarBorderColor" borderWidth="1px" borderRadius="5px" p="2">
                {
                    POA_CURRENT_TEXTS.map((text, index) => {
                        return <Text key={index}>
                            {text}
                        </Text>
                    })
                }
            </VStack>
            <InfoMessage
                alertProps={{ w: 'full' }}
                description="Note: if you can't accept the agreement you can still exit your positions if there is any"
            />
        </VStack>
    </ConfirmModal>
}