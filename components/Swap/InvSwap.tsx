import { Flex } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ShrinkableInfoMessage } from '@app/components/common/Messages';

const url = 'https://app.sushi.com/swap?inputCurrency=0x865377367054516e17014CcdED1e7d814EDC9ce4&outputCurrency=0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';

export const InvSwap = () => {
    const { account } = useWeb3React<Web3Provider>();

    return (
        <Container
            label="Swap INV using Sushi"
            description="Open on Sushi"
            contentProps={{
                position: 'relative',
                minH: '600px',
                overflow: 'hidden',
                borderRadius: '10px',
                justify: 'center',
            }}
            href={url}
        >
            <Flex justify="center" overflow="hidden" h='495px' borderRadius='10px' w='full'>
                {
                    !account ?
                        <ShrinkableInfoMessage
                            description="Please Connect Your Wlallet"
                        />
                        :
                        <iframe
                            src={url}
                            height="600px"
                            width="100%"
                            scrolling="no"
                            id="swapIframe"
                            style={{
                                transform: 'translateY(-60px)',
                                border: '0',
                                margin: '0 auto',
                                display: 'block',
                                borderRadius: '10px',
                                height: '600px',
                                maxWidth: '600px',
                                minWidth: '300px',
                                overflow: 'hidden',
                            }}
                        />
                }
            </Flex>
        </Container>
    )
}