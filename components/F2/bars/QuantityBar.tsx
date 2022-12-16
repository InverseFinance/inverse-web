import { Flex, FlexProps, Stack, Text } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { useState } from 'react';

export const QuantityBar = ({
    badgeColorScheme,
    perc,
    previewPerc,
    isPreviewing,
    hasError,
    title,
    ...props
}: {
    badgeColorScheme?: string,
    perc: number,
    previewPerc?: number,
    isPreviewing?: boolean,
    hasError?: boolean,
    title?: string,
} & Partial<FlexProps>) => {
    const [isChanging, setIsChanging] = useState(false);
    const _previewPerc = Math.min(Math.max(previewPerc ?? perc, 0), 100);
    const _perc = Math.min(Math.max(perc, 0), 100);

    useDebouncedEffect(() => {
        setIsChanging(true);
        setTimeout(() => {
            setIsChanging(false);
        }, 400)
    }, [perc, previewPerc], 200);

    return <Container
        noPadding
        p="0"
        contentBgColor={hasError ? `errorAlpha` : 'gradient2'}
        {...props}
    >
        <Flex w="full" justify="center">
            {
                !!title && <Text w='250px'>
                    {title}
                </Text>
            }
            <Stack
                w="full"
                direction={{ base: 'column', sm: 'row' }}
                justify="center"
                align="center"
                spacing={2}
                fontSize="sm"
                fontWeight="semibold"
            >
                <Flex
                    position="relative"
                    boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
                    transition="box-shadow 0.2s ease-in-out"
                    w="full"
                    h={'4px'}
                    alignItems="center"
                    borderRadius={8}
                    bgColor={`${badgeColorScheme}Alpha`}
                >
                    <Flex
                        transition="box-shadow 0.2s ease-in-out"
                        boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
                        w={`${_perc}%`}
                        h="6px"
                        borderLeftRadius={8}
                        borderRightRadius={isPreviewing ? '0' : 8}
                        bgColor={badgeColorScheme}></Flex>
                    {
                        isPreviewing && <Flex
                            className="box-shadow-highlight-anim"
                            position="absolute"
                            zIndex="2"
                            transition="box-shadow, width 0.2s ease-in-out"
                            boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
                            left={_previewPerc > _perc ? `${_perc}%` : `${_previewPerc}%`}
                            w={_previewPerc > _perc ? `${_previewPerc - _perc}%` : `${_perc - _previewPerc}%`}
                            h="6px"
                            borderLeftRadius={_perc > _previewPerc ? 8 : 0}
                            borderRightRadius={_previewPerc > _perc ? 8 : 0}
                            bgColor={_perc === 0 ? badgeColorScheme : '#ffffffbb'}></Flex>
                    }
                </Flex>
            </Stack>
        </Flex>
    </Container>
}