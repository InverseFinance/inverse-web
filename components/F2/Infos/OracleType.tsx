import { capitalize } from "@app/util/misc"
import { Stack, Image, Text } from "@chakra-ui/react"

export const OracleType = ({
    oracleType,
    showImage = true,
    showText = true,
    subText = ''
}: {
    oracleType: string,
    showImage?: boolean,
    showText?: boolean,
    subText?: string
}) => {
    return <Stack justify="flex-start" alignItems={{ base: 'flex-end', xl: 'center' }} direction="column" spacing="0">
        <Stack alignItems="center"  spacing="1" direction="row">
            {showImage && <Image src={`/assets/projects/${oracleType}.webp`} h="15px" w="15px" ignoreFallback={true} />}
            {showText && <Text>{capitalize(oracleType)}+PPO</Text>}
        </Stack>
        {!!subText && <Text>+{capitalize(subText)}</Text>}
    </Stack>
}