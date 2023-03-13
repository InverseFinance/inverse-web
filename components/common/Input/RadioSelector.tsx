import { Box } from "@chakra-ui/react"
import { RadioGridCardGroup } from "./RadioCardGroup"

export const RadioSelector = ({ items, setChosen, defaultValue = '0', value = '0', ...props }) => {
    return (
        <Box maxW="850px" {...props}>
            <RadioGridCardGroup
                wrapperProps={{
                    minChildWidth: '95px',
                    spacing: '2',
                    overflow: 'auto',
                    position: 'relative',
                    mt: '2',
                    mb: '2',
                    maxW: { base: '90vw', sm: 'auto-fit' },
                }}
                group={{
                    name: 'indx',
                    defaultValue: defaultValue.toString(),
                    value: value !== undefined ? value.toString() : undefined,
                    onChange: (v: string) => setChosen(v),
                }}
                radioCardProps={{ w: '95px', fontSize: '13px', textAlign: 'center', p: '2', position: 'relative' }}
                options={items}
            />
        </Box>
    )
}