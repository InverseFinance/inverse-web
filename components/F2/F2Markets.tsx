import { Badge, Divider, Flex, HStack, Stack, Text, useMediaQuery, VStack, Input as ChakraInput, Image, PopoverBody, Popover, PopoverTrigger, PopoverContent, InputGroup, InputLeftElement, Select, useDisclosure, SimpleGrid } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { useRouter } from 'next/router';
import { useAccount } from '@app/hooks/misc';
import { calculateNetApy, getRiskColor } from "@app/util/f2";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import Table from "@app/components/common/Table";
import { useFirmTVL } from "@app/hooks/useTVL";
import { AnchorPoolInfo } from "../Anchor/AnchorPoolnfo";
import { OracleType, OracleTypeTooltipContent } from "./Infos/OracleType";
import { SkeletonList } from "@app/components/common/Skeleton";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { gaEvent } from "@app/util/analytics";
import { DailyLimitCountdown } from "@app/components/common/Countdown";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { SafetyBadges } from "./SecurityMiniCaroussel";
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon, InfoIcon, SearchIcon, SettingsIcon } from "@chakra-ui/icons";
import { SplashedText } from "../common/SplashedText";
import { lightTheme } from "@app/variables/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "../common/Link";
import { calculateMaxLeverage } from "@app/util/misc";
import { LPImages } from "../common/Assets/LPImg";
import { TextInfo } from "../common/Messages/TextInfo";
import { RadioCardGroup } from "../common/Input/RadioCardGroup";
import useStorage from "@app/hooks/useStorage";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { InfoMessage } from "../common/Messages";
import ConfirmModal from "../common/Modal/ConfirmModal";
import { Input } from "../common/Input";
import { getNetworkConfigConstants } from "@app/util/networks";
import FirmLogo from "../common/Logo/FirmLogo";
import { F2Market } from "@app/types";
import InfoModal from "../common/Modal/InfoModal";
import { YieldBreakdownTable } from "./rewards/YieldBreakdownTable";

const { F2_CONTROLLER } = getNetworkConfigConstants();

export const MARKET_INFOS = {
    'INV': {
        name: 'INV',
        fullname: 'Inverse DAO',
        description: 'The Governance token of the Inverse Finance DAO, staking it prevents from being diluted if new tokens are minted and the stakers also get real-yield with DBR rewards.',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68',
    },
    'WETH': {
        name: 'WETH',
        fullname: 'Wrapped ETH',
        description: 'In this market you can use ETH or Wrapped ETH',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    'sFRAX': {
        name: 'sFRAX',
        fullname: 'Staked FRAX',
        description: 'sFRAX is an ERC4626 staking vault that distributes part of the Frax Protocol yield weekly to stakers denominated in FRAX stablecoins.',
        getLink: 'https://app.frax.finance/sfrax/stake',
    },
    'DAI': {
        name: 'DAI',
        fullname: 'Dai Stablecoin',
        description: 'When DAI is deposited on FiRM it is automatically staked in the DAI Savings Rate contract to benefit from the yield, the staked version of DAI is known as sDAI.',
        getLink: 'https://app.spark.fi/',
    },
    'CVX': {
        name: 'CVX',
        fullname: 'Convex Token',
        description: 'CVX is the native platform token for Convex Finance',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
    },
    'cvxCRV': {
        name: 'cvxCRV',
        fullname: 'Convex CRV',
        description: 'Stake the CRV token to get cvxCRV, when deposited on FiRM you still get all the rewards of cvxCRV',
        getLink: 'https://curve.convexfinance.com/stake',
    },
    'cvxFXS': {
        name: 'cvxFX',
        fullname: 'Convex FXS',
        description: 'Stake the FXS (Frax Share token) to get cvxFXS, when deposited on FiRM you still get all the rewards of cvxFXS',
        getLink: 'https://frax.convexfinance.com/stake',
    },
    'CRV': {
        name: 'CRV',
        fullname: 'Curve Token',
        description: 'CRV is the native platform token for Curve Finance',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xd533a949740bb3306d119cc777fa900ba034cd52',
    },
    'stETH': {
        name: 'stETH',
        fullname: 'Staked ETH',
        description: 'Liquid staked ETH by Lido, rebasing token',
        getLink: 'https://stake.lido.fi/',
    },
    'wstETH': {
        name: 'wstETH',
        fullname: 'Wrapped Staked ETH',
        description: 'Wrapped version of stETH with no rebasing',
        getLink: 'https://stake.lido.fi/wrap',
    },
    'st-yETH': {
        name: 'st-yETH',
        fullname: 'Staked yETH',
        description: 'Staked version of yETH, a user-governed liquidity pool token consisting of various Ethereum Liquid Staking Derivatives (LSTs), by Yearn',
        getLink: 'https://yeth.yearn.fi/',
    },
    'st-yCRV': {
        name: 'st-yCRV',
        fullname: 'Staked yCRV',
        description: "Staked version of yCRV, which is Yearn's veCRV yLocker product. It is designed to tokenize the different benefits of a veCRV position in a simple, user-friendly way",
        getLink: 'https://ycrv.yearn.fi/app/deposit'
    },
    'WBTC': {
        name: 'WBTC',
        fullname: 'Wrapped Bitcoin',
        description: 'Wrapped “There is no second best”',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    'gOHM': {
        name: 'gOHM',
        fullname: 'Governance OHM',
        description: 'gOHM, or Governance OHM, is an ERC-20 token that is the only token used for proposing upgrades to Olympus protocol. gOHM can be obtained by wrapping OHM, and vice versa. The only use cases of gOHM today is for voting in governance and as collateral to take a Cooler Loan.',
        getLink: 'https://app.olympusdao.finance/#/my-balances',
    },
    'COMP': {
        name: 'COMP',
        fullname: 'Compound Finance',
        description: 'COMP is the native platform token for Compound Finance, when depositing COMP on FiRM you keep your Governance Rights thanks to the Personal Collateral Escrow design.',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&tab=swap&to=0xc00e94cb662c3520282e6f5717214004a7f26888',
    },
    'sUSDe': {
        name: 'sUSDe',
        fullname: 'Staked sUSDe',
        description: 'sUSDe is staked USDe which is a synthetic stablecoin by Ethena, backed with crypto assets and corresponding short futures positions. Borrowing in this market will get you Ethena points, for more info check the Ethena website.',
        getLink: 'https://app.ethena.fi/stake',
    },
    'cbBTC': {
        name: 'cbBTC',
        fullname: 'Coinbase Wrapped Bitcoin',
        description: "Coinbase Wrapped BTC is a token backed 1:1 by native Bitcoin held by Coinbase. It is a transferable token that is redeemable for the underlying BTC and is built to be seamlessly compatible with DeFi applications.",
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    },
    'PT-sUSDe-27MAR25': {
        name: 'PT-sUSDe-27MAR25',
        fullname: 'Pendle - PT-sUSDe-27MAR25',
        description: 'The Principal Token for the Pendle sUSDe-27MAR2025 that is a fixed yield asset thanks to Pendle\'s split of yield-bearing assets into Principal and Yield tokens',
        getLink: 'https://app.pendle.finance/trade/markets/0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce/swap?view=pt&chain=ethereum&page=1',
    },
}

const getMarketInfos = ({ marketName, underlying }: { marketName: string, underlying: F2Market['underlying'] }) => {
    const marketInfos = MARKET_INFOS[marketName];
    if (marketInfos) {
        return marketInfos;
    }
    const prefix = underlying.isYearnV2LP ? "Yearn vault - " : "";
    const suffix = underlying.isLP ? "" : " LP";
    return {
        name: marketName,
        fullname: `${prefix}${marketName}${suffix}`,
        description: underlying.isLP ?
            (underlying.isYearnV2LP ?
                `The Yearn Vault for the Curve ${marketName} LP, the yearn vault auto-compounds the rewards of the ${marketName} LP increasing the vault token price`
                : `The LP token for the ${marketName} pool on Curve, when deposited on FiRM the LP token will be then deposited into Convex to earn claimable CVX+CRV rewards`)
            : "",
        getLink: underlying.link || "",
    };
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

export const MarketInfos = ({ name, underlying, nameAndIcon, ...props }) => {
    const marketInfos = getMarketInfos({ marketName: name, underlying });
    if (!marketInfos) {
        return null;
    }
    return <VStack onClick={(e) => e.stopPropagation()} py="4" px="4" cursor="default" w='full' alignItems="flex-start" {...props}>
        <HStack spacing="4" alignItems="center" justify="flex-start" w='full'>
            <Stack>
                {nameAndIcon}
            </Stack>
            <Text>-</Text>
            <Text fontSize="18px" fontWeight="extrabold">{marketInfos.fullname}</Text>
        </HStack>
        <Text fontSize="16px" color="mainTextColorLight">{marketInfos.description}</Text>
        <Link fontSize="14px" textDecoration="underline" href={marketInfos.getLink} isExternal target="_blank">
            Get {name} <ExternalLinkIcon />
        </Link>
    </VStack>
}

export const MarketNameAndIcon = ({ marketIcon, icon, underlying, name, lpSize = 18, size = 25 }) => {
    return <HStack maxW='180px' justify="flex-start" alignItems="center" spacing="2" w='full'>
        {
            !underlying.isLP ? <BigImageButton bg={`url('${marketIcon || icon || underlying.image}')`} h={`${size}px`} w={`${size}px`} backgroundSize='contain' backgroundRepeat="no-repeat" />
                : <LPImages alternativeDisplay={true} lpToken={{ pairs: underlying.pairs, image: underlying.image, protocolImage: underlying.protocolImage }} chainId={1} imgSize={lpSize} />
        }
        {
            !!name && <CellText textOverflow="clip" overflow="hidden" whiteSpace="nowrap" fontWeight="bold" fontSize={{ base: '14px', '2xl': name.length > 14 ? '14px' : name.length > 12 ? '15px' : '18px' }}>
                {name}
            </CellText>
        }
    </HStack>
}

const MarketCell = ({ icon, marketIcon, underlying, badgeInfo, badgeProps, name, _isMobileCase }) => {
    const nameAndIcon = <MarketNameAndIcon name={name} icon={icon} marketIcon={marketIcon} underlying={underlying} />
    return <Cell minWidth="180px" position="relative">
        <Popover closeOnBlur={true} trigger="hover" isLazy placement="right-end" strategy={_isMobileCase ? 'fixed' : 'absolute'}>
            <PopoverTrigger>
                <Cell minWidth='180px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack onClick={(e) => e.stopPropagation()} spacing="1" w="fit-content">
                        {nameAndIcon}<InfoIcon cursor="default" position="absolute" right="-18px" opacity="0.5" color="mainTextColor" />
                    </HStack>
                    {
                        !!badgeInfo && <CellText fontWeight="bold">
                            <Badge fontWeight="normal"
                                textTransform="none"
                                borderRadius="50px"
                                px="8px"
                                {...badgeProps}>
                                {badgeInfo}
                            </Badge>
                        </CellText>
                    }
                </Cell>
            </PopoverTrigger>
            <PopoverContent transform="translateX(300px)" bgColor="containerContentBackground" zIndex="99" border="1px solid #ccc" _focus={{ outline: 'none' }} maxW={_isMobileCase ? '100vw' : '98vw'} w='600px'>
                <PopoverBody onClick={(e) => e.stopPropagation()}>
                    <MarketInfos nameAndIcon={nameAndIcon} name={name} underlying={underlying} />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    </Cell>
}

const CollateralFactorCell = ({ collateralFactor, isLeverageComingSoon, supplyApy, borrowPaused, dbrPriceUsd, _isMobileCase }: { collateralFactor: number, borrowPaused: boolean, _isMobileCase: boolean }) => {
    const maxLong = calculateMaxLeverage(collateralFactor);
    return <Cell spacing="0" direction="column" minWidth="70px" alignItems={_isMobileCase ? 'flex-end' : 'center'} justify="center" >
        <CellText>{shortenNumber(collateralFactor * 100, 0)}%</CellText>
        {
            (!borrowPaused && !isLeverageComingSoon) && <>
                {!_isMobileCase && <CellText>&nbsp;</CellText>}
                <CellText color="mainTextColorLight" transform={_isMobileCase ? undefined : 'translateY(10px)'} position={_isMobileCase ? 'static' : 'absolute'} fontSize="12px">Long up to x{smartShortNumber(maxLong, 2)}</CellText>
            </>
        }
    </Cell>
}

export const MarketApyInfos = ({ showLeveragedApy = true, isLeverageComingSoon, isUserApy, maxApy, minWidth = "140px", name, supplyApy, supplyApyLow, extraApy, price, underlying, hasClaimableRewards, isInv, borrowPaused, rewardTypeLabel, collateralFactor, dbrPriceUsd, _isMobileCase }) => {
    const maxLong = calculateMaxLeverage(collateralFactor);
    const totalApy = ((supplyApy || 0) + (extraApy || 0));
    return <Cell spacing="0" direction="column" minWidth={minWidth} alignItems={_isMobileCase ? 'flex-end' : 'center'} justify="center" fontSize="14px">
        <HStack>
            <AnchorPoolInfo
                // protocolImage={underlying.protocolImage}
                value={supplyApy}
                valueExtra={extraApy}
                valueLow={supplyApyLow}
                priceUsd={price}
                symbol={underlying.symbol}
                type={'supply'}
                textProps={{ textAlign: "end" }}
                hasClaimableRewards={hasClaimableRewards}
            />
            {
                name === 'sUSDe' && <HStack spacing="1">
                    <Image src={'https://assets.coingecko.com/coins/images/36530/standard/ethena.png?1711701436'} h="15px" w="15px" />
                    <Text fontSize="12px" color="mainTextColorLight">x5</Text>
                </HStack>
            }
        </HStack>
        {
            totalApy > 0 && <Text fontSize="12px" color="mainTextColorLight">
                {(isUserApy ? 'Your Fixed APY' : rewardTypeLabel) || (isInv ? supplyApy > 0 ? 'INV + DBR APR' : 'DBR APR' : hasClaimableRewards ? 'Claimable APR' : 'Rebase APY')}
            </Text>
        }
        {
            showLeveragedApy && !borrowPaused && !isLeverageComingSoon && maxApy > totalApy && dbrPriceUsd > 0 && <CellText fontSize="12px" color="accentTextColor">
                Up to <b>{maxApy.toFixed(2)}%</b> at x{smartShortNumber(maxLong, 2)}
            </CellText>
        }
    </Cell>
}

const leverageColumn = {
    field: 'maxApy',
    label: 'Leverage',
    header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    tooltip: <VStack>
        <Text><b>Net APY</b>: Annual Percentage Yield at maximum theoretical leverage with the borrowing cost already deducted (at current DBR price), your Net APY depends on the actual price you bought DBR at</Text>
        <Text><b>Long up to</b>: theoretical maximum leverage with DOLA at $1 and borrow limit at 100%</Text>
    </VStack>,
    value: ({ maxApy, name, isLeverageComingSoon, supplyApy, supplyApyLow, extraApy, price, underlying, hasClaimableRewards, isInv, rewardTypeLabel, dbrPriceUsd, collateralFactor, borrowPaused, _isMobileCase }) => {
        const maxLong = calculateMaxLeverage(collateralFactor);
        const totalApy = ((supplyApy || 0) + (extraApy || 0));
        return <Cell spacing="0" direction="column" minWidth="100px" alignItems="center">
            {
                !borrowPaused && dbrPriceUsd > 0 && maxApy > totalApy ? <>
                    <CellText fontSize="14px" color="accentTextColor">
                        Up to <b>{maxApy.toFixed(2)}%</b>
                    </CellText>
                    <CellText fontSize="12px" color="mainTextColorLight">
                        Net APY at x{smartShortNumber(maxLong, 2)}
                    </CellText>
                </>
                    : borrowPaused ? <MarketApyInfos
                        minWidth="100px"
                        name={name}
                        isLeverageComingSoon={isLeverageComingSoon}
                        borrowPaused={borrowPaused}
                        supplyApy={supplyApy}
                        supplyApyLow={supplyApyLow}
                        extraApy={extraApy}
                        dbrPriceUsd={dbrPriceUsd}
                        collateralFactor={collateralFactor}
                        price={price}
                        underlying={underlying}
                        hasClaimableRewards={hasClaimableRewards}
                        isInv={isInv}
                        rewardTypeLabel={rewardTypeLabel}
                        _isMobileCase={_isMobileCase}
                        showLeveragedApy={false}
                    /> : <CellText fontSize="12px" color="mainTextColorLight">
                        Long up to x{smartShortNumber(maxLong, 2)}
                    </CellText>
            }
        </Cell>
    },
};

const columns = [
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="180px" justify="flex-start"  {...props} />,
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: (props) => {
            return <MarketCell {...props} />
        },
    },
    {
        field: 'supplyApy',
        label: 'Underlying APY',
        tooltip: 'The APY provided by the asset itself (or via its claimable rewards) and that is kept even after supplying. This is not an additional APY from FiRM. If leverage is possible the Net yield at maximum theoretical leverage will be showed as well.',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="center"  {...props} />,
        value: ({ name, isUserApy, isLeverageComingSoon, maxApy, isLeverageView, supplyApy, supplyApyLow, extraApy, price, underlying, hasClaimableRewards, isInv, rewardTypeLabel, dbrPriceUsd, collateralFactor, borrowPaused, _isMobileCase }) => {
            return <MarketApyInfos
                name={name}
                isLeverageComingSoon={isLeverageComingSoon}
                isUserApy={isUserApy}
                borrowPaused={borrowPaused}
                supplyApy={supplyApy}
                supplyApyLow={supplyApyLow}
                extraApy={extraApy}
                dbrPriceUsd={dbrPriceUsd}
                maxApy={maxApy}
                collateralFactor={collateralFactor}
                price={price}
                underlying={underlying}
                hasClaimableRewards={hasClaimableRewards}
                isInv={isInv}
                rewardTypeLabel={rewardTypeLabel}
                _isMobileCase={_isMobileCase}
                showLeveragedApy={!isLeverageView}
            />
        },
    },
    // {
    //     field: 'oracleType',
    //     label: 'Oracle Type',
    //     tooltip: <OracleTypeTooltipContent />,
    //     header: ({ ...props }) => <ColHeader minWidth="110px" justify="center"  {...props} />,
    //     value: ({ oracleType, underlying }) => {
    //         return <Cell alignItems="center" minWidth="110px" justify="center" fontSize="12px">
    //             <OracleType showTooltip={true} showImage={false} oracleType={oracleType} subText={underlying.symbol === 'gOHM' ? 'index' : undefined} />
    //         </Cell>
    //     },
    // },
    // {
    //     field: 'price',
    //     label: 'price',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ price }) => {
    //         return <Cell minWidth="100px" justify="center" >
    //             <CellText>${commify((price||0)?.toFixed(2))}</CellText>
    //         </Cell>
    //     },
    // },
    {
        field: 'collateralFactor',
        label: 'CF',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        tooltip: <VStack>
            <Text><b>Collateral Factor</b>: maximum percentage of collateral value that can be used for borrowing.</Text>
            <Text><b>Long up to</b>: theoretical maximum leverage with DOLA at $1 and borrow limit at 100%</Text>
        </VStack>,
        value: ({ collateralFactor, borrowPaused, supplyApy, dbrPriceUsd, _isMobileCase, isLeverageComingSoon }) => {
            return <CollateralFactorCell dbrPriceUsd={dbrPriceUsd} supplyApy={supplyApy} _isMobileCase={_isMobileCase} collateralFactor={collateralFactor} borrowPaused={borrowPaused} isLeverageComingSoon={isLeverageComingSoon} />
        },
    },
    {
        field: 'tvl',
        label: 'TVL',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        tooltip: 'Total Value Locked',
        value: ({ tvl }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText>{tvl > 0 ? shortenNumber(tvl, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'Borrows',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        tooltip: 'Total DOLA borrowed in the Market',
        value: ({ totalDebt, borrowPaused }) => {
            return <Cell minWidth="80px" justify="center" >
                <CellText>{!totalDebt ? '-' : smartShortNumber(totalDebt, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaLiquidity',
        label: 'DOLA Liquidity',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Remaining borrowable DOLA liquidity, not taking into account daily limits',
        value: ({ dolaLiquidity, borrowPaused }) => {
            return <Cell minWidth="120px" justify="center" >
                <CellText>{borrowPaused || dolaLiquidity < 1 ? '-' : smartShortNumber(dolaLiquidity, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'leftToBorrow',
        label: "Available to borrow",
        header: ({ ...props }) => <ColHeader minWidth="135px" justify="center"  {...props} />,
        tooltip: 'Markets can have daily borrow limits, this shows the DOLA left to borrow for the day (UTC timezone)',
        value: ({ leftToBorrow, totalDebt, dailyLimit, dolaLiquidity, borrowPaused, borrowController }) => {
            return <Cell minWidth="135px" justify="center" alignItems="center" direction="column" spacing="0" >
                {
                    borrowPaused ? <CellText>Borrow Paused</CellText> : <>
                        <CellText>{leftToBorrow > 1 ? smartShortNumber(leftToBorrow, 2) : totalDebt ? 'Depleted' : 'No liquidity'}</CellText>
                        {
                            leftToBorrow < dailyLimit && dolaLiquidity > 0 && leftToBorrow < dolaLiquidity && smartShortNumber(dolaLiquidity, 2) !== smartShortNumber(leftToBorrow, 2)
                            && <CellText overflow="visible" whiteSpace="nowrap" minW="130px" textAlign={{ base: 'right', sm: 'left' }} fontSize={{ base: '10px', sm: '12px' }} color="mainTextColorLight2">
                                {
                                    borrowController === F2_CONTROLLER ?
                                        <DailyLimitCountdown prefix="Limit resets in " /> : <>Gradual return to daily limit</>
                                }
                            </CellText>
                        }
                    </>
                }
            </Cell>
        },
    },
    // {
    //     field: 'collateralBalance',
    //     label: 'Wallet',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     tooltip: 'Collateral balance in your wallet',
    //     value: ({ collateralBalance, price, account }) => {
    //         return <Cell minWidth="100px" justify="center" alignItems="center" direction={{ base: 'row', sm: 'column' }} spacing={{ base: '1', sm: '0' }}>
    //             {
    //                 account && collateralBalance > 0 ? <>
    //                     <CellText>{shortenNumber(collateralBalance, 2)}</CellText>
    //                     <CellText>({shortenNumber(collateralBalance * price, 2, true)})</CellText>
    //                 </> : <>-</>
    //             }
    //         </Cell>
    //     },
    // },
    {
        field: 'depositsUsd',
        label: 'Your Deposits',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of Collateral you deposited in the Market',
        value: ({ depositsUsd, deposits, account, collateralBalance, collateralBalanceUsd, underlying }) => {
            return <Cell minWidth="120px" justify="center" alignItems="center" direction={{ base: 'row', sm: 'column' }} spacing={{ base: '1', sm: '0' }}>
                {
                    account && collateralBalanceUsd > 1 && <Badge display={{ base: 'none', xl: 'inline-block' }} bgColor="mainTextColor" color="contrastMainTextColor" position="absolute" top="-4.5px" textTransform="none">
                        {shortenNumber(collateralBalance, 2)} {underlying.symbol} available in your wallet
                    </Badge>
                }
                {
                    account && deposits > 0 ? <>
                        <CellText>{smartShortNumber(deposits, 2)}</CellText>
                        <CellText>({smartShortNumber(depositsUsd, 2, true)})</CellText>
                    </> : <>-</>
                }
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Your Debt',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ debt, account }) => {
            return <Cell minWidth="80px" justify="center">
                <CellText>{account && debt > 0 ? smartShortNumber(debt, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Your Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="116px" justify="flex-end"  {...props} />,
        tooltip: 'Your Borrow Limit, should not reach 160%, otherwise liquidations can happen',
        value: ({ perc, debt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="110px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(100 - perc, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

const columnsWithout = columns.slice(0, 9);
const leverageColumns = [...columns];
const leverageColumnsWithout = [...columnsWithout];
leverageColumns.splice(2, 1, leverageColumn);
leverageColumnsWithout.splice(2, 1, leverageColumn);

const firmImages = {
    'dark': 'firm-final-logo-white.png',
    'light': 'firm-final-logo.png',
}

const responsiveThreshold = 1260;

export const F2Markets = ({
    isDashboardPage = false
}: {
    isDashboardPage?: boolean
}) => {
    const { markets } = useDBRMarkets();
    const account = useAccount();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const router = useRouter();
    const { firmTvls, isLoading: tvlLoading } = useFirmTVL();
    const { themeStyles, themeName } = useAppTheme();
    const [showMyPositions, setShowMyPositions] = useState(true);
    const [showOther, setShowOther] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [isSmallerThan] = useMediaQuery(`(max-width: ${responsiveThreshold}px)`);
    const { isOpen: isSetDbrUserRefPriceOpen, onOpen: openSetDbrUserRefPrice, onClose: closeSetDbrUserRefPrice } = useDisclosure();
    const { isOpen: isOpenYieldBreakdown, onOpen: openYieldBreakdown, onClose: closeYieldBreakdown } = useDisclosure();
    const { value: dbrUserRefPrice, setter: saveDbrUserRefPrice } = useStorage(`dbr-user-ref-price-${account}`);
    const [newDbrUserRefPrice, setNewDbrUserRefPrice] = useState(dbrUserRefPrice);

    useEffect(() => {
        if (dbrUserRefPrice !== newDbrUserRefPrice) {
            setNewDbrUserRefPrice(dbrUserRefPrice);
        }
    }, [dbrUserRefPrice]);

    const isLoading = tvlLoading || !markets?.length;

    const openMarket = (market: any) => {
        gaEvent({ action: `FiRM-list-open-market-${market.name}` });
        const newPath = router.asPath.replace(router.pathname, `/firm/${market.name}`);
        router.push(newPath);
    }

    // hide phasing out markets if user has no debt or deposits in it
    const accountMarketsWithoutPhasingOutMarkets = accountMarkets
        .filter(m => !m.isPhasingOut || (m.debt > 0 || (m.deposits * m.price) >= 1));

    const withDeposits = accountMarketsWithoutPhasingOutMarkets
        .filter(m => m.depositsUsd > 1 || m.debt > 1)
        .map(m => {
            return {
                ...m,
                totalApy: (m.supplyApy || 0) + (m.extraApy || 0),
                monthlyDbrBurnUsd: dbrUserRefPrice ? m.monthlyDbrBurn * dbrUserRefPrice : 0,
                monthlyNetUsdYield: dbrUserRefPrice ? m.monthlyUsdYield - m.monthlyDbrBurn * dbrUserRefPrice : 0,
                dbrUserRefPrice,
            }
        });

    const totalMonthlyNetUsdYield = withDeposits.reduce((prev, curr) => prev + curr.monthlyNetUsdYield, 0);
    const totalMonthlyUsdYield = withDeposits.reduce((prev, curr) => prev + curr.monthlyUsdYield, 0);

    const withoutDeposits = accountMarketsWithoutPhasingOutMarkets
        .filter(m => !(m.depositsUsd > 1 || m.debt > 1));

    const depositsUsd = withDeposits.reduce((prev, curr) => prev + curr.depositsUsd, 0);

    const toggleMyPositions = () => {
        setShowMyPositions(!showMyPositions);
    }

    const toggleOther = () => {
        setShowOther(!showOther);
    }

    const marketFilter = useCallback((m: any) => {
        let searchCondition = true;
        let categoryCondition = true;
        if (search) {
            searchCondition = m.name.toLowerCase().includes(search.toLowerCase())
        }
        if (category === 'majors') {
            categoryCondition = /(btc|eth)/i.test(m.name);
        }
        else if (category === 'leverage') {
            categoryCondition = !m.borrowPaused;
        }
        else if (category === 'stablecoins') {
            categoryCondition = m.underlying.isStable && !m.underlying.isLP;
        }
        else if (category === 'lps') {
            categoryCondition = m.underlying.isLP;
        }
        else if (category === 'yield-claimable') {
            categoryCondition = m.hasClaimableRewards;
        }
        else if (category === 'yield-compounding') {
            categoryCondition = !m.hasClaimableRewards && m.supplyApy > 0;
        }
        else if (category === 'curve-convex') {
            categoryCondition = /(crv|cvx)/i.test(m.name) && !/crvUSD/i.test(m.name)!;
        }
        return searchCondition && categoryCondition;
    }, [search, category]);

    const invMarketIsInOtherSection = withoutDeposits.some(m => m.isInv);

    const pinnedItems = invMarketIsInOtherSection ?
        ['0xb516247596Ca36bf32876199FBdCaD6B3322330B', ...(markets?.length > 0 ? markets.map(m => m.address).slice(markets.length - 2) : [])]
        : (markets?.length > 0 ? markets.map(m => m.address).slice(markets.length - 2) : []);

    const pinnedLabels = invMarketIsInOtherSection ? ['Stake', 'New', 'New'] : ['New', 'New'];

    const isLeverageView = useMemo(() => {
        return category === 'leverage';
    }, [category]);

    return <Container
        p={isDashboardPage ? '0' : '6'}
        label={
            <Stack h={{ base: 'auto', xl: '56px' }} direction={{ base: 'column', xl: 'row' }} alignItems="flex-start" justify="center">
                <FirmLogo transform="translateY(6px)" w='110px' h="auto" />
                <VStack h={{ base: 'auto', xl: '56px' }} overflow="hidden" spacing="0" alignItems="flex-start">
                    <Text display="inline-block" fontWeight="bold" fontSize={{ base: '14px', md: '16px', 'xl': '20px' }}>
                        {
                            !dbrPrice ?
                                null
                                // <SmallTextLoader h="16px" pt="8px" width="42px" />
                                :
                                <b style={{ color: themeStyles.colors.success, fontSize: '20px', fontWeight: '900' }}>
                                    {shortenNumber(dbrPrice * 100, 2)}%
                                </b>
                        }
                        &nbsp;Fixed Borrow APR, Unlimited Duration
                    </Text>
                    <Link fontSize='14px' textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/firm" isExternal target="_blank">
                        All markets are isolated - Learn more about FiRM <ExternalLinkIcon />
                    </Link>
                </VStack>
            </Stack>
        }
        labelProps={{ fontSize: { base: '14px', sm: '18px' }, fontWeight: 'extrabold' }}
        contentProps={{
            maxW: { base: '90vw', sm: '100%' },
            overflow: isSmallerThan ? 'auto' : 'visible',
            p: isSmallerThan ? '0' : '4',
            shadow: isSmallerThan ? '0' : '0 0 0px 1px rgba(0, 0, 0, 0.25)',
            borderRadius: isSmallerThan ? '0' : '8px',
            direction: 'column',
        }}
        contentBgColor={isSmallerThan ? 'transparent' : undefined}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            gap: { base: '4', md: '8' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            totalMonthlyUsdYield > 1 ?
                <HStack w={{ base: '100%', md: 'auto' }} spacing={{ base: '2', md: '8' }} alignItems="center" justifyContent="space-between">
                    <VStack spacing="0" alignItems={isSmallerThan ? 'flex-start' : 'flex-end'}>
                        <TextInfo message={
                            <VStack>
                                <Text>
                                    <b>Estimated</b> monthly earnings from your deposits <b>at current yield and prices</b>. Does not account for borrowing cost.
                                </Text>
                            </VStack>
                        }>
                            <Text textDecoration="underline" cursor="pointer" onClick={openYieldBreakdown} fontWeight="bold">Current Yield:</Text>
                        </TextInfo>
                        <Text textDecoration="underline" cursor="pointer" onClick={openYieldBreakdown} fontSize={{ base: '16px', md: '20px' }} fontWeight="extrabold" color="accentTextColor">{shortenNumber(totalMonthlyUsdYield, 2, true)} a month</Text>
                    </VStack>
                    <VStack spacing="0" alignItems={'flex-end'} cursor="pointer">
                        <TextInfo message={
                            <VStack>
                                <Text>
                                    <b>Estimated</b> monthly earnings from your deposits <b>at current yield and prices</b> minus the monthly DBR burn at the <b>DBR reference price</b> you set.
                                </Text>
                                <Text>Your actual net-yield depends on the price at which you bought the DBR</Text>
                            </VStack>
                        }>
                            <Text cursor="pointer" onClick={openYieldBreakdown} textDecoration="underline" fontWeight="bold">Current Net-Yield:</Text>
                        </TextInfo>
                        {
                            dbrUserRefPrice ?
                                <Text onClick={openYieldBreakdown} cursor="pointer" textDecoration="underline" fontSize={{ base: '16px', md: '20px' }} fontWeight="extrabold" color="accentTextColor">
                                    {shortenNumber(totalMonthlyNetUsdYield, 2, true)} a month
                                </Text>
                                :
                                <Text onClick={openSetDbrUserRefPrice} cursor="pointer" textDecoration="underline" fontSize={{ base: '16px', md: '20px' }} fontWeight="extrabold" color="accentTextColor">
                                    Set DBR Price ref
                                </Text>
                        }
                    </VStack>
                    <InfoModal
                        title="Yield breakdown"
                        onOk={() => {
                            closeYieldBreakdown();
                        }}
                        onClose={closeYieldBreakdown}
                        isOpen={isOpenYieldBreakdown}
                        modalProps={{ minW: { base: '98vw', lg: '1000px' }, scrollBehavior: 'inside' }}
                    >
                        <VStack alignItems="flex-start" spacing="4" p="4">
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                description={
                                    <Text>
                                        For information purposes only, actual APY and yield can vary.
                                    </Text>
                                }
                            />
                            <VStack spacing="0" alignItems="flex-start" w='full'>
                                <Stack spacing={{ base: '0', md: '2' }} direction={{ base: 'column', md: 'row' }} alignItems="flex-start" justifyContent="space-between">
                                    <Text>
                                        <b>DBR reference price</b>: {dbrUserRefPrice ? shortenNumber(dbrUserRefPrice, 4, true) : 'not set'}
                                    </Text>
                                    <Text textDecoration="underline" cursor="pointer" onClick={openSetDbrUserRefPrice}>Update</Text>
                                </Stack>
                                <Container p="0" m="0"
                                    label="Yield Breakdown"
                                    noPadding
                                    headerProps={{
                                        direction: { base: 'column', md: 'row' },
                                        gap: { base: '4', md: '8' },
                                        align: { base: 'flex-start', md: 'flex-end' },
                                    }}
                                    right={<HStack
                                        w={{ base: '100%', md: 'auto' }}
                                        spacing="8">
                                        <VStack alignItems={{ base: 'flex-start', md: 'flex-end' }} spacing="0">
                                            <Text fontWeight="bold">Monthly Yield</Text>
                                            <Text>{shortenNumber(totalMonthlyUsdYield, 2, true)}</Text>
                                        </VStack>
                                        {
                                            !!dbrUserRefPrice && <VStack alignItems={{ base: 'flex-start', md: 'flex-end' }} spacing="0">
                                                <Text fontWeight="bold">Monthly Net-Yield</Text>
                                                <Text>{shortenNumber(totalMonthlyNetUsdYield, 2, true)}</Text>
                                            </VStack>
                                        }
                                    </HStack>}>
                                    <YieldBreakdownTable items={withDeposits.filter(m => m.monthlyUsdYield > 0)} />
                                </Container>
                            </VStack>
                        </VStack>
                    </InfoModal>
                    <ConfirmModal
                        title="DBR Price reference"
                        okDisabled={!newDbrUserRefPrice || !parseFloat(newDbrUserRefPrice)}
                        onOk={() => {
                            saveDbrUserRefPrice(parseFloat(newDbrUserRefPrice));
                        }}
                        okLabel="Save"
                        cancelLabel="Close"
                        onCancel={closeSetDbrUserRefPrice}
                        onClose={closeSetDbrUserRefPrice}
                        isOpen={isSetDbrUserRefPriceOpen}
                        okButtonProps={{ bgColor: 'success' }}
                        modalProps={{ minW: { base: '98vw', lg: '500px' }, scrollBehavior: 'inside' }}
                    >
                        <VStack alignItems="flex-start" spacing="4" p="4">
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                description={
                                    <Text>
                                        Set a <b>DBR reference price</b> that will be used <b>to calculate your net-yield</b>, usually this the average price of your DBR purchases or what you intend it to be in the future.
                                    </Text>
                                }
                            />
                            <VStack spacing="1" alignItems="flex-start" w='full'>
                                <Input placeholder="Reference DBR price, example: 0.05" value={newDbrUserRefPrice} onChange={(e) => { setNewDbrUserRefPrice(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1')) }} />
                                <Text textDecoration="underline" onClick={() => setNewDbrUserRefPrice(parseFloat(dbrPrice.toFixed(4)))} cursor="pointer" color="mainTextColorLight">Use the current price as reference ({shortenNumber(dbrPrice, 4, true)})</Text>
                            </VStack>
                            <Text>This is equal to a fixed borrow rate of: <b>{newDbrUserRefPrice ? `${shortenNumber((newDbrUserRefPrice || 0) * 100, 2)}%` : ''}</b></Text>
                        </VStack>
                    </ConfirmModal>
                    <SafetyBadges />
                </HStack>
                : <SafetyBadges />
        }
        subheader={
            <Stack direction={{ base: 'column', md: 'row' }} pt="2" justify="space-between" alignItems="center">
                <InputGroup
                    left="0"
                    w={{ base: '100%', md: '230px' }}
                    bgColor="transparent"
                >
                    <InputLeftElement
                        pointerEvents='none'
                        children={<SearchIcon color='gray.300' />}
                    />
                    <ChakraInput
                        color="mainTextColor"
                        borderRadius="20px"
                        type="search"
                        bgColor="containerContentBackgroundAlpha"
                        // w="200px"
                        placeholder="Search a market"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                        }}
                    />
                </InputGroup>
                {
                    isSmallerThan ? <Select
                        bgColor="containerContentBackgroundAlpha"
                        borderRadius="20px"
                        onChange={(e) => { setCategory(e.target.value) }}>
                        <option value="all">All</option>
                        <option value="leverage">Leverage</option>
                        <option value="majors">BTC/ETH</option>
                        <option value="stablecoins">Stablecoins</option>
                        <option value="lps">Stable LPs</option>
                        <option value="yield-compounding">Compounding Yield</option>
                        <option value="yield-claimable">Claimable Yield</option>
                        <option value="curve-convex">Curve/Convex</option>
                    </Select> : <RadioCardGroup
                        wrapperProps={{ overflow: 'auto', maxW: '90vw', alignItems: 'center' }}
                        group={{
                            name: 'bool',
                            defaultValue: category,
                            onChange: (v) => { setCategory(v) },
                        }}
                        radioCardProps={{
                            w: 'fit-content',
                            textAlign: 'center',
                            px: { base: '2', md: '3' },
                            py: '1',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                        }}
                        options={[
                            { label: 'All', value: 'all' },
                            { label: 'Leverage', value: 'leverage' },
                            { label: 'BTC/ETH', value: 'majors' },
                            { label: 'Stablecoins', value: 'stablecoins' },
                            { label: 'Stable LPs', value: 'lps' },
                            { label: 'Compounding Yield', value: 'yield-compounding' },
                            { label: 'Claimable Yield', value: 'yield-claimable' },
                            { label: 'Curve/Convex', value: 'curve-convex' },
                        ]}
                    />
                }
            </Stack>
        }
    >
        {
            isLoading ?
                <SkeletonList /> :
                <VStack alignItems="flex-start" spacing="6">
                    {
                        withDeposits.length > 0 && <>
                            <HStack _hover={{ filter: 'brightness(1.5)', transition: '400ms all' }} cursor="pointer" onClick={() => toggleMyPositions()}>
                                <SplashedText
                                    as="h3"
                                    color={`${lightTheme?.colors.mainTextColor}`}
                                    fontSize={{ base: '18px', md: '20px' }}
                                    fontWeight="extrabold"
                                    color={`${themeStyles?.colors.mainTextColor}`}
                                    splashColor={`${themeStyles?.colors.accentTextColor}`}
                                    lineHeight='1'
                                    splashProps={{
                                        top: '-10px',
                                        left: '-14px',
                                        w: '370px',
                                        opacity: 0.3,
                                    }}
                                >
                                    Your Isolated Markets ({shortenNumber(depositsUsd, 2, true)}) {showMyPositions ? <ChevronDownIcon fontSize="24px" /> : <ChevronRightIcon fontSize="24px" />}
                                </SplashedText>
                            </HStack>
                            {
                                showMyPositions && <Table
                                    keyName="address"
                                    noDataMessage={search || category ? "No position for the selected filters" : "Loading..."}
                                    columns={isLeverageView ? leverageColumns : columns}
                                    items={
                                        withDeposits
                                            .filter(marketFilter)
                                            .map(m => {
                                                const maxApy = calculateNetApy((m.supplyApy || 0) + (m.extraApy || 0), m.collateralFactor, dbrPrice);
                                                return { ...m, isLeverageView, maxApy, dbrPriceUsd: dbrPrice, tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                                            })
                                    }
                                    onClick={openMarket}
                                    defaultSort={'depositsUsd'}
                                    defaultSortDir="desc"
                                    secondarySortFields={['maxBorrowableByUserWallet', 'leftToBorrow']}
                                    enableMobileRender={true}
                                    mobileClickBtnLabel={'View Market'}
                                    mobileThreshold={responsiveThreshold}
                                    showRowBorder={true}
                                    spacing="0"
                                />
                            }
                            <HStack _hover={{ filter: 'brightness(1.5)', transition: '400ms all' }} cursor="pointer" onClick={() => toggleOther()}>
                                <SplashedText
                                    as="h3"
                                    splash="horizontal-lr2"
                                    color={`${themeStyles?.colors.mainTextColor}`}
                                    splashColor={`${themeStyles?.colors.accentTextColor}`}
                                    fontSize={{ base: '18px', md: '20px' }}
                                    fontWeight="extrabold"
                                    lineHeight='1'
                                    splashProps={{
                                        top: '-10px',
                                        left: '-10px',
                                        w: '180px',
                                        opacity: 0.3,
                                    }}
                                >
                                    Other Isolated Markets{showOther ? <ChevronDownIcon fontSize="24px" /> : <ChevronRightIcon fontSize="24px" />}
                                </SplashedText>
                            </HStack>
                        </>
                    }
                    {
                        showOther && <Table
                            keyName="address"
                            pinnedItems={pinnedItems}
                            pinnedLabels={pinnedLabels}
                            unfixedPinnedItems={isLeverageView}
                            noDataMessage={search || category ? "No market for the selected filters" : "Loading..."}
                            columns={withDeposits.length > 0 ? isLeverageView ? leverageColumns : columns : isLeverageView ? leverageColumnsWithout : columnsWithout}
                            items={
                                withoutDeposits
                                    .filter(marketFilter)
                                    .map(m => {
                                        const maxApy = calculateNetApy((m.supplyApy || 0) + (m.extraApy || 0), m.collateralFactor, dbrPrice);
                                        return { ...m, isLeverageView, maxApy: maxApy <= 0 ? -1 / m.collateralFactor : maxApy, dbrPriceUsd: (dbrPrice), tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                                    })
                            }
                            onClick={openMarket}
                            defaultSort={isLeverageView ? 'maxApy' : 'maxBorrowableByUserWallet'}
                            defaultSortDir="desc"
                            secondarySortFields={account ? ['maxBorrowableByUserWallet', 'leftToBorrow', 'tvl'] : ['leftToBorrow', 'collateralFactor']}
                            enableMobileRender={true}
                            mobileClickBtnLabel={'View Market'}
                            mobileThreshold={responsiveThreshold}
                            showRowBorder={true}
                            spacing="0"
                        />
                    }
                </VStack>
        }
    </Container >
}