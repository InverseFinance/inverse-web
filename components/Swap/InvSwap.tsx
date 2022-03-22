import { Flex } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ShrinkableInfoMessage } from '@app/components/common/Messages';

const url = 'https://app.sushi.com/swap?inputCurrency=0x865377367054516e17014CcdED1e7d814EDC9ce4&outputCurrency=0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';

export const InvSwap = () => {
    const { account } = useWeb3React<Web3Provider>();
    const minH = !!account ? '612px' : 'auto'

    return (
        <Container
            noPadding
            label="Swap INV using Sushi"
            description="Open on Sushi"
            contentBgColor="transparent"
            contentProps={{
                boxShadow: 'none',
                position: 'relative',
                minH,
                overflow: 'hidden',
                borderRadius: '10px',
                justify: 'flex-start',
                padding: '0',
                mb: '0',
            }}
            href={url}
        >
            <Flex
                overflow="hidden"
                minH={!!account ? '495px' : 'auto'}
                borderRadius='10px'
                width="full"
                minWidth= '300px'
                w='full'>
                {
                    !account ?
                        <ShrinkableInfoMessage
                            description="Please Connect Your Wlallet"
                        />
                        :
                        <iframe
                            src={url}
                            height={minH}
                            width="100%"
                            scrolling="no"
                            id="swapIframe"
                            style={{
                                transform: 'translateY(-43px)',
                                border: '0',
                                margin: '0 auto',
                                display: 'block',
                                borderRadius: '10px',
                                height: minH,
                                width: 'full',
                                minWidth: '300px',
                                overflow: 'hidden',
                            }}
                        />
                }
            </Flex>
        </Container>
    )
}