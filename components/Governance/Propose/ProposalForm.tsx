import { useState, useEffect } from 'react'
import { Flex, FormControl, FormLabel, Stack, Text, Box, useDisclosure } from '@chakra-ui/react';
import { Textarea } from '@app/components/common/Input';
import { formatUnits, FunctionFragment } from 'ethers/lib/utils';
import { GovEra, Proposal, ProposalFormFields, ProposalStatus, TemplateProposalFormActionFields } from '@app/types';
import { ProposalInput } from './ProposalInput';
import { ProposalFormAction } from './ProposalFormAction';
import { deleteDraft, getFunctionsFromProposalActions, getProposalActionFromFunction, isProposalActionInvalid, isProposalFormInvalid, linkDraft, publishDraft, simulateOnChainActions, submitProposal } from '@app/util/governance';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { handleTx } from '@app/util/transactions';
import { TEST_IDS } from '@app/config/test-ids';
import { ProposalActions, ProposalDetails } from '../Proposal';
import { showToast } from '@app/util/notify';
import { ActionTemplateModal } from './ActionTemplateModal';
import { ProposalFormBtns } from './ProposalFormBtns';
import { ProposalFunction } from '@app/types';
import { ProposalShareLink } from '../ProposalShareLink';
import { ProposalFloatingPreviewBtn } from './ProposalFloatingPreviewBtn';
import { useRouter } from 'next/dist/client/router';
import { Link } from '@app/components/common/Link';
import { namedAddress } from '@app/util';
import { DRAFT_WHITELIST } from '@app/config/constants';
import { handleApiResponse } from '@app/util/misc';
import { InfoMessage } from '@app/components/common/Messages';

const EMPTY_ACTION = {
    actionId: 0,
    contractAddress: '',
    func: '',
    args: [],
    value: '',
    fragment: undefined,
};

const DEFAULT_FUNCTIONS: ProposalFunction[] = []

export const ProposalForm = ({
    lastProposalId = 0,
    title = '',
    description = '',
    draftId,
    functions = DEFAULT_FUNCTIONS,
    isPreview = false,
    isPublicDraft = false,
    createdAt,
    updatedAt,
}: {
    lastProposalId: number,
    title?: string,
    description?: string,
    draftId?: number,
    functions?: ProposalFunction[]
    isPreview?: boolean
    isPublicDraft?: boolean
    createdAt?: number
    updatedAt?: number
}) => {
    const router = useRouter()
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
        return handleTx(tx, {
            onSuccess: (tx, receipt) => {
                setHasSuccess(true);
                const canDraft = DRAFT_WHITELIST.includes((account || '')?.toLowerCase());
                if (draftId && isPublicDraft && canDraft) {
                    const proposalId = formatUnits(receipt?.events[2]?.args?.id, 0);
                    linkDraft(draftId!, proposalId, library.getSigner(), (result) => {
                        handleApiResponse(result);
                    });
                }
            }
        });
    }

    const handlePublishDraft = async () => {
        if (!library?.getSigner()) {
            showToast({ description: 'Not connected', status: 'info' });
            return;
        }

        const functions = getFunctionsFromProposalActions(form.actions.filter(a => !isProposalActionInvalid(a)));

        return publishDraft(
            form.title,
            form.description,
            functions,
            library?.getSigner(),
            isPublicDraft ? draftId : undefined,
            (newId) => {
                if (newId) {
                    router.push('/governance/drafts/' + newId);
                }
            })
    }

    const handleDeleteDraft = async () => {
        if (!library?.getSigner()) {
            showToast({ description: 'Not connected', status: 'info' });
            return;
        }
        return deleteDraft(draftId!, library.getSigner(), () => router.push('/governance'));
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
        createdAt,
        updatedAt,
        era: GovEra.mills,
        startTimestamp: now,
        endTimestamp: (new Date()).setDate(now.getDate() + 3),
        status: title ? ProposalStatus.draft : ProposalStatus.active,
    } : {}

    const handleSimulation = async () => {
        return simulateOnChainActions(preview.functions!, (result) => {
            const failedIdx = result.receipts.length - 1;
            const failedAction = preview.functions[failedIdx];
            showToast({
                duration: 15000,
                status: result.hasError ? 'error' : 'success',
                title: 'On-Chain Actions Simulation',
                description: result.hasError ?
                    <>Action #{result.receipts.length} <b>{namedAddress(failedAction.target)}.{failedAction.signature.split('(')[0]}</b>: Failed!</>
                    :
                    'Simulations executed successfully',
            })
        });
    }

    const forumLink = (form.description.match(/https:\/\/forum\.inverse\.finance[^\s)]+/i) || [''])[0];

    return (
        <Stack color="mainTextColor" spacing="4" direction="column" w="full" data-testid={TEST_IDS.governance.newProposalFormContainer}>
            <ProposalFloatingPreviewBtn onChange={() => setPreviewMode(!previewMode)} isEnabled={previewMode} />
            {
                previewMode && <Flex alignItems="center" justify="center">
                    <Text textAlign="center" display="inline-block">
                        Preview / Recap
                    </Text>
                    <ProposalShareLink
                        onSaveSuccess={(id) => setNewDraftId(id)}
                        draftId={newDraftId}
                        isPublicDraft={isPublicDraft}
                        type="share"
                        title={preview.title!}
                        description={preview.description!}
                        functions={preview.functions!}
                    />
                </Flex>
            }
            {
                previewMode ?
                    <Flex direction="column" textAlign="left">
                        <Flex w={{ base: 'full', xl: 'full' }} justify="center">
                            <ProposalDetails proposal={preview} isEditing={true} />
                        </Flex>
                        <Flex w={{ base: 'full', xl: 'full' }} justify="center">
                            <ProposalActions proposal={preview} isEditing={true} />
                        </Flex>
                    </Flex>
                    :
                    <>
                        <Box bg="gradient2" borderRadius="5" p="4" color="mainTextColor">
                            <FormControl>
                                <FormLabel>Title</FormLabel>
                                <ProposalInput onChange={(e) => handleChange('title', e)} value={form.title} fontSize="14" placeholder="Proposal's title" />
                            </FormControl>
                            <FormControl mt="2">
                                <FormLabel>
                                    Details (Markdown <Link isExternal href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">
                                        cheatsheet
                                    </Link>, Excel table to markdown <Link isExternal href="https://tabletomarkdown.com/convert-spreadsheet-to-markdown/">
                                        table converter
                                    </Link>)
                                </FormLabel>
                                <Textarea minHeight="400px" resize="vertical" onChange={(e: any) => handleChange('description', e)} value={form.description} fontSize="14" placeholder={"Proposal's description and summary of main actions"} />
                            </FormControl>
                        </Box>
                        {
                            form.title && form.description ? actionSubForms : null
                        }
                    </>
            }
            {
                !forumLink
                && <InfoMessage
                    alertProps={{ w: 'full' }}
                    title="Forum Reminder"
                    description={
                        <Box justify="center">
                            Please create and add the link to the corresponding <Link isExternal target="_blank" display="inline-block" href="https://forum.inverse.finance">Forum</Link> post in the proposal content.
                        </Box>
                    }
                />
            }
            <ProposalFormBtns
                hasTitleAndDescrption={!!form.title && !!form.description}
                nbActions={form.actions.length}
                isFormValid={isFormValid}
                hasSuccess={hasSuccess}
                previewMode={previewMode}
                handleSubmitProposal={handleSubmitProposal}
                handlePublishDraft={handlePublishDraft}
                handleDeleteDraft={handleDeleteDraft}
                handleSimulation={handleSimulation}
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