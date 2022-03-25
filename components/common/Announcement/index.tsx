import { ExternalLinkIcon } from '@chakra-ui/icons'
import { HStack, Image, Text, VStack } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/layout'
import Link from '@app/components/common/Link'
import { TEST_IDS } from '@app/config/test-ids';
import { useSupplyBalances } from '@app/hooks/useBalances';
import { OLD_XINV } from '@app/config/constants';
import { utils } from 'ethers'

import { useRouter } from 'next/router';
import { ANNOUNCEMENT_BAR_BORDER } from '@app/variables/theme';

const XinvMigrationMessage = () => {
  const symbol = process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL
  return <>
    <Text>
      x{symbol} migration is in progress. Please withdraw funds from <b>{symbol} (OLD)</b> and resupply them into the new <b>{symbol}</b>
    </Text>
  </>
}

const MessageWithLink = ({ href, msg }: { href: string, msg: string }) => {
  return <Link
    pl={1}
    color="mainTextColor"
    isExternal={href.startsWith('http') ? true : false}
    href={href}
    _hover={{ color: 'primary.100' }}
  >
    {msg}
    <ExternalLinkIcon ml="2" />
  </Link>
}

const logos = [...Array(22).keys()];

export const Announcement = ({ isLanding = false }: { isLanding?: boolean }) => {
  const router = useRouter()
  const { balances } = useSupplyBalances()
  const needsXinvMigration = balances && balances[OLD_XINV] && Number(utils.formatEther(balances[OLD_XINV])) > 0.1

  const replaceLogo = (idx: number) => {
    document.querySelectorAll('img[src*=anchor-logo],img[src*=dola-],img[src*=fed],img[src*=logoTrial]').forEach(i => i.src = `/assets/dola/${idx}.png?logoTrial`)
  }

  return (
    <>
      <Flex
        bgColor={'white'}
        background={isLanding ? undefined : "white"}
        borderBottom={isLanding ? undefined : ANNOUNCEMENT_BAR_BORDER}
        w="full"
        h="100px"
        fontSize="lg"
        justify="center"
        textAlign="center"
        alignItems="center"
        fontWeight="semibold"
        color={'mainTextColor'}
        // cursor="pointer"
        // onClick={() => router.push('/inv')}
        data-testid={TEST_IDS.announcement}
      >
        <HStack spacing="6" w="fit-content">
          <Text color="#333" fontSize="12px">Logos:</Text>
          {logos.map((logo, i) => (
            <VStack onClick={() => replaceLogo(i)} cursor="pointer" position="relative">
              <Text color="#333" fontSize="12px">{i}</Text>
              <Image
                transition="ease-in-out"
                transitionDuration="500ms"
                _hover={{ transform: 'scale(10) translateY(8px)', zIndex: '99' }}
                src={`/assets/dola/${i}.png`}
                ignoreFallback={true}
                width="20px"
                height="20px"
              />
            </VStack>
          ))}
        </HStack>
      </Flex>
      <Flex
        bgColor={'white'}
        background={isLanding ? undefined : "black"}
        borderBottom={isLanding ? undefined : ANNOUNCEMENT_BAR_BORDER}
        w="full"
        h="100px"
        fontSize="lg"
        justify="center"
        textAlign="center"
        alignItems="center"
        fontWeight="semibold"
        color={'mainTextColor'}
        // cursor="pointer"
        // onClick={() => router.push('/inv')}
        data-testid={TEST_IDS.announcement}
      >
        <HStack spacing="6" w="fit-content">
          <Text color="#ccc" fontSize="12px">Logos:</Text>
          {logos.map((logo, i) => (
            <VStack onClick={() => replaceLogo(i)} cursor="pointer" position="relative">
              <Text color="#ccc" fontSize="12px">{i}</Text>
              <Image
                transition="ease-in-out"
                transitionDuration="500ms"
                _hover={{ transform: 'scale(10) translateY(8px)', zIndex: '99' }}
                src={`/assets/dola/${i}.png`}
                ignoreFallback={true}
                width="20px"
                height="20px"
              />
            </VStack>
          ))}
        </HStack>
      </Flex>
      <Flex
        bgColor={'white'}
        background={isLanding ? undefined : "mainBackgroundColor"}
        borderBottom={isLanding ? undefined : ANNOUNCEMENT_BAR_BORDER}
        w="full"
        h="100px"
        fontSize="lg"
        justify="center"
        textAlign="center"
        alignItems="center"
        fontWeight="semibold"
        color={'mainTextColor'}
        // cursor="pointer"
        // onClick={() => router.push('/inv')}
        data-testid={TEST_IDS.announcement}
      >
        <HStack spacing="6" w="fit-content">
          <Text color="#ccc" fontSize="12px">Logos:</Text>
          {logos.map((logo, i) => (
            <VStack onClick={() => replaceLogo(i)} cursor="pointer" position="relative">
              <Text color="#ccc" fontSize="12px">{i}</Text>
              <Image
                transition="ease-in-out"
                transitionDuration="500ms"
                _hover={{ transform: 'scale(10) translateY(8px)', zIndex: '99' }}
                src={`/assets/dola/${i}.png`}
                ignoreFallback={true}
                width="20px"
                height="20px"
              />
            </VStack>
          ))}
        </HStack>
      </Flex>
      <Flex
        bgColor={'white'}
        background={isLanding ? undefined : "#100e21"}
        borderBottom={isLanding ? undefined : ANNOUNCEMENT_BAR_BORDER}
        w="full"
        h="100px"
        fontSize="lg"
        justify="center"
        textAlign="center"
        alignItems="center"
        fontWeight="semibold"
        color={'mainTextColor'}
        // cursor="pointer"
        // onClick={() => router.push('/inv')}
        data-testid={TEST_IDS.announcement}
      >
        <HStack spacing="6" w="fit-content">
          <Text color="#ccc" fontSize="12px">Logos:</Text>
          {logos.map((logo, i) => (
            <VStack onClick={() => replaceLogo(i)} cursor="pointer" position="relative">
              <Text color="#ccc" fontSize="12px">{i}</Text>
              <Image
                transition="ease-in-out"
                transitionDuration="500ms"
                _hover={{ transform: 'scale(10) translateY(8px)', zIndex: '99' }}
                src={`/assets/dola/${i}.png`}
                ignoreFallback={true}
                width="20px"
                height="20px"
              />
            </VStack>
          ))}
        </HStack>
      </Flex>
    </>
  )
}

