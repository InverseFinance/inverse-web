import { RadioGridCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { Box, Flex, Image } from '@chakra-ui/react';

export const FedsSelector = ({ feds, setChosenFedIndex, defaultValue = '0', value = '0', ...props }) => {
    const fedOptionList = feds
        .map((fed, i) => ({
            value: i.toString(),
            label: <Flex alignItems="center">
                {
                    !!fed.chainId && <Image borderRadius={fed.address ? '10px' : undefined} ignoreFallback={true} src={`${fed.projectImage}`} w={'15px'} h={'15px'} mr="1" />
                }
                {fed.name.replace(/ Fed$/, '')}
            </Flex>,
        }));

    return (
        <Box maxW="850px" {...props}>
            <RadioGridCardGroup
                wrapperProps={{
                    minChildWidth: '105px',
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
                    onChange: (v: string) => setChosenFedIndex(parseInt(v)),
                }}
                radioCardProps={{ w: '105px', fontSize: '13px', textAlign: 'center', p: '2', position: 'relative' }}
                options={fedOptionList}
            />
        </Box>
    )
}