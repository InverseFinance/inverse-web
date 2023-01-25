import { capitalize } from "@app/util/misc"
import { HStack, Image, Text } from "@chakra-ui/react"

export const OracleType = ({
    oracleType,
    showImage = true,
    showText = true,
}: {
    oracleType: string,
    showImage?: boolean,
    showText?: boolean,
}) => {
    return <HStack spacing="1">
        {showImage && <Image src={`/assets/projects/${oracleType}.webp`} h="20px" w="20px" ignoreFallback={true} />}
        { showText && <Text>{capitalize(oracleType)}+PPO</Text> }
    </HStack>
}