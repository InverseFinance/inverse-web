import { CloseIcon } from '@chakra-ui/icons'
import { Box, Slide, useOutsideClick } from '@chakra-ui/react'
import Container from '@app/components/common/Container'

import { ReactNode, useRef } from 'react'

export const SlideModal = ({
    isOpen,
    onClose,
    right,
    children
}: {
    isOpen: boolean,
    onClose: () => void,
    right?: ReactNode,
    children: ReactNode
}) => {
    const ref = useRef(null)

    useOutsideClick({
        ref,
        handler: () => {
            onClose()
        },
    })

    return <Slide direction='bottom' in={isOpen} style={{ zIndex: 9999 }}>
        <Container
            noPadding
            px={{ base: '1px', sm: 5 }}
            contentProps={{
                ref,
                boxShadow: "0px 0px 1px 1px #ccc",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                className: "blurred-container info-bg",
                pt: '4',
            }}
        >
            <Box w="15px" h="15px" cursor="pointer" onClick={onClose} zIndex="999" position="absolute" top="-30px" left="0px">
                <CloseIcon fontSize="14px" cursor="pointer" />
            </Box>
            {
                !!right &&  <Box zIndex="999" position="absolute" top="10px" right="10px">
                    {right}
                </Box>
            }
            {children}
        </Container>
    </Slide>
}