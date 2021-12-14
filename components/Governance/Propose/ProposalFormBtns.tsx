import { SubmitButton } from '@inverse/components/common/Button';
import { Flex } from '@chakra-ui/react';
import { SuccessMessage } from '@inverse/components/common/Messages';

export const ProposalFormBtns = ({
    hasTitleAndDescrption,
    hasSuccess,
    previewMode,
    isFormValid,
    nbActions,
    handleSubmitProposal,
    setPreviewMode,
    showTemplateModal,
    addAction,
}: {
    hasTitleAndDescrption: boolean,
    hasSuccess: boolean,
    previewMode: boolean,
    isFormValid: boolean,
    nbActions: number,
    handleSubmitProposal: () => void,
    setPreviewMode: (v: boolean) => void,
    showTemplateModal: () => void,
    addAction: () => void,
}) => {
    return (
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
                                            Add a Template Action
                                        </SubmitButton>
                                        : null
                                }
                                <SubmitButton disabled={ nbActions === 20 || !hasTitleAndDescrption} mr="1" w="fit-content" onClick={() => addAction()}>
                                    { nbActions === 20 ? 'Max number of actions reached' : 'Add an Empty Action'}
                                </SubmitButton>
                                <SubmitButton disabled={!isFormValid} ml="1" w="fit-content" onClick={() => setPreviewMode(true)}>
                                    Preview Proposal
                                </SubmitButton>
                            </>
                            :
                            <>
                                <SubmitButton mr="1" w="fit-content" onClick={() => setPreviewMode(false)}>
                                    Resume Editing
                                </SubmitButton>
                                <SubmitButton disabled={!isFormValid} ml="1" w="fit-content" onClick={handleSubmitProposal}>
                                    Submit the Proposal
                                </SubmitButton>
                            </>
                }
            </Flex>
    )
}