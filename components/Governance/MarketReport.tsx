import { VStack, Text, useDisclosure, HStack, Flex } from "@chakra-ui/react";
import { ErrorMessage, InfoMessage, WarningMessage } from "../common/Messages";
import { MarketNameAndIcon } from "../F2/F2Markets";
import { TOKENS } from "@app/variables/tokens";
import SimpleModal from "../common/Modal/SimpleModal";

export const MarketReport = ({ market, marketAddress, report }: { market: any, marketAddress: string, report: any }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const anythingToReport = report.summary.warnings.length > 0 || report.summary.errors.length > 0 || report.summary.info.length > 0;
    return <VStack w='full' alignItems='flex-start'>
        <SimpleModal modalProps={{ size: '2xl' }} isOpen={isOpen} onClose={onClose} title={market?.name || marketAddress}>
            <VStack p="4" w='full' alignItems='flex-start'>
                <Flex w="full" overflowX="auto" direction="column" bgColor="primary.850" borderRadius={8} p={3}>
                    {JSON.stringify(report, null, 2)}
                </Flex>
            </VStack>
        </SimpleModal>
        <HStack cursor="pointer" onClick={onOpen} textDecoration="underline" justify='space-between'>
            {
                market?.name ? <MarketNameAndIcon name={market.name} icon={TOKENS[market.collateral]?.image} underlying={TOKENS[market.collateral]} /> : <Text fontSize='lg' fontWeight='bold'>{marketAddress}</Text>
            }
        </HStack>
        {
            anythingToReport ? <>
                {
                    report.summary.errors.length > 0 && <ErrorMessage alertProps={{ w: 'full' }} title="Errors" description={
                        <VStack alignItems="flex-start" w='full' spacing={0}>
                            {
                                report.summary.errors.map((e: any, i: number) => <Text key={i}><b>{e.category}</b>: {e.message}</Text>)
                            }
                        </VStack>
                    } />
                }
                {
                    report.summary.warnings.length > 0 && <WarningMessage alertProps={{ w: 'full' }} title="Warnings" description={
                        <VStack alignItems="flex-start" w='full' spacing={0}>
                            {
                                report.summary.warnings.map((w: any, i: number) => <Text key={i}><b>{w.category}</b>: {w.message}</Text>)
                            }
                        </VStack>
                    } />
                }
                {
                    report.summary.info.length > 0 && <InfoMessage alertProps={{ w: 'full' }} title="Info" description={
                        <VStack alignItems="flex-start" w='full' spacing={0}>
                            {
                                report.summary.info.map((e: any, i: number) => <Text key={i}><b>{e.category}</b>: {e.message}</Text>)
                            }
                        </VStack>
                    } />
                }
            </> : <Text>Nothing to report</Text>
        }
    </VStack>
};