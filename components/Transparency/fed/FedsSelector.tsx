import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { NetworkIds } from '@app/types';
import { Flex, Image } from '@chakra-ui/react';

export const FedsSelector = ({ feds, chosenFedIndex, setChosenFedIndex }) => {
    const fedOptionList = feds
        .map((fed, i) => ({
            value: i.toString(),
            label: <Flex alignItems="center">
                {
                    !!fed.chainId && <Image borderRadius={fed.address ? '10px' : undefined} ignoreFallback={true} src={`${fed.projectImage}`} w={'15px'} h={'15px'} mr="2" />
                }
                {fed.name.replace(/ Fed$/, '')}
            </Flex>,
        }));

    return (
        <RadioCardGroup
            wrapperProps={{ overflow: 'auto', position: 'relative', justify: 'left', mt: '2', mb: '2', maxW: { base: '90vw', sm: '100%' } }}
            group={{
                name: 'bool',
                defaultValue: '0',
                onChange: (v: string) => setChosenFedIndex(parseInt(v)),
            }}
            radioCardProps={{ w: '95px', fontSize: '14px', textAlign: 'center', p: '2', position: 'relative' }}
            options={fedOptionList}
        />
    )
}