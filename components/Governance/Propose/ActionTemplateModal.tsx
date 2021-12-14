import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { AutocompleteItem, TemplateProposalFormActionFields, NetworkIds } from '@inverse/types';
import { FunctionFragment } from 'ethers/lib/utils';
import { InfoMessage } from '@inverse/components/common/Messages';
import { TokenTemplate } from './templates/TokenTemplate';
import { AnchorTemplate } from './templates/AnchorTemplate';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { SubmitButton } from '@inverse/components/common/Button';

type Props = {
    isOpen: boolean
    onClose: () => void
    onAddTemplate: (action: TemplateProposalFormActionFields) => void
}

enum TemplateValues {
    invTransfer = 'invTransfer',
    invApprove = 'invApprove',
    dolaTransfer = 'dolaTransfer',
    dolaApprove = 'dolaApprove',
    daiTransfer = 'daiTransfer',
    daiApprove = 'daiApprove',
    anchorLending = 'anchorLending',
    anchorBorrowing = 'anchorBorrowing',
}

const { INV, DOLA, DAI, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet)

const templates = [
    // tokens
    { label: 'INV: Send tokens', value: TemplateValues.invTransfer },
    { label: 'INV: Approve funding', value: TemplateValues.invApprove },
    { label: 'DOLA: Send tokens', value: TemplateValues.dolaTransfer },
    { label: 'DOLA: Approve funding', value: TemplateValues.dolaApprove },
    { label: 'DAI: Send tokens', value: TemplateValues.daiTransfer },
    { label: 'DAI: Approve funding', value: TemplateValues.daiApprove },
    // anchor
    { label: 'Anchor: Toggle Supplying for a market', value: TemplateValues.anchorLending },
    { label: 'Anchor: Toggle Borrowing for a market', value: TemplateValues.anchorBorrowing },
]

export const ActionTemplateModal = ({ onClose, isOpen, onAddTemplate }: Props) => {
    const [template, setTemplate] = useState<AutocompleteItem | undefined>(undefined);
    const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);

    const handleSelect = (item: AutocompleteItem | undefined) => {
        setTemplate(item);
    }

    const handleSubmit = () => {
        onAddTemplate({
            ...action!,
            fragment: FunctionFragment.from(action?.func!),
        })
    }

    const commonProps = {
        onDisabledChange: setIsDisabled, 
        onActionChange: setAction, 
    }

    const templateComps = {
        [TemplateValues.invTransfer]: { comp: TokenTemplate, props: { token: TOKENS[INV], type: 'transfer' } },
        [TemplateValues.invApprove]: { comp: TokenTemplate, props: { token: TOKENS[INV], type: 'approve' } },
        [TemplateValues.dolaTransfer]: { comp: TokenTemplate, props: { token: TOKENS[DOLA], type: 'transfer' } },
        [TemplateValues.dolaApprove]: { comp: TokenTemplate, props: { token: TOKENS[DOLA], type: 'approve' } },
        [TemplateValues.daiTransfer]: { comp: TokenTemplate, props: { token: TOKENS[DAI], type: 'transfer' } },
        [TemplateValues.daiApprove]: { comp: TokenTemplate, props: { token: TOKENS[DAI], type: 'approve' } },
        // anchor
        [TemplateValues.anchorLending]:  { comp: AnchorTemplate, props: { type: '_setMintPaused' } },
        [TemplateValues.anchorBorrowing]: { comp: AnchorTemplate, props: { type: '_setBorrowPaused' } },
    }

    const chosenTemplate = templateComps[template?.value]
    const ChosenTemplateComp = chosenTemplate?.comp

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Add a Common Proposal Action</Text>
                </Stack>
            }
            footer={
                <SubmitButton disabled={isDisabled || !action} onClick={handleSubmit}>
                    ADD ACTION
                </SubmitButton>
            }
        >
            <Stack spacing={'4'} p={'5'} height={'fit-content'} minH='300px' overflowY="visible">
                <Text>Template : </Text>
                <Autocomplete
                    inputProps={{ autoFocus: true }}
                    isOpenDefault={true}
                    title="Common Proposal Actions :"
                    list={templates}
                    onItemSelect={handleSelect}
                />
                {
                    template?.value ?
                        <ChosenTemplateComp onSubmit={handleSubmit} {...commonProps} {...chosenTemplate.props} /> :
                        <InfoMessage alertProps={{ w: 'full' }} description="Choose a template above" />
                }
            </Stack>
        </Modal>
    )
}