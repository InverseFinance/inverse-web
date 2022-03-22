import { Flex } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@app/components/common/Messages';

const url = 'https://app.sushi.com/swap?inputCurrency=0x865377367054516e17014CcdED1e7d814EDC9ce4&outputCurrency=0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';

export const InvSwap = ({
    label = 'Get INV',
    description = 'Open on Sushi',
    href = url,
}: {
    label?: string,
    description?: string,
    href?: string,
}) => {
    const { account } = useWeb3React<Web3Provider>();
    const minH = !!account ? '612px' : 'auto'

    return (
        <Container
            noPadding
            label={label}
            description={description}
            href={href}
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
        >
            <Flex
                overflow="hidden"
                minH={'495px'}
                borderRadius='10px'
                width="full"
                minWidth='300px'
                position="relative"
                w='full'>
                {
                    !account && <Flex 
                    alignItems="center"
                    position= 'absolute'
                    justify="center"
                    zIndex= '9'
                    minWidth= '300px'
                    minH= '300px'
                    margin= 'auto'
                    top= '0'
                    bottom= '0'
                    left= '0'
                    right= '0'
                    >
                        <InfoMessage alertProps={{
                            fontSize: '16px',
                            position: 'absolute',
                            p: '5',
                            top: '30%',
                            boxShadow: '0 0 4px 1px #aaa',
                        }}
                            title="Please Connect Your Wallet"
                        />
                    </Flex>
                }
                <iframe
                    src={url}
                    height={minH}
                    width="100%"
                    scrolling="no"
                    id="swapIframe"
                    style={{
                        opacity: !account ? '0.1' : '1',
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

            </Flex>
        </Container>
    )
}