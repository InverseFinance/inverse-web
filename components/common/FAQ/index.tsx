import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from "@chakra-ui/accordion"
import { Box, TextProps } from "@chakra-ui/react"
import Container from "../Container"
import { useAppTheme } from "@app/hooks/useAppTheme"

export type FAQType = {
    label: string
    labelProps?: TextProps
    defaultCollapse?: boolean
    collapsable?: boolean
    items: {
        title: string
        body: any
    }[]
    smaller?: boolean
}

export const AccordionItemTemplate = ({
    title,
    body,
}: {
    title: any,
    body: any,
}) => {
    return <AccordionItem w='full' border="none">
        <h2>
            <AccordionButton _focus={{ outline: 'none' }}>
                <Box flex='1' lineHeight="normal" textAlign='left' color="mainTextColor" fontWeight="bold" fontSize="lg">
                    {title}
                </Box>
                <AccordionIcon />
            </AccordionButton>
        </h2>
        <AccordionPanel lineHeight="normal" pb={4} color="secondaryTextColor">
            {body}
        </AccordionPanel>
    </AccordionItem>
}

export const FAQ = ({
    label = 'FAQ',
    labelProps,
    items,
    collapsable = false,
    defaultCollapse = false,
    smaller = false,
}: FAQType) => {
    const { themeStyles } = useAppTheme();
    return <Container
        label={label}
        labelProps={labelProps}
        noPadding
        p="0"        
        collapsable={collapsable}
        defaultCollapse={defaultCollapse}        
        fontSize={smaller ? '14px' : undefined}        
    >
        <Accordion w='full'  allowMultiple>
            {
                items.map((item, i) => {
                    return <AccordionItem border="none" borderBottom={i < (items.length - 1) ? `1px solid ${themeStyles.colors.mainTextColor}33` : 'none'} key={item.title}>
                        <h2>
                            <AccordionButton >
                                <Box flex='1' lineHeight="normal" textAlign='left' color="mainTextColor" fontWeight="bold" fontSize={smaller ? '14px' : 'lg'}>
                                    {item.title}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel lineHeight="1.5" pb={4} color="secondaryTextColor" fontSize={smaller ? '14px' : undefined}>
                            {item.body}
                        </AccordionPanel>
                    </AccordionItem>
                })
            }
        </Accordion>
    </Container>
}