import { Text, VStack } from '@chakra-ui/react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton';
import { useRouter } from 'next/router';

export const TokenCard = ({
    bg,
    name,
    subtitle,
    description,
    href,
}: {
    bg: string
    name: string
    subtitle: string
    description: any
    href?: string
}) => {
    const router = useRouter();

    return <VStack
        cursor={ href ? 'pointer' : undefined }
        w='full'
        alignItems="flex-start"
        spacing="4"
        transitionProperty="transform"
        transitionDuration="500ms"
        _hover={href ? { transform: 'scale(1.05)' } : undefined }
        onClick={href ? () => router.push(href) : undefined}
    >
        <VStack w='full' alignItems="flex-start" spacing="0">
            <Text as="h2" fontSize="30px" fontWeight="extrabold">{name}</Text>
            <Text color="secondaryTextColor" as="h2" fontSize="20px" fontWeight="bold">{subtitle}</Text>
        </VStack>
        <BigImageButton
            w="full"
            h="200px"
            bg={bg}
            href={href}
        />
        {description}
    </VStack>
}

export const DOLATokenCard = ({
    clickable = true
}) => <TokenCard
    name="DOLA"
    subtitle="Decentralized Stablecoin"
    bg="url('/assets/v2/dola.webp')"
    href={ clickable ? "/tokens/dola" : undefined }
    description={
        <VStack w='full' alignItems="flex-start">
            <Text color="secondaryTextColor">- Debt-backed stablecoin</Text>
            <Text color="secondaryTextColor">- Decentralized</Text>
            <Text color="secondaryTextColor">- Strong peg</Text>
            <Text color="secondaryTextColor">- On Ethereum, Optimism and Fantom</Text>
        </VStack>
    }
/>
export const INVTokenCard = ({
    clickable = true
}) => <TokenCard
    name="INV"
    subtitle="Governance Token"
    bg="url('/assets/stake-inv.png')"
    href={ clickable ? "/tokens/inv" : undefined }
    description={
        <VStack w='full' alignItems="flex-start">
            <Text color="secondaryTextColor">- Governance Token</Text>
            <Text color="secondaryTextColor">- High-yield staking</Text>
            <Text color="secondaryTextColor">- Delegate your votes at no cost</Text>
            <Text color="secondaryTextColor">- On Ethereum</Text>
        </VStack>
    }
/>
export const DBRTokenCard = ({
    clickable = true
}) => <TokenCard
    name="DBR"
    subtitle="DOLA Borrowing Rights token"
    bg="url('/assets/v2/dbr.webp')"
    href={ clickable ? "/tokens/dbr" : undefined }
    description={
        <VStack w='full' alignItems="flex-start">
            <Text color="secondaryTextColor">- DOLA Borrowing Rights Token</Text>
            <Text color="secondaryTextColor">- Lock-in a Borrow Rate for DOLA</Text>
            <Text color="secondaryTextColor">- Tradable Borrow Rate</Text>
            <Text color="secondaryTextColor">- On Ethereum</Text>
        </VStack>
    }
/>