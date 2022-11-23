import { Flex, HStack, Text, VStack, Textarea, Code } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Link } from '@app/components/common/Link';
import { SubmitButton } from '@app/components/common/Button';
import { useWeb3React } from '@web3-react/core';
import Container from '@app/components/common/Container';
import { Input } from '@app/components/common/Input';
import { useEffect, useState } from 'react';
import { Contract } from 'ethers';
const zeroXutils = require('@0x/protocol-utils')
import { splitSignature } from 'ethers/lib/utils';

const ZeroXProxyAbi = [{
    "inputs": [
        { "internalType": "address[]", "name": "origins", "type": "address[]" },
        { "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "registerAllowedRfqOrigins",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}];
const ZeroXProxyAddress = '0xDef1C0ded9bec7F1a1670819833240f027b25EfF';
const TWG = '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B';
const EXCHANGE_PROXY_EIP712_DOMAIN_DEFAULT = {
    chainId: 1,
    verifyingContract: ZeroXProxyAddress,
    name: 'ZeroEx',
    version: '1.0.0',
};
const hidingBookOrdersUrl = `https://hidingbook.rook.finance/api/v1/orders`;

const postOrders = (payload) => {
    return fetch(hidingBookOrdersUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
}

export const RookPage = () => {
    const { account, library } = useWeb3React();
    const [addressToRegister, setAddressToRegister] = useState('');
    const [orderMessage, setOrderMessage] = useState('');
    const [editedMessage, setEditedMessage] = useState('');

    const handleRegister = (allow = true) => {
        if (!library?.getSigner()) { return }
        const contract = new Contract(ZeroXProxyAddress, ZeroXProxyAbi, library?.getSigner());
        return contract.registerAllowedRfqOrigins(addressToRegister.replace(/\s+/g, '').split(','), allow);
    }

    const handleSign = async () => {
        const signer = library?.getSigner();
        if (!signer) { return }

        const value = JSON.parse(editedMessage);

        const domain = { ...EXCHANGE_PROXY_EIP712_DOMAIN_DEFAULT };

        const types = {
            RfqOrder: zeroXutils.RfqOrder.STRUCT_ABI,
        }

        const lowerCaseValues = Object.entries(value).reduce((prev, entry) => {
            return { ...prev, [entry[0]]: typeof entry[1] === 'string' ? entry[1].toLowerCase() : entry[1] }
        }, {})
        const signature = await signer._signTypedData(domain, types, lowerCaseValues);
        const splitSig = splitSignature(signature)

        const orderRes = await postOrders([
            {
                ...lowerCaseValues,
                expiry: parseInt(lowerCaseValues.expiry),
                chainId: 1,
                verifyingContract: ZeroXProxyAddress.toLowerCase(),
                signature: {
                    signatureType: 2,
                    r: splitSig.r.toLowerCase(),
                    s: splitSig.s.toLowerCase(),
                    v: splitSig.v,
                }
            }
        ]);
        await orderRes.json();
    }

    useEffect(() => {
        if (!orderMessage) {
            setEditedMessage('')
            return
        }
        try {
            const asObj = JSON.parse(orderMessage);
            asObj['txOrigin'] = account;
            asObj['maker'] = TWG;
            setEditedMessage(JSON.stringify(asObj));
        } catch (e) {

        }
    }, [orderMessage]);

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Rook Multisig Handler</title>
            </Head>
            <AppNav active="INV" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Container label="Copy, auto-edit, sign and submit an order">
                    <VStack w='full' alignItems="flex-start">
                        <Text>
                            1) Make sure <b>{ZeroXProxyAddress}</b> has the required allowances to spend TWG tokens
                        </Text>
                        <Text>
                            2) Use <Link href="https://app.rook.fi/en/trade" target="_blank" isExternal>Rook.fi</Link> to generate an order message with a registered EOA but <b>DON'T SIGN IT WITH YOUR WALLET ON ROOK.FI</b>
                        </Text>
                        <Text>
                            3) Paste the copied order message below:
                        </Text>
                        <Textarea
                            bgColor="primary.800"
                            borderColor="primary.700"
                            h="300px"
                            textAlign="left"
                            w='full'
                            placeholder="Use Rook.fi to generate an order message with a registered EOA and paste it here"
                            value={orderMessage}
                            onChange={(e) => setOrderMessage(e.target.value)}
                        />
                        <Text>After the auto-edit (<i>maker</i> should be TWG and <i>txOrigin</i> your connected EOA that was registered):</Text>
                        <Code
                            bgColor="primary.800"
                            p="2"
                            color="mainTextColor"
                            textAlign="left"
                            w='full'
                            placeholder="Edited order with multisig as maker"
                            whiteSpace="pre"
                        >
                            {editedMessage.replace(/(,)/g, '$1\r\n\t').replace(/({)/g, '$1\n\t').replace(/(})/g, '\n$1')}
                        </Code>
                        <SubmitButton themeColor="green" w='140px' disabled={!editedMessage} onClick={() => handleSign()}>
                            Sign & Submit
                        </SubmitButton>
                        <Text>
                            4) Your order should now appear on Rook.fi and you can cancel it there with the EOA
                        </Text>
                    </VStack>
                </Container>
                <Container
                    label="Register an EOA"
                    description="To do with the multisig account"
                >
                    <HStack w='full'>
                        <Input textAlign="left" w='full' placeholder="EOA address to register for connected wallet" value={addressToRegister} onChange={(e) => setAddressToRegister(e.target.value)} />
                        <SubmitButton themeColor="green" w='140px' disabled={!account || !addressToRegister} onClick={() => handleRegister(true)}>
                            Register
                        </SubmitButton>
                        <SubmitButton themeColor="orange" w='140px' disabled={!account || !addressToRegister} onClick={() => handleRegister(false)}>
                            Unregister
                        </SubmitButton>
                    </HStack>
                </Container>
            </Flex>
        </Layout>
    )
}

export default RookPage