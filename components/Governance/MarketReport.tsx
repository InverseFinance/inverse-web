import { VStack, Text, useDisclosure, HStack, Flex, Popover, PopoverTrigger, PopoverContent, PopoverBody, useClipboard } from "@chakra-ui/react";
import { ErrorMessage, InfoMessage, WarningMessage } from "../common/Messages";
import { MarketNameAndIcon } from "../F2/F2Markets";
import { TOKENS } from "@app/variables/tokens";
import SimpleModal from "../common/Modal/SimpleModal";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { formatJsonToHtml } from "@app/util/misc";
import { SubmitButton } from "../common/Button";
import { CopyIcon } from "@chakra-ui/icons";
import { useMemo, useState } from "react";
import { ROutlineButton } from "../common/Button/RSubmitButton";

const titleProps = { textAlign: 'left', fontSize: '18px', fontWeight: 'extrabold' }

export const MarketReport = ({ market, marketAddress, report }: { market: any, marketAddress: string, report: any }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const stringJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
    const { hasCopied, onCopy } = useClipboard(stringJson);
    const anythingToReport = report.summary.warnings.length > 0 || report.summary.errors.length > 0 || report.summary.info.length > 0;
    return <VStack w='full' alignItems='flex-start'>
        <ErrorBoundary description={"Error loading market report"}>
            <>
                <SimpleModal modalProps={{ size: '2xl' }} isOpen={isOpen} onClose={onClose} title={market?.name || marketAddress}>
                    <VStack p="4" w='full' alignItems='flex-start'>
                        <Popover isOpen={hasCopied} isLazy={true} placement="bottom">
                            <PopoverTrigger>
                                <SubmitButton onClick={() => {
                                    onCopy();
                                }}>Copy as JSON to clipboard <CopyIcon ml="1" /></SubmitButton>
                            </PopoverTrigger>
                            <PopoverContent fontSize="14px" width="fit-content" p="1" className="blurred-container info-bg">
                                <PopoverBody>
                                    <b>Copied as JSON!</b>
                                </PopoverBody>
                            </PopoverContent>
                        </Popover>
                        <Flex w="full" overflowX="auto" direction="column" bgColor="primary.850" borderRadius={8} p={3}>
                            <div dangerouslySetInnerHTML={{ __html: formatJsonToHtml(report) }} />
                        </Flex>
                    </VStack>
                </SimpleModal>
                <HStack w="full" cursor="pointer" onClick={onOpen} justify='space-between'>
                    {
                        market?.name ? <MarketNameAndIcon name={market.name} icon={TOKENS[market.collateral]?.image} underlying={TOKENS[market.collateral]} /> : <Text fontSize='lg' fontWeight='bold'>{marketAddress}</Text>
                    }
                    <ROutlineButton w='fit-content' px="2" py="0" h="24px" fontSize="12px" textTransform="capitalize" onClick={onOpen}>See Details</ROutlineButton>
                </HStack>
                {
                    anythingToReport ? <>
                        {
                            report.summary.errors.length > 0 && <ErrorMessage alertTitleProps={titleProps} alertProps={{ w: 'full' }} title="Errors" description={
                                <VStack alignItems="flex-start" w='full' spacing={0}>
                                    {
                                        report.summary.errors.map((e: any, i: number) => <Text textAlign="left" key={i}><b>{e.category}</b>: {e.message}</Text>)
                                    }
                                </VStack>
                            } />
                        }
                        {
                            report.summary.warnings.length > 0 && <WarningMessage alertTitleProps={titleProps} alertProps={{ w: 'full' }} title="Warnings" description={
                                <VStack alignItems="flex-start" w='full' spacing={0}>
                                    {
                                        report.summary.warnings.map((w: any, i: number) => <Text color="mainTextColorLight2" textAlign="left" key={i}><b>{w.category}</b>: {w.message}</Text>)
                                    }
                                </VStack>
                            } />
                        }
                        {
                            report.summary.info.length > 0 && <InfoMessage alertTitleProps={titleProps} alertProps={{ w: 'full' }} title="Info" description={
                                <VStack alignItems="flex-start" w='full' spacing={0}>
                                    {
                                        report.summary.info.map((e: any, i: number) => <Text textAlign="left" key={i}><b>{e.category}</b>: {e.message}</Text>)
                                    }
                                </VStack>
                            } />
                        }
                    </> : <Text>Nothing to report</Text>
                }
            </>
        </ErrorBoundary>
    </VStack>
};