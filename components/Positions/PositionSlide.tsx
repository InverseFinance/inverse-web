import { AccountPositionDetailed } from '@app/types'
import { CloseIcon } from '@chakra-ui/icons'
import { Box, Slide, useOutsideClick } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { PositionDetails } from './PositionDetails'
import { useRef } from 'react'

export const PositionSlide = ({
    isOpen,
    onClose,
    position,
    needFresh = true,
}: {
    isOpen: boolean,
    onClose: () => void,
    position: AccountPositionDetailed,
    needFresh?: boolean
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
            }}
        >
            <Box w="15px" h="15px" cursor="pointer" onClick={onClose} zIndex="999" position="absolute" top="10px" left="10px">
                <CloseIcon fontSize="14px" cursor="pointer" />
            </Box>
            {!!position && <PositionDetails needFresh={needFresh} position={position} />}
        </Container>
    </Slide>
}