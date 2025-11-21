import { Modal } from '@app/components/common/Modal';
import { Stack, Text, HStack, FormControl, Switch } from '@chakra-ui/react';
import { getNetworkConfigConstants } from '@app/util/networks';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getToken } from '@app/variables/tokens';
import { useAccount } from '@app/hooks/misc';
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets';
import { SimpleAmountForm } from '../SimpleAmountForm';
import { useWeb3React } from '@app/util/wallet';
import { useState } from 'react';
import { useTransactionCost } from '@app/hooks/usePrices';
import { BigNumber, Contract } from 'ethers';
import { WETH_ABI } from '@app/config/abis';
import { parseEther } from '@ethersproject/units';

export type WrongNetworkModalProps = {
    isOpen: boolean
    onClose: () => void
}

const { TOKENS } = getNetworkConfigConstants();
const weth = getToken(TOKENS, 'WETH')!;

const WethModal = ({ onClose, isOpen }: WrongNetworkModalProps) => {
    const { provider } = useWeb3React();
    const account = useAccount();
    const { data: ethBalance } = useEtherSWR(['getBalance', account, 'latest']);
    const { data: wethBalance } = useEtherSWR([weth?.address, 'balanceOf', account]);
    const [isDeposit, setIsDeposit] = useState(true);
    const [amount, setAmount] = useState('');

    const { costEth, costUsd } = useTransactionCost(
        new Contract(weth.address, WETH_ABI, provider?.getSigner()),
        'deposit',
        [],
    );

    const ethBalanceNum = ethBalance ? getBnToNumber(ethBalance) : 0;
    const wethBalanceNum = wethBalance ? getBnToNumber(wethBalance) : 0;
    const maxEthNum = ethBalanceNum - 6 * costEth;
    const maxEth = maxEthNum <= 0 ? BigNumber.from('0') : getNumberToBn(maxEthNum);

    const handleAction = () => {
        const contract = new Contract(weth.address, WETH_ABI, provider?.getSigner());
        if(isDeposit) {
            return contract.deposit({ value: parseEther(amount) });
        } else {
            return contract.withdraw(parseEther(amount));
        }        
    }

    const hasError = (amount?.length > 0 && !parseFloat(amount)) || isNaN(parseFloat(amount));

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>ETH / WETH Converter</Text>
                </Stack>
            }
        >
            <Stack spacing="5" p={'5'} minH={150} overflowY="auto">
                <HStack w='full' justify="space-between">
                    <Text>
                        ETH Balance: {shortenNumber(ethBalanceNum, 6)}
                    </Text>
                    <Text>
                        WETH Balance: {shortenNumber(wethBalanceNum, 6)}
                    </Text>
                </HStack>
                <FormControl cursor="pointer"  w='full' justifyContent="flex-start" display='flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIsDeposit(!isDeposit)}>
                        Convert ETH to WETH?
                    </Text>
                    <Switch onChange={(e) => setIsDeposit(!isDeposit)} size="sm" colorScheme="purple" isChecked={isDeposit} />
                </FormControl>
                <SimpleAmountForm
                    defaultAmount={''}
                    address={weth.address}
                    destination={weth.address}
                    signer={provider?.getSigner()}
                    decimals={18}
                    noApprovalNeeded={isDeposit}
                    maxAmountFrom={isDeposit ? [maxEth] : [wethBalance]}
                    onAction={handleAction}                    
                    actionLabel={isDeposit ? 'Convert ETH to WETH' : 'Convert WETH to ETH'}                    
                    onAmountChange={(v) => setAmount(v)}
                    showMaxBtn={false}
                    hideInputIfNoAllowance={false}                    
                    showBalance={false}
                    isDisabled={hasError}
                    isError={hasError}
                />
                {/* <Text textAlign="center">
                    Tx cost: ~{shortenNumber(costEth, 4, false, true)} Eth ({shortenNumber(costUsd, 2, true, true)})
                </Text> */}
            </Stack>
        </Modal>
    )
}

export default WethModal;