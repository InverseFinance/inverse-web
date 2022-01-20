import { Flex, Image, Text } from '@chakra-ui/react'
import { shortenNumber } from '@inverse/util/markets'
import { InfoMessage } from '@inverse/components/common/Messages'
import { Token } from '@inverse/types';

const Img = ({ filename }: { filename: string }) =>
    <Image display="inline-block" src={`/assets/networks/${filename}`} ignoreFallback={true} w='15px' h='15px' />

export const SuppplyInfos = ({
    mainnetSupply,
    fantomSupply,
    token,
}: {
    mainnetSupply: number,
    fantomSupply: number,
    token: Token,
}) => {
    const totalSupply = mainnetSupply + fantomSupply;
    const mainnetPerc = totalSupply ? mainnetSupply/totalSupply * 100 : 0;
    const ftmPerc = totalSupply ? fantomSupply/totalSupply * 100 : 0;
    return (
        <InfoMessage
            title={<>
                <Image mr="2" display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' />
                {token.symbol} Total Supplies</>
            }
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                <>
                    <Flex position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                        <Flex alignItems="center">
                            <Text>-</Text>
                            <Text mx="1"><Img filename="ethereum.png" /></Text>
                            <Text lineHeight="15px">On Ethereum:</Text>
                        </Flex>
                        <Text>{shortenNumber(mainnetSupply)} ({shortenNumber(mainnetPerc)}%)</Text>
                    </Flex>
                    <Flex direction="row" w='full' justify="space-between" alignItems="center">
                        <Flex alignItems="center">
                            <Text>-</Text>
                            <Text mx="1"><Img filename="fantom.webp" /></Text>
                            <Text lineHeight="15px">On Fantom:</Text>
                        </Flex>
                        <Text>{shortenNumber(fantomSupply)} ({shortenNumber(ftmPerc)}%)</Text>
                    </Flex>
                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- Total Cross-Chain:</Text>
                        <Text>{shortenNumber(totalSupply)}</Text>
                    </Flex>
                </>
            }
        />
    )
}