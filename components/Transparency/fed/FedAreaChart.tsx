import { Fed } from '@app/types'
import { shortenAddress } from '@app/util'
import { Flex,Text, HStack, Switch, useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import ScannerLink from '../../common/ScannerLink'
import { AreaChart } from '../AreaChart'

export const FedAreaChart = ({ fed, chartData, ...props }: { fed: Fed, chartData: any }) => {
    const [useSmoothLine, setUseSmoothLine] = useState(false);
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return (
        <>
            <Flex h="25px" position="relative" alignItems="center">
                {
                    !!fed.address &&
                    <>
                        <Text display="inline-block" mr="2">Contract:</Text>
                        <ScannerLink chainId={fed.chainId} value={fed.address} label={shortenAddress(fed.address)} />
                    </>
                }
                <HStack position="absolute" right={{ base: 0, sm: '50px' }} top="3px">
                    <Text fontSize="12px">
                        Smooth line
                    </Text>
                    <Switch value="true" isChecked={useSmoothLine} onChange={() => setUseSmoothLine(!useSmoothLine)} />
                </HStack>
            </Flex>
            <AreaChart
                showTooltips={true}
                height={300}
                width={chartWidth}
                data={chartData}
                interpolation={useSmoothLine ? 'basis' : 'stepAfter'}
                {...props}
            />
        </>
    )
}