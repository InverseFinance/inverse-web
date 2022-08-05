import { HStack, Text, VStack } from "@chakra-ui/react"
import { useContractEvents } from '@app/hooks/useContractEvents';
import { getNetworkConfigConstants } from '@app/util/networks';
import { DEBT_CONVERTER_ABI } from "@app/config/abis";
import { UNDERLYING } from "@app/variables/tokens";

const { DEBT_CONVERTER } = getNetworkConfigConstants();

export const DebtConverterConversions = ({
    account
}: {
    account: string
}) => {
    const { events, isLoading } = useContractEvents(DEBT_CONVERTER, DEBT_CONVERTER_ABI, 'Conversion', [account]);

    return <VStack>
        {events?.length > 0 && <Text>Past conversions:</Text>}
        {events?.map(e => {
            return <HStack key={e.eventSignature}>
                {UNDERLYING[e.args.anToken]}: {e.args.dolaAmount} DOLA
            </HStack>
        })}
    </VStack>
}