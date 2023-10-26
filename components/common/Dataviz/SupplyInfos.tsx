import { Flex, Image, SkeletonText, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { InfoMessage } from '@app/components/common/Messages'
import { Token, NetworkIds } from '@app/types';
import { getNetwork } from '@app/util/networks';
import { PieChart } from '@app/components/Transparency/PieChart';
import { useEffect, useState } from 'react';

const Img = ({ src }: { src: string }) =>
    <Image mx="1" borderRadius="10px" display="inline-block" src={src} ignoreFallback={true} w='15px' h='15px' />

export const SupplyInfos = ({
    title,
    supplies,
    token,
    showChart = false,
    isLoading = false,
}: {
    title?: React.ReactNode,
    supplies: { supply: number, chainId: NetworkIds, name?: string, projectImage?: string }[],
    token?: Token,
    showChart?: boolean,
    isLoading?: boolean,
}) => {
    const [chartData, setChartData] = useState<any>()
    const totalSupply = supplies.reduce((prev, curr) => prev + curr.supply, 0);

    useEffect(() => {
        setChartData(
            supplies.map(s => {
                return { x: s.name, y: s.supply+1, perc: totalSupply ? s.supply / totalSupply * 100 : 0 }
            })
        )
    }, [supplies]);

    const sortedSupplies = [...supplies].sort((a, b) => b.supply - a.supply);

    return (
        <InfoMessage
            title={
                token ? <Flex alignItems="center">
                    <Image borderRadius="50px" mr="2" display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' />
                    {token.symbol} Total Supplies :
                </Flex>
                    : title
            }
            iconProps={{ fontSize: '16px' }}
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                isLoading ? <SkeletonText /> :
                <>
                    {
                        sortedSupplies.map(({ supply, chainId, name, projectImage, label }, i) => {
                            const network = getNetwork(chainId);
                            return (
                                <Flex key={i} position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                                    <Flex alignItems="center">
                                        <Text>-</Text>
                                        <Img src={projectImage ? `${projectImage}` : network.image!} />
                                        <Text lineHeight="15px">{label ? label : `On ${name || network.name}`}:</Text>
                                    </Flex>
                                    <Text>{shortenNumber(supply)} ({shortenNumber(totalSupply ? supply / totalSupply * 100 : 0)}%)</Text>
                                </Flex>
                            )
                        })
                    }
                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                        <Text>- Total Cross-Chain:</Text>
                        <Text>{shortenNumber(totalSupply)}</Text>
                    </Flex>
                    {
                        showChart &&
                        <PieChart
                            width={150}
                            height={150}
                            padding={{ left: 150, right: 150 }}
                            data={chartData}
                        />
                    }
                </>
            }
        />
    )
}