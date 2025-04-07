import { Flex, Stack } from '@chakra-ui/react';
import { SuccessMessage } from '@app/components/common/Messages';
import { PlusSquareIcon, ViewIcon, EditIcon, CheckIcon, CheckCircleIcon, DeleteIcon, HamburgerIcon, ExternalLinkIcon, LinkIcon } from '@chakra-ui/icons';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';
import Link from '@app/components/common/Link';
import { MarketReport } from '../MarketReport';

export const ProposalFormBtns = ({
    hasTitleAndDescrption,
    hasSuccess,
    previewMode,
    isFormValid,
    isPublicDraft,
    nbActions,
    draftId,
    simulationUrl,
    positionsUrl,
    marketsReports,
    handleLinkAndDelete,
    handleSubmitProposal,
    handlePublishDraft,
    handleDeleteDraft,
    setPreviewMode,
    showTemplateModal,
    handleSimulation,
    addAction,
}: {
    hasTitleAndDescrption: boolean,
    hasSuccess: boolean,
    previewMode: boolean,
    isFormValid: boolean,
    isPublicDraft?: boolean,
    nbActions: number,
    draftId?: number,
    simulationUrl: string,
    positionsUrl: string,
    marketsReports: any[],
    handleLinkAndDelete: () => void,
    handleSubmitProposal: () => void,
    handlePublishDraft: () => void,
    handleDeleteDraft: () => void,
    setPreviewMode: (v: boolean) => void,
    showTemplateModal: () => void,
    handleSimulation: () => void,
    addAction: () => void,
}) => {
    return (
        <>
            <Flex justify="center" pt="5">
                {
                    hasSuccess ?
                        <SuccessMessage description="Your proposal has been created ! It may take some time to appear" />
                        :
                        !previewMode ?
                            <Stack direction={{ base: 'column', sm: 'row' }}>
                                {
                                    nbActions < 20 ?
                                        <RSubmitButton disabled={nbActions === 20 || !hasTitleAndDescrption} mr="1" w={{ base: 'full', sm: 'fit-content' }} onClick={showTemplateModal}>
                                            <PlusSquareIcon mr="1" /> Add a Template Action
                                        </RSubmitButton>
                                        : null
                                }
                                <RSubmitButton disabled={nbActions === 20 || !hasTitleAndDescrption} ml="1" mr="1" w={{ base: 'full', sm: 'fit-content' }} onClick={() => addAction()}>
                                    <PlusSquareIcon mr="1" /> {nbActions === 20 ? 'Max number of actions reached' : 'Add an Empty Action'}
                                </RSubmitButton>

                                <RSubmitButton themeColor="green.500" disabled={!isFormValid} ml="1" w={{ base: 'full', sm: 'fit-content' }} onClick={() => setPreviewMode(true)}>
                                    <ViewIcon mr="1" /> Preview Proposal
                                </RSubmitButton>
                            </Stack>
                            :
                            <Stack direction={{ base: 'column', sm: 'row' }}>
                                <RSubmitButton mr="1" w={{ base: 'full', sm: 'fit-content' }} onClick={() => setPreviewMode(false)}>
                                    <EditIcon mr="1" />Resume Editing
                                </RSubmitButton>

                                <RSubmitButton disabled={!isFormValid} ml="1" w={{ base: 'full', sm: 'fit-content' }} onClick={handlePublishDraft}>
                                    <CheckIcon mr="1" /> {isPublicDraft && draftId ? 'Update' : 'Publish'} the Draft
                                </RSubmitButton>

                                <RSubmitButton themeColor="blue.500" disabled={!isFormValid || !nbActions} ml="2" w={{ base: 'full', sm: 'fit-content' }} onClick={handleSimulation}>
                                    <HamburgerIcon mr="1" /> Simulate Actions
                                </RSubmitButton>

                                <RSubmitButton themeColor="green.500" disabled={!isFormValid || !nbActions} ml="2" w={{ base: 'full', sm: 'fit-content' }} onClick={handleSubmitProposal}>
                                    <CheckCircleIcon mr="1" /> Submit the Proposal
                                </RSubmitButton>
                            </Stack>
                }
            </Flex>
            {previewMode && !!simulationUrl && <Link textDecoration="underline" href={simulationUrl} target="_blank" isExternal>
                Simulation link <ExternalLinkIcon ml="1" />
            </Link>}
            {previewMode && !!positionsUrl && <Link textDecoration="underline" href={positionsUrl} target="_blank" isExternal>
                Sim Positions <ExternalLinkIcon ml="1" />
            </Link>}
            {
                marketsReports?.length > 0 && <Stack spacing="4" w='full' direction="column">
                    {
                        marketsReports.map((report, i) => <MarketReport key={i} market={report.market} marketAddress={report.marketAddress} report={report.report} />)
                    }
                </Stack>
            }
            {
                previewMode && isPublicDraft && !!draftId && <Flex alignItems="center" justify="center" w="full" pt="10">
                    <RSubmitButton mr='4' themeColor="red.500" w={{ base: 'full', sm: 'fit-content' }} onClick={handleDeleteDraft}>
                        <DeleteIcon mr="1" /> Delete the Draft
                    </RSubmitButton>
                    <RSubmitButton themeColor="orange.500" w={{ base: 'full', sm: 'fit-content' }} onClick={handleLinkAndDelete}>
                        <LinkIcon mr="1" /> Link reviews & delete draft
                    </RSubmitButton>
                </Flex>
            }
        </>
    )
}