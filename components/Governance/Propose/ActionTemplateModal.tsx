import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { AutocompleteItem, TemplateProposalFormActionFields, NetworkIds, ProposalTemplates } from '@inverse/types';
import { FunctionFragment } from 'ethers/lib/utils';
import { InfoMessage } from '@inverse/components/common/Messages';
import { TokenTemplate } from './templates/TokenTemplate';
import { AnchorBoolTemplate } from './templates/AnchorBoolTemplate';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { SubmitButton } from '@inverse/components/common/Button';
import { AnchorPercTemplate } from './templates/AnchorPercTemplate';
import { AnchorSupportMarketTemplate } from './templates/AnchorSupportMarkerTemplate';
import { AnchorOracleTemplate } from './templates/AnchorOracleTemplate';
import { DolaPayrollTemplate } from './templates/DolaPayrollTemplate';

type Props = {
    isOpen: boolean
    onClose: () => void
    onAddTemplate: (action: TemplateProposalFormActionFields) => void
}

const { INV, DOLA, DAI, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet)

const templates = [
    // tokens
    { label: 'INV: Send tokens', value: ProposalTemplates.invTransfer },
    { label: 'INV: Approve funding', value: ProposalTemplates.invApprove },
    { label: 'DOLA: Send tokens', value: ProposalTemplates.dolaTransfer },
    { label: 'DOLA: Approve funding', value: ProposalTemplates.dolaApprove },
    { label: 'DAI: Send tokens', value: ProposalTemplates.daiTransfer },
    { label: 'DAI: Approve funding', value: ProposalTemplates.daiApprove },
    { label: 'Payroll: Add', value: ProposalTemplates.payrollAdd },
    { label: 'Payroll: Remove', value: ProposalTemplates.payrollRemove },
    // anchor
    { label: 'Anchor: Toggle Supply', value: ProposalTemplates.anchorLending },
    { label: 'Anchor: Toggle Borrow', value: ProposalTemplates.anchorBorrowing },
    { label: 'Anchor: Set Collateral Factor %', value: ProposalTemplates.anchorCollateralFactor },
    { label: 'Anchor: Add support to a market', value: ProposalTemplates.anchorSupportMarket },
    { label: 'Anchor: Set Oracle Feed', value: ProposalTemplates.anchorOracleFeed },
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
        [ProposalTemplates.invTransfer]: { comp: TokenTemplate, props: { token: TOKENS[INV], type: 'transfer' } },
        [ProposalTemplates.invApprove]: { comp: TokenTemplate, props: { token: TOKENS[INV], type: 'approve' } },
        [ProposalTemplates.dolaTransfer]: { comp: TokenTemplate, props: { token: TOKENS[DOLA], type: 'transfer' } },
        [ProposalTemplates.dolaApprove]: { comp: TokenTemplate, props: { token: TOKENS[DOLA], type: 'approve' } },
        [ProposalTemplates.daiTransfer]: { comp: TokenTemplate, props: { token: TOKENS[DAI], type: 'transfer' } },
        [ProposalTemplates.daiApprove]: { comp: TokenTemplate, props: { token: TOKENS[DAI], type: 'approve' } },
        [ProposalTemplates.payrollAdd]: { comp: DolaPayrollTemplate, props: { type: 'add' } },
        [ProposalTemplates.payrollRemove]: { comp: DolaPayrollTemplate, props: { type: 'remove' }  },
        // anchor
        [ProposalTemplates.anchorLending]:  { comp: AnchorBoolTemplate, props: { type: ProposalTemplates.anchorLending } },
        [ProposalTemplates.anchorBorrowing]: { comp: AnchorBoolTemplate, props: { type: ProposalTemplates.anchorBorrowing } },
        [ProposalTemplates.anchorCollateralFactor]: { comp: AnchorPercTemplate, props: { type: ProposalTemplates.anchorCollateralFactor } },
        [ProposalTemplates.anchorSupportMarket]: { comp: AnchorSupportMarketTemplate },
        [ProposalTemplates.anchorOracleFeed]: { comp: AnchorOracleTemplate },
    }

    const chosenTemplate = templateComps[template?.value]
    const ChosenTemplateComp = chosenTemplate?.comp

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior={'outside'}
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
            <Stack spacing={'4'} p={'5'} height={'fit-content'} minH='200px' overflowY="visible">
                <Text>Template : </Text>
                <Autocomplete
                    inputProps={{ autoFocus: true }}
                    isOpenDefault={true}
                    title="Common Proposal Actions :"
                    list={templates}
                    onItemSelect={handleSelect}
                    highlightBeforeChar=":"
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