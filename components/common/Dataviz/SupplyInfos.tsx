import { Flex, Image, Text } from '@chakra-ui/react'
import { shortenNumber } from '@inverse/util/markets'
import { InfoMessage } from '@inverse/components/common/Messages'
import { Token } from '@inverse/types';

export const SuppplyInfos = ({
    mainnetSupply, 
    fantomSupply,
    token,
}: {
    mainnetSupply: number,
    fantomSupply: number,
    token: Token,
}) => {
    return (
        <InfoMessage
            title={<>
                <Image mr="2" display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' />
                {token.symbol} Total Supplies</>
            }
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                <>
                    <Flex direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- <Image mr="1" display="inline-block" src={'/assets/networks/ethereum.png'} ignoreFallback={true} w='15px' h='15px' />On Ethereum:</Text>
                        <Text>{shortenNumber(mainnetSupply)}</Text>
                    </Flex>
                    <Flex direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- <Image mr="1" display="inline-block" src={'/assets/networks/fantom.webp'} ignoreFallback={true} w='15px' h='15px' />On Fantom:</Text>
                        <Text>{shortenNumber(fantomSupply)}</Text>
                    </Flex>
                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- Total:</Text>
                        <Text>{shortenNumber(mainnetSupply + fantomSupply)}</Text>
                    </Flex>
                </>
            }
        />
    )
}