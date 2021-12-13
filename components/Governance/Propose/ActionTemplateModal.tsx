import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { AutocompleteItem, TemplateProposalFormActionFields } from '@inverse/types';
import { InvCompTemplate } from './templates/InvCompTemplate';
import { FunctionFragment } from 'ethers/lib/utils';

type Props = {
    isOpen: boolean
    onClose: () => void
    onAddTemplate: (action: TemplateProposalFormActionFields) => void
}

enum TemplateValues {
    invComp = 'invComp',
    anchorLending = 'invComp',
    anchorBorrowing = 'invComp',
}

const templates = [
    { label: 'INV: Send tokens', value: TemplateValues.invComp },
    // { label: 'Anchor: Toggle Supplying', value: TemplateValues.anchorLending },
    // { label: 'Anchor: Toggle Borrowing', value: TemplateValues.anchorBorrowing },
]

export const ActionTemplateModal = ({ onClose, isOpen, onAddTemplate }: Props) => {
    const [template, setTemplate] = useState<AutocompleteItem | undefined>(undefined);
    // const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);

    const handleSelect = (item: AutocompleteItem | undefined) => {
        setTemplate(item);
    }

    const handleSubmit = (action: TemplateProposalFormActionFields) => {
        onAddTemplate({ ...action!, fragment: FunctionFragment.from(action?.func!) })
    }

    const templateComps = {
        [TemplateValues.invComp]: InvCompTemplate,
        // [TemplateValues.anchorLending]: null,
        // [TemplateValues.anchorBorrowing]: null,
    }

    const ChosenTemplate = templateComps[template?.value]

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Add a Standard action using a Template</Text>
                </Stack>
            }
        >
            <Stack p={'5'} height={'fit-content'} minH='300px' overflowY="auto">
                <Text>Template : </Text>
                <Autocomplete
                    title="Standard actions"
                    list={templates}
                    onItemSelect={handleSelect}
                />

                {
                    template?.value ?
                        <ChosenTemplate onSubmit={handleSubmit} /> : null}
            </Stack>
        </Modal>
    )
}