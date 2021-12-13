import { useState, useEffect, useRef } from 'react'
import { Flex, FormControl, FormLabel, Stack, Text, Box } from '@chakra-ui/react';
import { Textarea } from '@inverse/components/common/Input';
import { FunctionFragment } from 'ethers/lib/utils';
import { SubmitButton } from '@inverse/components/common/Button';
import { GovEra, Proposal, ProposalFormFields, ProposalStatus } from '@inverse/types';
import { ProposalInput } from './ProposalInput';
import { ProposalFormAction } from './ProposalFormAction';
import { getFunctionsFromProposalActions, submitProposal } from '@inverse/util/governance';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { handleTx } from '@inverse/util/transactions';
import { SuccessMessage } from '@inverse/components/common/Messages';
import { TEST_IDS } from '@inverse/config/test-ids';
import { ProposalActions, ProposalDetails } from '../Proposal';
import { ProposalWarningMessage } from './ProposalWarningMessage';
import { showToast } from '@inverse/util/notify';
import localforage from 'localforage';

const EMPTY_ACTION = {
    actionId: 0,
    contractAddress: '',
    func: '',
    args: [],
    value: '',
    fragment: undefined,
};

const PROPOSAL_WARNING_KEY = 'proposalWarningAgreed';

export const ProposalForm = ({ lastProposalId = 0 }: { lastProposalId: number }) => {
    const isMountedRef = useRef(true)
    const [isUnderstood, setIsUnderstood] = useState(true);
    const [hasSuccess, setHasSuccess] = useState(false);
    const { library, account } = useWeb3React<Web3Provider>()
    const [form, setForm] = useState<ProposalFormFields>({
        title: '',
        description: '',
        actions: [{ ...EMPTY_ACTION }],
    })
    const [isFormValid, setIsFormValid] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [actionLastId, setActionLastId] = useState(0);

    useEffect(() => {
        const init = async () => {
            const alreadyAggreed = await localforage.getItem(PROPOSAL_WARNING_KEY)
            if (!isMountedRef.current) { return }
            setIsUnderstood(!!alreadyAggreed)
        }
        init()
        return () => { isMountedRef.current = false }
    }, [])

    useEffect(() => {
        setIsFormValid(!isFormInvalid(form))
    }, [form])

    const handleFuncChange = (index: number, value: string) => {
        const newActions = [...form.actions];
        newActions[index].func = value;
        try {
            const fragment = FunctionFragment.from(value);
            const args: any = fragment.inputs.map(v => ({ type: v.type, value: '', name: v.name }));
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
        showToast({ status: 'error', title: 'Action Removed from proposal' })
    }

    const duplicateAction = (index: number) => {
        const actions = [...form.actions];
        const actionId = actionLastId + 1;
        setActionLastId(actionId)
        const toCopy = { ...actions[index], actionId: actionId };

        actions.splice(index + 1, 0, toCopy);

        setForm({ ...form, actions });
        showToast({ status: 'info', title: 'Action Duplicated', description: 'The duplicated action is just below the one copied' })
    }

    const actionSubForms = form.actions.map((action, i) => {
        return <ProposalFormAction
            key={action.actionId}
            action={action}
            index={i}
            onChange={(field: string, e: any) => handleActionChange(i, field, e)}
            onDelete={() => deleteAction(i)}
            onDuplicate={() => duplicateAction(i)}
            onFuncChange={(v) => handleFuncChange(i, v)}
        />
    })

    const addAction = () => {
        const actionId = actionLastId + 1;
        setActionLastId(actionId);
        setForm({ ...form, actions: form.actions.concat([{ ...EMPTY_ACTION, actionId }]) });
    }

    const isFormInvalid = ({ title, description, actions }: ProposalFormFields) => {
        if (title.length === 0) return true;
        if (description.length === 0) return true;
        if (actions.length === 0) return true;
        for (const action of actions) {
            if (action.contractAddress.length === 0) return true;
            if (action.func.length === 0) return true;
            if (action.fragment === undefined) return true;
            for (const arg of action.args) {
                if (arg.value.length === 0) return true;
            }
        }
        try {
            getFunctionsFromProposalActions(actions);
        } catch (e) {
            return true
        }
        return false;
    }

    const handleSubmitProposal = async () => {
        if (!library?.getSigner()) { return }
        const tx = await submitProposal(library?.getSigner(), form);
        return handleTx(tx, { onSuccess: () => setHasSuccess(true) });
    }

    const warningUnderstood = () => {
        setIsUnderstood(true)
        localforage.setItem(PROPOSAL_WARNING_KEY, true)
    }

    const preview: Partial<Proposal> = isFormValid && previewMode ? {
        id: lastProposalId + 1,
        title: form.title,
        description: form.description,
        functions: getFunctionsFromProposalActions(form.actions),
        proposer: account || '',
        era: GovEra.mils,
        startTimestamp: Date.now(),
        status: ProposalStatus.active,
    } : {}

    return (
        <Stack color="white" spacing="4" direction="column" w="full" data-testid={TEST_IDS.governance.newProposalFormContainer}>
            {previewMode ? <Text textAlign="center">Preview / Recap</Text> : null}
            {
                !isUnderstood ?
                    <ProposalWarningMessage onOk={() => warningUnderstood()} /> : null
            }
            {
                previewMode ?
                    <Flex direction="column" textAlign="left">
                        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                            <ProposalDetails proposal={preview} />
                        </Flex>
                        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                            <ProposalActions proposal={preview} />
                        </Flex>
                    </Flex>
                    :
                    <>
                        <Box bgColor="purple.750" borderRadius="5" p="4" color="white">
                            <FormControl>
                                <FormLabel>Title</FormLabel>
                                <ProposalInput onChange={(e) => handleChange('title', e)} value={form.title} fontSize="14" placeholder="Proposal's title" />
                            </FormControl>
                            <FormControl mt="2">
                                <FormLabel>Details</FormLabel>
                                <Textarea onChange={(e: any) => handleChange('description', e)} value={form.description} fontSize="14" placeholder="Proposal's description and summary of main actions" />
                            </FormControl>
                        </Box>
                        {
                            form.title && form.description ? actionSubForms : null
                        }
                    </>
            }
            <Flex justify="center" pt="5">
                {
                    hasSuccess ?
                        <SuccessMessage description="Your proposal has been created ! It may take some time to appear" />
                        :
                        !previewMode ?
                            <>
                                <SubmitButton disabled={form.actions.length === 20} mr="1" w="fit-content" onClick={addAction}>
                                    {form.actions.length === 20 ? 'Max number of actions reached' : 'Add an Action'}
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
        </Stack>
    )
}