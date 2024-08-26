import { useState } from 'react';
import { Modal } from '@app/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { Autocomplete } from '@app/components/common/Input/Autocomplete';
import { AutocompleteItem, TemplateProposalFormActionFields, NetworkIds, ProposalTemplates } from '@app/types';
import { FunctionFragment } from 'ethers/lib/utils';
import { InfoMessage } from '@app/components/common/Messages';
import { TokenTemplate } from './templates/TokenTemplate';
import { AnchorBoolTemplate } from './templates/AnchorBoolTemplate';
import { getNetworkConfigConstants } from '@app/util/networks';
import { AnchorPercTemplate } from './templates/AnchorPercTemplate';
import { AnchorSupportMarketTemplate } from './templates/AnchorSupportMarkerTemplate';
import { AnchorOracleTemplate } from './templates/AnchorOracleTemplate';
import { DolaPayrollTemplate } from './templates/DolaPayrollTemplate';
import { XinvVestor } from './templates/XinvVestor';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';

type Props = {
    isOpen: boolean
    onClose: () => void
    onAddTemplate: (action: TemplateProposalFormActionFields) => void
}

const { INV, DOLA, DAI, TOKENS, DBR } = getNetworkConfigConstants(NetworkIds.mainnet)

const templates = [
    // tokens
    { label: 'INV: Send tokens', value: ProposalTemplates.invTransfer },
    { label: 'INV: Approve funding', value: ProposalTemplates.invApprove },
    { label: 'DOLA: Send tokens', value: ProposalTemplates.dolaTransfer },
    { label: 'DOLA: Approve funding', value: ProposalTemplates.dolaApprove },
    { label: 'DAI: Send tokens', value: ProposalTemplates.daiTransfer },
    { label: 'DAI: Approve funding', value: ProposalTemplates.daiApprove },
    { label: 'DBR: Send tokens', value: ProposalTemplates.dbrTransfer },
    { label: 'DBR: Approve funding', value: ProposalTemplates.dbrApprove },
    { label: 'Payroll: Add', value: ProposalTemplates.payrollAdd },
    { label: 'Payroll: Remove', value: ProposalTemplates.payrollRemove },
    { label: 'Vestor: Add', value: ProposalTemplates.vestorAdd },
    // anchor
    { label: 'Frontier: Toggle Supply', value: ProposalTemplates.anchorLending },
    { label: 'Frontier: Toggle Collateral (borrowing against)', value: ProposalTemplates.anchorCollateral },
    { label: 'Frontier: Toggle Borrow', value: ProposalTemplates.anchorBorrowing },
    { label: 'Frontier: Set Collateral Factor %', value: ProposalTemplates.anchorCollateralFactor },
    { label: 'Frontier: Add support to a market', value: ProposalTemplates.anchorSupportMarket },
    { label: 'Frontier: Set Oracle Feed', value: ProposalTemplates.anchorOracleFeed },
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
        setTemplate(undefined);
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
        [ProposalTemplates.dbrTransfer]: { comp: TokenTemplate, props: { token: TOKENS[DBR], type: 'transfer' } },
        [ProposalTemplates.dbrApprove]: { comp: TokenTemplate, props: { token: TOKENS[DBR], type: 'approve' } },
        [ProposalTemplates.payrollAdd]: { comp: DolaPayrollTemplate, props: { type: 'add' } },
        [ProposalTemplates.payrollRemove]: { comp: DolaPayrollTemplate, props: { type: 'remove' }  },
        [ProposalTemplates.vestorAdd]: { comp: XinvVestor },
        // anchor
        [ProposalTemplates.anchorLending]:  { comp: AnchorBoolTemplate, props: { type: ProposalTemplates.anchorLending } },
        [ProposalTemplates.anchorBorrowing]: { comp: AnchorBoolTemplate, props: { type: ProposalTemplates.anchorBorrowing } },
        [ProposalTemplates.anchorCollateral]: { comp: AnchorBoolTemplate, props: { type: ProposalTemplates.anchorCollateral } },
        [ProposalTemplates.anchorCollateralFactor]: { comp: AnchorPercTemplate, props: { type: ProposalTemplates.anchorCollateralFactor } },
        [ProposalTemplates.anchorSupportMarket]: { comp: AnchorSupportMarketTemplate },
        [ProposalTemplates.anchorOracleFeed]: { comp: AnchorOracleTemplate },
    }

    const chosenTemplate = templateComps[template?.value]
    const ChosenTemplateComp = chosenTemplate?.comp

    const handleClose = () => {
        setTemplate(undefined);
        onClose();
    }

    return (
        <Modal
            onClose={handleClose}
            isOpen={isOpen}
            scrollBehavior={'outside'}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Add a Common Proposal Action</Text>
                </Stack>
            }
            footer={
                <RSubmitButton disabled={isDisabled || !action} onClick={handleSubmit}>
                    ADD ACTION
                </RSubmitButton>
            }
        >
            <Stack spacing={'4'} p={'5'} height={'fit-content'} minH='200px' overflowY="visible">
                <Text>Template: </Text>
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