import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from "@chakra-ui/accordion"
import { Box } from "@chakra-ui/react"
import Container from "../Container"

export const FAQ = ({
    label = 'FAQ',
    items,
}: {
    label: string
    items: {
        title: string
        body: string
    }[]
}) => {
    return <Container label={label} noPadding p="0">
        <Accordion w='full' allowMultiple>
        {
            items.map((item, i) => {
                return <AccordionItem border="none" borderBottom={ i < (items.length-1) ? '1px solid #eee' : 'none' } key={item.title}>
                    <h2>
                        <AccordionButton >
                            <Box flex='1' textAlign='left' color="mainTextColor" fontWeight="bold" fontSize="lg">
                                {item.title}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4} color="secondaryTextColor">
                        {item.body}
                    </AccordionPanel>
                </AccordionItem>
            })
        }
    </Accordion>
    </Container>
}