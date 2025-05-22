import { HStack, Image, Stack, Text, useDisclosure, VStack } from '@chakra-ui/react'
import { MENUS } from '@app/variables/menus'
import Link from '@app/components/common/Link'
import { useAppTheme } from '@app/hooks/useAppTheme';
import { lightTheme } from '@app/variables/theme';
import { LandingOutlineButton } from '../Button/RSubmitButton';
import { smallerSize2, smallerSize3, smallerSize4, smallerSize5, normalSize, slightlyBiggerSize } from '@app/variables/responsive';
import { NewsletterModal } from '../Modal/NewsletterModal';
import Logo from '../Logo';
import { GeistText, landingDarkNavy2, LandingHeading, landingMutedColor } from '../Landing/LandingComponents';

const SOCIALS = [
  {
    image: <Image src="/assets/landing/discord.svg" alt="Discord" w="40px" h="auto" />,
    href: 'https://discord.gg/inversefinance',
  },
  {
    image: <Image src="/assets/landing/x.svg" alt="X" w="40px" h="auto" />,
    href: 'https://x.com/inversefinance',
  },
  {
    image: <Image src="/assets/landing/github.svg" alt="Governance" w="40px" h="auto" />,
    href: 'https://github.com/inversefinance',
  },
  {
    image: <Image src="/assets/landing/warpcast.svg" alt="Governance" w="40px" h="auto" />,
    href: 'https://warpcast.com/inversefinance',
  },
];

const LINK_GROUPS = MENUS.footerGroups;

export const FooterV2 = ({ isLanding = false }: { isLanding?: boolean }) => {
  const { themeName } = useAppTheme();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isLight = isLanding || themeName !== 'dark';
  const textColor = isLight ? lightTheme.colors.mainTextColor : undefined;
  const secTextColor = isLight ? landingDarkNavy2 : undefined;
  const bgColor = 'white';//isLight ? lightTheme.colors.mainTextColor : 'transparent';
  const isBottom = false;

  return <Stack
    bg="linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%);"
    zIndex="1"
    w="full"
    maxW="1400px"
    direction={{ base: 'column', lg: 'row' }}
    spacing={8}
    p={8}
    pt="150px"
    px="8%"
    justify="space-between"
    color="mainTextColor"
  >
    <VStack align="flex-start" spacing={8}>
      <Stack borderRadius="4px" p="40px" bgColor={bgColor} width={{ base: 'full', lg: '450px' }} spacing={'30px'}>
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
          <Text className="landing-v3-text" as={isBottom ? 'h3' : 'h1'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
            fontSize={isBottom ? normalSize : slightlyBiggerSize}
          >
            <b>Inverse</b> Finance
          </Text>
        </Stack>
        <VStack align="flex-start">
          <Stack direction="row" align="center">
            <LandingHeading fontSize={"xl"} fontWeight="bold" color={textColor}>Subscribe to Our Newsletter</LandingHeading>
          </Stack>
          <GeistText fontSize={smallerSize4} color={secTextColor}>
            Join thousands of subscribers in receiving weekly updates about Inverse products, partnerships, and early-bird news shared only with subscribers!
          </GeistText>
          <Stack pt="3" alignItems={{ base: 'center', sm: 'flex-start' }}>
            <NewsletterModal isOpen={isOpen} onClose={onClose} />
            <LandingOutlineButton onClick={() => onOpen()} w={{ base: '150px', '2xl': 'auto' }} fontSize={smallerSize2} py="0" px="1vw">
              Subscribe Now
            </LandingOutlineButton>
          </Stack>
        </VStack>
      </Stack>
      <Stack w='full' justifyContent="space-between" direction="row">
        {SOCIALS.map(({ href, image }, i) => (
          <Link _hover={{ cursor: 'pointer' }} target="_blank" isExternal key={i} href={href} as="a">
            <VStack bgColor={bgColor} p="4" borderRadius="4px">
              {image}
            </VStack>
          </Link>
        ))}
      </Stack>
    </VStack>
    <Stack
      borderRadius="4px" p="40px" bgColor={bgColor} width={{ base: 'full', lg: '600px' }} spacing={8}
      direction="column"
    >
      <LandingHeading fontSize="xl">
        Check out these links before you go
      </LandingHeading>
      <HStack
        wrap="wrap"
        shouldWrapChildren
        zIndex="0"
        justify="space-between"
        align="flex-start"
         w="full"
      >
        {LINK_GROUPS.map(({ groupLabel, items }) => (
          <Stack key={groupLabel} w={{ base: 28 }} spacing="1">
            <Text fontSize={smallerSize3} fontWeight="bold" color={landingDarkNavy2}>{groupLabel}</Text>
            {items.map(({ label, href, isExternal }, i) => (
              <Link
                _hover={{ color: secTextColor, textDecoration: 'underline' }}
                color={landingMutedColor}
                key={i}
                href={href}
                fontSize={smallerSize5}
                as="a"
                isExternal={isExternal}
                target={isExternal ? '_blank' : undefined}
              >
                {label}
              </Link>
            ))}
          </Stack>
        ))}
      </HStack>
    </Stack>
  </Stack>
}

export default FooterV2
