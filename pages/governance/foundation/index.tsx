import { useState } from 'react';
import { Flex, HStack, Text, VStack, Input, Select, SimpleGrid, Box, Textarea } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import Container from '@app/components/common/Container';
import Table from '@app/components/common/Table';
import ScannerLink from '@app/components/common/ScannerLink';
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp';
import { InfoMessage } from '@app/components/common/Messages';
import { SubmitButton } from '@app/components/common/Button';
import { Modal } from '@app/components/common/Modal';
import { useFoundation } from '@app/hooks/useFoundation';
import { foundationPull, foundationSetDelegate, foundationRemoveDelegate } from '@app/util/foundation';
import { shortenNumber } from '@app/util/markets';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { isAddress } from '@ethersproject/address';
import { INVERSE_FOUNDATION_FUNDER } from '@app/config/constants';
import { getScanner } from '@app/util/web3';
import { NetworkIds } from '@app/types';

const pullColumns = [
  {
    field: 'txHash',
    label: 'Tx',
    header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ txHash }: any) => (
      <HStack justify="flex-start" minWidth="100px" fontSize="14px">
        <ScannerLink value={txHash} type="tx" />
      </HStack>
    ),
  },
  {
    field: 'timestamp',
    label: 'Date',
    header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="130px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ timestamp }: any) => (
      <HStack minWidth="130px" fontSize="14px">
        {timestamp > 0 ? <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} /> : <Text>-</Text>}
      </HStack>
    ),
  },
  {
    field: 'caller',
    label: 'Initiated By',
    header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="120px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ caller }: any) => (
      <HStack justify="flex-start" minWidth="120px" fontSize="14px">
        <ScannerLink value={caller} />
      </HStack>
    ),
  },
  {
    field: 'tokenSymbol',
    label: 'Token',
    header: ({ ...props }: any) => <HStack justify="center" minWidth="80px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ tokenSymbol }: any) => (
      <HStack justify="center" minWidth="80px" fontSize="14px">
        <Text fontWeight="bold">{tokenSymbol}</Text>
      </HStack>
    ),
  },
  {
    field: 'amount',
    label: 'Amount',
    header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ amount }: any) => (
      <HStack justify="center" minWidth="100px" fontSize="14px">
        <Text fontWeight="bold">{shortenNumber(amount, 2)}</Text>
      </HStack>
    ),
  },
  {
    field: 'to',
    label: 'Recipient',
    header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="120px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ to }: any) => (
      <HStack justify="flex-start" minWidth="120px" fontSize="14px">
        <ScannerLink value={to} />
      </HStack>
    ),
  },
  {
    field: 'reason',
    label: 'Reason',
    header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="150px" fontSize="14px" fontWeight="extrabold" {...props} />,
    value: ({ reason }: any) => (
      <HStack justify="flex-start" minWidth="150px" fontSize="14px">
        <Text noOfLines={2} title={reason}>{reason || '-'}</Text>
      </HStack>
    ),
  },
];

const getDelegateColumns = (isBeneficiary: boolean, provider: any) => {
  const columns: any[] = [
    {
      field: 'delegate',
      label: 'Delegate',
      header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="140px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ delegate }: any) => (
        <HStack justify="flex-start" minWidth="140px" fontSize="14px">
          <ScannerLink value={delegate} />
        </HStack>
      ),
    },
    {
      field: 'tokenSymbol',
      label: 'Token',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="80px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ tokenSymbol }: any) => (
        <HStack justify="center" minWidth="80px" fontSize="14px">
          <Text fontWeight="bold">{tokenSymbol}</Text>
        </HStack>
      ),
    },
    {
      field: 'limit',
      label: 'Allowance',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ limit, tokenSymbol }: any) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold">{shortenNumber(limit, 2)} {tokenSymbol}</Text>
        </HStack>
      ),
    },
    {
      field: 'intervalFormatted',
      label: 'Refill Period',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ intervalFormatted }: any) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text>{intervalFormatted}</Text>
        </HStack>
      ),
    },
    {
      field: 'available',
      label: 'Available',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ available, tokenSymbol }: any) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold" color="secondary">{shortenNumber(available, 2)} {tokenSymbol}</Text>
        </HStack>
      ),
    },
  ];

  if (isBeneficiary && provider) {
    columns.push({
      field: 'actions',
      label: '',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="80px" {...props} />,
      value: ({ delegate, token }: any) => (
        <HStack justify="center" minWidth="80px">
          <SubmitButton
            w="auto"
            px="3"
            py="1"
            fontSize="12px"
            h="28px"
            colorScheme="red"
            onClick={() => foundationRemoveDelegate(provider.getSigner(), delegate, token)}
            refreshOnSuccess={true}
          >
            Remove
          </SubmitButton>
        </HStack>
      ),
    });
  }

  return columns;
};

const PullFundsForm = ({ tokens, delegates, account, isBeneficiary, isDelegate, userDelegateTokens, provider }: any) => {
  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');

  const availableTokens = isBeneficiary ? tokens : tokens.filter((t: any) => userDelegateTokens.includes(t.address));
  const selectedTokenInfo = tokens.find((t: any) => t.address === selectedToken);

  // For delegates, show their delegate-specific available amount
  const delegateInfo = isDelegate && !isBeneficiary && account && selectedToken
    ? delegates.find((d: any) => d.delegate.toLowerCase() === account.toLowerCase() && d.token.toLowerCase() === selectedToken.toLowerCase())
    : null;
  const displayAvailable = delegateInfo ? delegateInfo.available : selectedTokenInfo?.available;

  const canSubmit = selectedToken && parseFloat(amount) > 0 && isAddress(recipient) && reason.trim().length > 0;

  const handlePull = () => {
    if (!canSubmit || !selectedTokenInfo) return;
    return foundationPull(
      provider.getSigner(),
      selectedToken,
      amount,
      selectedTokenInfo.decimals,
      recipient,
      reason,
    );
  };

  return (
    <VStack spacing="4" w="full" maxW="600px" alignItems="flex-start">
      <VStack spacing="1" w="full" alignItems="flex-start">
        <Text fontSize="13px" fontWeight="bold">Token</Text>
        <Select
          placeholder="Select token"
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
        >
          {availableTokens.map((t: any) => (
            <option key={t.address} value={t.address}>{t.symbol}</option>
          ))}
        </Select>
      </VStack>
      {selectedTokenInfo && displayAvailable !== undefined && (
        <Text
          fontSize="12px"
          color="secondaryTextColor"
          cursor="pointer"
          textDecoration="underline"
          _hover={{ color: 'mainTextColor' }}
          onClick={() => setAmount(displayAvailable.toString())}
          title="Click to fill amount"
        >
          Available: {shortenNumber(displayAvailable, 2)} {selectedTokenInfo.symbol}
        </Text>
      )}
      <VStack spacing="1" w="full" alignItems="flex-start">
        <Text fontSize="13px" fontWeight="bold">Amount</Text>
        <Input
          placeholder="0.00"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </VStack>
      <VStack spacing="1" w="full" alignItems="flex-start">
        <Text fontSize="13px" fontWeight="bold">Recipient Address</Text>
        <Input
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </VStack>
      <VStack spacing="1" w="full" alignItems="flex-start">
        <Text fontSize="13px" fontWeight="bold">Reason</Text>
        <Textarea
          placeholder="Describe the purpose of this transfer"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </VStack>
      <SubmitButton
        disabled={!canSubmit}
        onClick={handlePull}
        refreshOnSuccess={true}
      >
        Pull Funds
      </SubmitButton>
    </VStack>
  );
};

const AddDelegateModal = ({ isOpen, onClose, tokens, provider }: any) => {
  const [delegateAddr, setDelegateAddr] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [intervalDays, setIntervalDays] = useState('');

  const selectedTokenInfo = tokens.find((t: any) => t.address === selectedToken);
  const canSubmit = isAddress(delegateAddr) && selectedToken && parseFloat(limitAmount) > 0 && parseFloat(intervalDays) > 0;

  const handleSubmit = () => {
    if (!canSubmit || !selectedTokenInfo) return;
    return foundationSetDelegate(
      provider.getSigner(),
      delegateAddr,
      selectedToken,
      limitAmount,
      selectedTokenInfo.decimals,
      Math.round(parseFloat(intervalDays) * 86400),
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} header="Add / Update Delegate">
      <VStack spacing="4" p="4">
        <VStack spacing="1" w="full" alignItems="flex-start">
          <Text fontSize="13px" fontWeight="bold">Delegate Address</Text>
          <Input
            placeholder="0x..."
            value={delegateAddr}
            onChange={(e) => setDelegateAddr(e.target.value)}
          />
        </VStack>
        <VStack spacing="1" w="full" alignItems="flex-start">
          <Text fontSize="13px" fontWeight="bold">Token</Text>
          <Select
            placeholder="Select token"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
          >
            {tokens.map((t: any) => (
              <option key={t.address} value={t.address}>{t.symbol}</option>
            ))}
          </Select>
        </VStack>
        <VStack spacing="1" w="full" alignItems="flex-start">
          <Text fontSize="13px" fontWeight="bold">Limit Amount</Text>
          <Input
            placeholder="0.00"
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
          />
        </VStack>
        <VStack spacing="1" w="full" alignItems="flex-start">
          <Text fontSize="13px" fontWeight="bold">Refill Interval (days)</Text>
          <Input
            placeholder="e.g. 30"
            type="number"
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
          />
        </VStack>
        <SubmitButton
          disabled={!canSubmit}
          onClick={handleSubmit}
          refreshOnSuccess={true}
          onSuccess={onClose}
        >
          Set Delegate
        </SubmitButton>
      </VStack>
    </Modal>
  );
};

export const InverseFoundationPage = () => {
  const { provider } = useWeb3React<Web3Provider>();
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);

  const {
    gov,
    beneficiary,
    tokens,
    delegates,
    pullHistory,
    isLoading,
    isBeneficiary,
    isDelegate,
    isAuthed,
    userDelegateTokens,
    account,
  } = useFoundation();

  const delegateColumns = getDelegateColumns(isBeneficiary, provider);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Foundation</title>
        <meta name="og:title" content="Inverse Finance - Foundation" />
        <meta name="og:description" content="Foundation Funder - Quarterly Token Budget Management" />
      </Head>
      <AppNav active="Governance" activeSubmenu="Foundation" hideAnnouncement={true} />
      <Flex justify="center" direction="column" w={{ base: 'full' }} maxW="1200px" mx="auto">

        {/* Section 1: Quarterly Token Allowances */}
        <Container
          label="Foundation's Quarterly Token Allowances"
          description="See Contract"
          href={`${getScanner(NetworkIds.mainnet)}/address/${INVERSE_FOUNDATION_FUNDER}`}
          contentBgColor="gradient3"
          contentProps={{ p: { base: '4', sm: '8' } }}
        >
          {isLoading ? (
            <Text>Loading...</Text>
          ) : tokens.length === 0 ? (
            <Text color="secondaryTextColor">No token budgets configured yet</Text>
          ) : (
            <VStack spacing="4" w="full">
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4" w="full">
                {tokens.map((token) => (
                  <Box
                    key={token.address}
                    p="4"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="primary.850"
                  >
                    <VStack spacing="2" alignItems="flex-start">
                      <Text fontWeight="extrabold" fontSize="16px">{token.symbol}</Text>
                      <Flex w="full" justify="space-between" fontSize="13px">
                        <Text color="secondaryTextColor">Quarterly Limit:</Text>
                        <Text fontWeight="bold">{shortenNumber(token.quarterlyLimit, 2)}</Text>
                      </Flex>
                      <Flex w="full" justify="space-between" fontSize="13px">
                        <Text color="secondaryTextColor">Available to spend:</Text>
                        <Text fontWeight="bold" color="secondary">{shortenNumber(token.available, 2)}</Text>
                      </Flex>
                      <Flex w="full" justify="space-between" fontSize="13px">
                        <Text color="secondaryTextColor">Refill Period:</Text>
                        <Text>{token.intervalFormatted}</Text>
                      </Flex>
                      <Flex w="full" justify="space-between" fontSize="13px">
                        <Text color="secondaryTextColor">Gov Balance:</Text>
                        <Text>{shortenNumber(token.govBalance, 2)}</Text>
                      </Flex>
                      <Flex w="full" justify="space-between" fontSize="13px">
                        <Text color="secondaryTextColor">Gov Allowance:</Text>
                        <Text>{shortenNumber(token.govAllowance, 2)}</Text>
                      </Flex>
                      {/* Usage bar */}
                      <Box w="full" h="6px" bg="primary.850" borderRadius="full" mt="1">
                        <Box
                          h="full"
                          borderRadius="full"
                          bg="secondary"
                          w={`${token.quarterlyLimit > 0 ? Math.min(100, (token.available / token.quarterlyLimit) * 100) : 0}%`}
                        />
                      </Box>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
              {gov && (
                <HStack fontSize="12px" color="secondaryTextColor" spacing="1">
                  <Text>Gov:</Text>
                  <ScannerLink value={gov} fontSize="12px" />
                  <Text ml="4">Beneficiary:</Text>
                  <ScannerLink value={beneficiary} fontSize="12px" />
                </HStack>
              )}
            </VStack>
          )}
        </Container>

        {/* Section 2: Delegates */}
        <Container
          label="Delegates"
          contentBgColor="gradient3"
          contentProps={{ p: { base: '2', sm: '4' } }}
          right={
            isBeneficiary && provider ? (
              <SubmitButton
                w="auto"
                px="4"
                fontSize="12px"
                h="32px"
                onClick={() => { setIsDelegateModalOpen(true); return undefined; }}
              >
                Add Delegate
              </SubmitButton>
            ) : undefined
          }
        >
          {delegates.length === 0 ? (
            <Text color="secondaryTextColor" p="4">No delegates configured</Text>
          ) : (
            <Table
              keyName="delegate-token"
              columns={delegateColumns}
              items={delegates.map(d => ({ ...d, 'delegate-token': `${d.delegate}-${d.token}` }))}
              defaultSort="available"
              defaultSortDir="desc"
              enableMobileRender={true}
              mobileThreshold={821}
            />
          )}
        </Container>

        {/* Section 3: Fund Pull History */}
        <Container
          label="Fund Pull History"
          contentBgColor="gradient3"
          contentProps={{ p: { base: '2', sm: '4' } }}
        >
          {pullHistory.length === 0 ? (
            <Text color="secondaryTextColor" p="4">{isLoading ? 'Loading...' : 'No fund pulls yet'}</Text>
          ) : (
            <Table
              keyName="txHash"
              columns={pullColumns}
              items={pullHistory}
              defaultSort="timestamp"
              defaultSortDir="desc"
              enableMobileRender={true}
              mobileThreshold={821}
            />
          )}
        </Container>

        {/* Section 4: Pull Funds (auth-gated) */}
        {isAuthed && provider && (
          <Container
            label="Pull Funds"
            contentBgColor="gradient3"
            contentProps={{ p: { base: '4', sm: '8' } }}
          >
            <VStack spacing="4" w="full" alignItems="flex-start">
              <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                  isBeneficiary
                    ? "You are connected as the beneficiary. You can pull funds from any configured token."
                    : "You are connected as a delegate. You can pull funds within your allocated allowance."
                }
              />
              <PullFundsForm
                tokens={tokens}
                delegates={delegates}
                account={account}
                isBeneficiary={isBeneficiary}
                isDelegate={isDelegate}
                userDelegateTokens={userDelegateTokens}
                provider={provider}
              />
            </VStack>
          </Container>
        )}

        {/* Add Delegate Modal */}
        {isBeneficiary && provider && (
          <AddDelegateModal
            isOpen={isDelegateModalOpen}
            onClose={() => setIsDelegateModalOpen(false)}
            tokens={tokens}
            provider={provider}
          />
        )}
      </Flex>
    </Layout>
  );
};

export default InverseFoundationPage;
