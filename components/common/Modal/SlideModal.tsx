import { CloseIcon } from '@chakra-ui/icons'
import { Box, Flex, FlexProps, Slide, StyleProps, SystemCSSProperties, useOutsideClick } from '@chakra-ui/react'
import Container from '@app/components/common/Container'

import { ReactNode, useRef } from 'react'

export const SlideModal = ({
    isOpen,
    onClose,
    right,
    children,
    contentProps,
    closeOnOutsideClick = true,
    closeIconInside = false,
    slideStyle,
}: {
    isOpen: boolean,
    closeOnOutsideClick?: boolean,
    closeIconInside?: boolean,
    onClose: () => void,
    right?: ReactNode,
    contentProps?: FlexProps,
    children: ReactNode
    slideStyle: SystemCSSProperties
}) => {
    const ref = useRef(null)

    useOutsideClick({
        ref,
        handler: () => {
            if (closeOnOutsideClick) {
                onClose();
            }
        },
    });

    const closeIcon = <Box
        w="15px"
        h="15px"
        cursor="pointer"
        onClick={onClose}
        zIndex="999"
        position="absolute"
        top={closeIconInside ? '10px' : '-30px'}
        left={closeIconInside ? 'auto' : '0'}
        right={closeIconInside ? '10px' : 'auto'}
    >
        <CloseIcon fontSize="14px" cursor="pointer" />
    </Box>;

    return <Slide
        direction='bottom'
        in={isOpen}
        style={{ zIndex: 9999, ...slideStyle }}
    >
        <Flex>
            <Container
                noPadding
                alignItems="center"
                px={{ base: '1px', sm: 5 }}
                contentProps={{
                    ref,
                    maxW: "1200px",
                    position: 'relative',
                    border: "1px solid #ccc",
                    borderBottomWidth: "0",
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    className: "blurred-container info-bg compat-mode",
                    boxShadow: '0px 0px 5px 5px #cccccc22',
                    pt: '4',
                    ...contentProps,
                }}
            >
                {closeIcon}
                {
                    !!right && <Box zIndex="999" position="absolute" top="10px" right="10px">
                        {right}
                    </Box>
                }
                {children}
            </Container>
        </Flex>
    </Slide>
}