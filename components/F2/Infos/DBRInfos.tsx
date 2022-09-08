import { VStack, Text, Image } from "@chakra-ui/react"

export const DBRInfos = () => {
    return <VStack w='full' py="4" px="8" alignItems="flex-start" spacing="4">
        <Text fontSize="18px" fontWeight="bold">
            What is DBR?
        </Text>
        <VStack w='full' bgColor="white" p="2" borderRadius="50px">
            <Image src="/assets/f2/jogging-dbr.svg" w="full" h="100px" />
        </VStack>
        <Text textAlign="left">
            - DBR is like the <b>Stamina</b> you need to run a marathon.
        </Text>
        <Text textAlign="left">
            - The Higher the debt, the higher is your daily DBR decrease rate.
        </Text>
        <Text textAlign="left">
            - If you run out of DBRs you enter the <b>Exhausted</b> state.
        </Text>
        <Text textAlign="left">
            - In the <b>Exhausted</b> state, someone can <b>force-recharge</b> your DBRs so that your current DBR deficit is gone.
        </Text>
        <Text textAlign="left">
            - <b>Being forced-recharged is bad</b> for you <b>but not fatal</b>
        </Text>
        <Text textAlign="left">
            - It's like a coach Doping you to keep up, it <b>recovers your stamina temporarily but at the cost of your Health</b> (increases debt, damaging Collateral Health).
        </Text>
        <Text textAlign="left">
            - That's why it's better to recharge your DBR balance yourself before entering the <b>Exhausted</b> state by buying it on the open market for example.
        </Text>
    </VStack>
}