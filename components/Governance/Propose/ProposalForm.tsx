import { useState, useEffect, useRef } from 'react'
import { Flex, FormControl, FormLabel, Stack, Text, Box, useDisclosure } from '@chakra-ui/react';
import { Textarea } from '@inverse/components/common/Input';
import { FunctionFragment } from 'ethers/lib/utils';
import { GovEra, Proposal, ProposalFormFields, ProposalStatus, TemplateProposalFormActionFields } from '@inverse/types';
import { ProposalInput } from './ProposalInput';
import { ProposalFormAction } from './ProposalFormAction';
import { getFunctionsFromProposalActions, getProposalActionFromFunction, isProposalActionInvalid, isProposalFormInvalid, publishDraft, submitProposal } from '@inverse/util/governance';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { handleTx } from '@inverse/util/transactions';
import { TEST_IDS } from '@inverse/config/test-ids';
import { ProposalActions, ProposalDetails } from '../Proposal';
import { ProposalWarningMessage } from './ProposalWarningMessage';
import { showToast } from '@inverse/util/notify';
import localforage from 'localforage';
import { ActionTemplateModal } from './ActionTemplateModal';
import { ProposalFormBtns } from './ProposalFormBtns';
import { ProposalFunction } from '@inverse/types';
import { ProposalShareLink } from '../ProposalShareLink';
import { ProposalFloatingPreviewBtn } from './ProposalFloatingPreviewBtn';
import { useRouter } from 'next/dist/client/router';

const EMPTY_ACTION = {
    actionId: 0,
    contractAddress: '',
    func: '',
    args: [],
    value: '',
    fragment: undefined,
};

const PROPOSAL_WARNING_KEY = 'proposalWarningAgreed';

const DEFAULT_FUNCTIONS: ProposalFunction[] = []

export const ProposalForm = ({
    lastProposalId = 0,
    title = '',
    description = '',
    draftId,
    functions = DEFAULT_FUNCTIONS,
    isPreview = false,
    isPublicDraft = false,
}: {
    lastProposalId: number,
    title?: string,
    description?: string,
    draftId?: number,
    functions?: ProposalFunction[]
    isPreview?: boolean
    isPublicDraft?: boolean
}) => {
    const router = useRouter()
    const isMountedRef = useRef(true)
    const [isUnderstood, setIsUnderstood] = useState(true);
    const [hasSuccess, setHasSuccess] = useState(false);
    const { library, account } = useWeb3React<Web3Provider>()
    const [form, setForm] = useState<ProposalFormFields>({
        title,
        description,
        actions: functions.map((f, i) => getProposalActionFromFunction(i + 1, f)),
    })

    const [isFormValid, setIsFormValid] = useState(!isProposalFormInvalid(form));
    const [previewMode, setPreviewMode] = useState(isPreview);
    const [actionLastId, setActionLastId] = useState(form.actions.length);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newDraftId, setNewDraftId] = useState(draftId)

    useEffect(() => {
        const actions = functions.map((f, i) => getProposalActionFromFunction(i + 1, f));
        const validFormGiven = !isProposalFormInvalid({ title, description, actions });
        if (!validFormGiven) { return }
        setForm({
            title,
            description,
            actions,
        })
        setActionLastId(functions.length)
        setIsFormValid(validFormGiven)
        setPreviewMode(validFormGiven && isPreview)
    }, [title, description, functions, isPreview])

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
        setIsFormValid(!isProposalFormInvalid(form))
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

    const addAction = (action: TemplateProposalFormActionFields = EMPTY_ACTION, collapsed = false) => {
        const actionId = actionLastId + 1;
        setActionLastId(actionId);
        setForm({
            ...form,
            actions: form.actions.concat([{
                ...action,
                actionId,
                collapsed,
            }])
        });
    }

    const handleSubmitProposal = async () => {
        if (!library?.getSigner()) { return }
        const tx = await submitProposal(library?.getSigner(), form);
        return handleTx(tx, { onSuccess: () => setHasSuccess(true) });
    }

    const handlePublishDraft = async () => {
        if (!library?.getSigner()) {
            showToast({ description: 'Not connected', status: 'info' });
            return;
        }
        const functions = getFunctionsFromProposalActions(form.actions.filter(a => !isProposalActionInvalid(a)))
        return publishDraft(
            form.title,
            form.description,
            functions,
            library?.getSigner(),
            isPublicDraft ? draftId : undefined,
            (newId) => {
                if (newId) {
                    router.push( '/governance/drafts/' + newId)
                }
            })
    }

    const warningUnderstood = () => {
        setIsUnderstood(true)
        localforage.setItem(PROPOSAL_WARNING_KEY, true)
    }

    const showTemplateModal = () => {
        onOpen()
    }

    const handleAddTemplate = (action: TemplateProposalFormActionFields) => {
        addAction(action, true)
        onClose()
    }

    const now = new Date()

    const preview: Partial<Proposal> = previewMode ? {
        id: lastProposalId + 1,
        title: form.title,
        description: form.description,
        functions: getFunctionsFromProposalActions(form.actions.filter(a => !isProposalActionInvalid(a))),
        proposer: account || '',
        era: GovEra.mills,
        startTimestamp: now,
        endTimestamp: (new Date()).setDate(now.getDate() + 3),
        status: title ? ProposalStatus.draft : ProposalStatus.active,
    } : {}

    return (
        <Stack color="white" spacing="4" direction="column" w="full" data-testid={TEST_IDS.governance.newProposalFormContainer}>
            <ProposalFloatingPreviewBtn onChange={() => setPreviewMode(!previewMode)} isEnabled={previewMode} />
            {
                previewMode && <Flex alignItems="center" justify="center">
                    <Text textAlign="center" display="inline-block">
                        Preview / Recap
                    </Text>
                    <ProposalShareLink
                        onSaveSuccess={(id) => setNewDraftId(id)}
                        draftId={newDraftId}
                        type="share"
                        title={preview.title!}
                        description={preview.description!}
                        functions={preview.functions!}
                    />
                </Flex>
            }
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
                                <Textarea minHeight="200px" resize="vertical" onChange={(e: any) => handleChange('description', e)} value={form.description} fontSize="14" placeholder="Proposal's description and summary of main actions" />
                            </FormControl>
                        </Box>
                        {
                            form.title && form.description ? actionSubForms : null
                        }
                    </>
            }
            <ProposalFormBtns
                hasTitleAndDescrption={!!form.title && !!form.description}
                nbActions={form.actions.length}
                isFormValid={isFormValid}
                hasSuccess={hasSuccess}
                previewMode={previewMode}
                handleSubmitProposal={handleSubmitProposal}
                handlePublishDraft={handlePublishDraft}
                addAction={addAction}
                setPreviewMode={setPreviewMode}
                showTemplateModal={showTemplateModal}
                draftId={draftId}
                isPublicDraft={isPublicDraft}
            />
            <ActionTemplateModal isOpen={isOpen} onClose={onClose} onAddTemplate={handleAddTemplate} />
        </Stack>
    )
}