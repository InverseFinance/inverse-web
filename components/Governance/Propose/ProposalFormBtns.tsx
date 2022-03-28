import { SubmitButton } from '@app/components/common/Button';
import { Flex } from '@chakra-ui/react';
import { SuccessMessage } from '@app/components/common/Messages';
import { PlusSquareIcon, ViewIcon, EditIcon, CheckIcon, CheckCircleIcon, DeleteIcon, HamburgerIcon } from '@chakra-ui/icons';

export const ProposalFormBtns = ({
    hasTitleAndDescrption,
    hasSuccess,
    previewMode,
    isFormValid,
    isPublicDraft,
    nbActions,
    draftId,
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
                            <>
                                {
                                    nbActions < 20 ?
                                        <SubmitButton disabled={nbActions === 20 || !hasTitleAndDescrption} mr="1" w="fit-content" onClick={showTemplateModal}>
                                            <PlusSquareIcon mr="1" /> Add a Template Action
                                        </SubmitButton>
                                        : null
                                }
                                <SubmitButton disabled={nbActions === 20 || !hasTitleAndDescrption} ml="1" mr="1" w="fit-content" onClick={() => addAction()}>
                                    <PlusSquareIcon mr="1" /> {nbActions === 20 ? 'Max number of actions reached' : 'Add an Empty Action'}
                                </SubmitButton>

                                <SubmitButton themeColor="green.500" disabled={!isFormValid} ml="1" w="fit-content" onClick={() => setPreviewMode(true)}>
                                    <ViewIcon mr="1" /> Preview Proposal
                                </SubmitButton>
                            </>
                            :
                            <>
                                <SubmitButton mr="1" w="fit-content" onClick={() => setPreviewMode(false)}>
                                    <EditIcon mr="1" />Resume Editing
                                </SubmitButton>

                                <SubmitButton disabled={!isFormValid} ml="1" w="fit-content" onClick={handlePublishDraft}>
                                    <CheckIcon mr="1" /> {isPublicDraft && draftId ? 'Update' : 'Publish'} the Draft
                                </SubmitButton>

                                <SubmitButton themeColor="blue.500" disabled={!isFormValid || !nbActions} ml="2" w="fit-content" onClick={handleSimulation}>
                                    <HamburgerIcon mr="1" /> Simulate Actions
                                </SubmitButton>

                                <SubmitButton themeColor="green.500" disabled={!isFormValid || !nbActions} ml="2" w="fit-content" onClick={handleSubmitProposal}>
                                    <CheckCircleIcon mr="1" /> Submit the Proposal
                                </SubmitButton>
                            </>
                }
            </Flex>
            {
                previewMode && isPublicDraft && !!draftId && <Flex alignItems="center" justify="center" w="full" pt="10">
                    <SubmitButton themeColor="red.500" w="fit-content" onClick={handleDeleteDraft}>
                        <DeleteIcon mr="1" /> Delete the Draft
                    </SubmitButton>
                </Flex>
            }
        </>
    )
}