import { useState, useEffect } from 'react'
import { Flex, FormControl, FormLabel, Stack } from '@chakra-ui/react';
import { Textarea } from '@inverse/components/common/Input';
import { FunctionFragment } from 'ethers/lib/utils';
import { SubmitButton } from '@inverse/components/common/Button';
import { ProposalFormFields } from '@inverse/types';
import { ProposalInput } from './ProposalInput';
import { ProposalFormAction } from './ProposalFormAction';
import { submitProposal } from '@inverse/util/governance';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { handleTx } from '@inverse/util/transactions';
import { InfoMessage, Message, SuccessMessage } from '@inverse/components/common/Messages';

const EMPTY_ACTION = {
    contractAddress: '',
    func: '',
    args: [],
    value: 0,
    fragment: undefined,
};

export const ProposalForm = () => {
    const [hasSuccess, setHasSuccess] = useState(false);
    const { library } = useWeb3React<Web3Provider>()
    const [form, setForm] = useState<ProposalFormFields>({
        title: '',
        description: '',
        actions: [{ ...EMPTY_ACTION }],
    })
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        setIsFormValid(!isFormInvalid(form))
    }, [form])

    const handleFuncChange = (index: number, value: string) => {
        const newActions = [...form.actions];
        newActions[index].func = value;
        try {
            const fragment = FunctionFragment.from(value);
            const args: any = fragment.inputs.map(v => ({ type: v.type, value: '' }));
            newActions[index] = { ...newActions[index], args, fragment };
        } catch {
            newActions[index] = { ...newActions[index], args: [], fragment: undefined }
        }
        setForm({ ...form, actions: newActions });
    }

    const handleChange = (field: string, e: any) => {
        setForm({ ...form, [field]: e.target.value })
    }

    const handleActionChange = (index: number, field: string, value: string) => {
        const newActions = [...form.actions];
        newActions[index] = { ...newActions[index], [field]: value };
        setForm({ ...form, actions: newActions });
    }

    const deleteAction = (index: number) => {
        const actions = [...form.actions];
        actions.splice(index, 1);
        setForm({ ...form, actions });
    }

    const actionSubForms = form.actions.map((action, i) => {
        return <ProposalFormAction
            key={i}
            action={action}
            index={i}
            onChange={(field: string, e: any) => handleActionChange(i, field, e)}
            onDelete={() => deleteAction(i)}
            onFuncChange={(e) => handleFuncChange(i, e.currentTarget.value)}
        />
    })

    const addAction = () => {
        setForm({ ...form, actions: form.actions.concat([{ ...EMPTY_ACTION }]) });
    }

    const isFormInvalid = ({ title, description, actions }: ProposalFormFields) => {
        if (title.length === 0) return true;
        if (description.length === 0) return true;
        for (const action of actions) {
            if (action.contractAddress.length === 0) return true;
            if (action.func.length === 0) return true;
            if (action.fragment === undefined) return true;
            for (const arg of action.args) {
                if (arg.value.length === 0) return true;
            }
        }
        return false;
    }

    const handleSubmitProposal = async () => {
        if (!library?.getSigner()) { return }
        const tx = await submitProposal(library?.getSigner(), form);
        return handleTx(tx, { onSuccess: () => setHasSuccess(true) });
    }

    return (
        <Stack direction="column" w="full">
            <FormControl>
                <FormLabel>Title</FormLabel>
                <ProposalInput onChange={(e) => handleChange('title', e)} value={form.title} fontSize="14" placeholder="Proposal's title" />
            </FormControl>
            <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea onChange={(e: any) => handleChange('description', e)} value={form.description} fontSize="14" placeholder="Proposal's description and summary of main actions" />
            </FormControl>
            {actionSubForms}
            <Flex justify="center" pt="5">
                {
                    hasSuccess ?
                        <SuccessMessage description="Your proposal has been created ! It may take some time to appear" />
                        :
                        <>
                            <SubmitButton disabled={form.actions.length === 20} mr="1" w="fit-content" onClick={addAction}>
                                { form.actions.length === 20 ? 'Max number of actions reached' : 'Add an Action' }
                            </SubmitButton>
                            <SubmitButton disabled={!isFormValid} ml="1" w="fit-content" onClick={handleSubmitProposal}>
                                Submit the Proposal
                            </SubmitButton>
                        </>
                }
            </Flex>
        </Stack>
    )
}