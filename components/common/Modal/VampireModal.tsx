import { Box, VStack, Text, HStack, Image } from "@chakra-ui/react"
import { InfoMessage } from "../Messages";
import { dollarify } from "@app/util/markets";
import SimpleModal from "./SimpleModal";
import Link from "../Link";
import { Steps } from "../Step";

const MIN_BORROW = 3000;

const steps = [
    {
        text: <Text>Move any Aave loan over {dollarify(MIN_BORROW, 0)} to FiRM</Text>
    },
    {
        text: <HStack spacing="1">
            <Text>Fill in the gas reimbursement</Text>
            <Link href="https://kw313td9hd4.typeform.com/to/ZflBorXf" isExternal target="_blank" textDecoration="underline">form</Link>
        </HStack>
    },
    {
        text: <Text>Gas will be reimbursed in 30 days</Text>
    },
];

export const VampireModal = ({
    isOpen = false,
    onClose = () => { },
}) => {
    return <SimpleModal
        title={
            <HStack spacing="2">
                <Text>Greetings</Text>
                <Image src="/assets/projects/aave-users.png" w="80px" />
                <Text>users!</Text>
            </HStack>
        }
        onClose={onClose}
        onCancel={onClose}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ minW: { base: '98vw', lg: '800px' }, scrollBehavior: 'inside' }}
    >
        <VStack p='6' spacing="4" alignItems="flex-start">
            <Box>
                <Text fontWeight="bold" fontSize="18px">
                    How to claim your gas reimbursement
                </Text>
            </Box>
            <Steps steps={steps} />
            <InfoMessage
                alertProps={{ w: 'full' }}
                title="Gas reimbursement conditions:"
                description={
                    <VStack alignItems="flex-start" spacing="0">
                        <Text>- Reimbursement via DOLA Borrowing Rights equal to ETH gas value on day 30</Text>
                        <Text>- Minimum borrow: {dollarify(MIN_BORROW, 0)}</Text>
                        <Text>- Minimum duration: 30 days</Text>
                        <Text>- Maximum of 6 transactions per reimbursement</Text>
                        <Text>- Maximum 30 gwei per transaction</Text>
                        <Text>- Transactions made before end of August 31st</Text>
                    </VStack>
                }
            />
        </VStack>
    </SimpleModal>
}