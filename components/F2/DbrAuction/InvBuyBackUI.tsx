import { useEffect, useState } from "react";
import { Divider, HStack, Text, VStack } from "@chakra-ui/react";
import Container from "@app/components/common/Container";
import { TextInfo } from "@app/components/common/Messages/TextInfo";
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm";
import { InfoMessage } from "@app/components/common/Messages";
import { useWeb3React } from "@web3-react/core";
import { getNetworkConfigConstants } from "@app/util/networks";
import { INV_BUY_BACK_AUCTION_HELPER } from "@app/config/constants";
import { buyBackInvForDbr, useDbrAuctionPricing } from "@app/util/dbr-auction";
import { parseEther } from "@ethersproject/units";
import { BigNumber, Contract } from "ethers";
import { INV_BUY_BACK_AUCTION_HELPER_ABI } from "@app/config/abis";
import { getBnToNumber, getNumberToBn, shortenNumber } from "@app/util/markets";
import { useDBRMarkets, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import { useINVBalance } from "@app/hooks/useBalances";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { Input } from "@app/components/common/Input";

const { INV } = getNetworkConfigConstants();

export const InvBuyBackUI = () => {
  const { provider, account } = useWeb3React();
  const { priceUsd: dbrPriceUsd } = useDBRPrice();

  const { markets, isLoading: isLoadingMarkets } = useDBRMarkets();
  const invMarket = markets?.find(m => m.isInv);
  const invPrice = invMarket?.price || 0;

  const [invAmount, setInvAmount] = useState("");
  const [slippage, setSlippage] = useState("1");

  const floatInvAmount = parseFloat(invAmount || "0") || 0;
  const isInvalidSlippage =
    !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;

  const defaultRefAmount = "1"

  const srcIndex = 2
  const { price: dbrSwapPriceRef } = useTriCryptoSwap(parseFloat(defaultRefAmount), srcIndex, 1);
  const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(!invAmount || invAmount === '0' ? defaultRefAmount : invAmount), srcIndex, 1);

  const dbrSwapPriceInToken = dbrSwapPrice ? 1 / dbrSwapPrice : 0;
  const dbrSwapPriceRefInToken = dbrSwapPriceRef ? 1 / dbrSwapPriceRef : 0;
  const invMarketPrice = dbrSwapPriceInToken || dbrSwapPriceRefInToken;
  const invAuctionPricingData = useDbrAuctionPricing({ auctionType: 'invBuyBack', helperAddress: INV_BUY_BACK_AUCTION_HELPER, tokenAmount: invAmount, dbrAmount: '1', slippage, isExactToken: true, dbrSwapPriceRefInToken: dbrSwapPriceRefInToken });

  const {
    estimatedTimestampToReachMarketPrice,
    estimatedTimeToReachMarketPrice,
    dbrAuctionPriceInToken,
    minDbrOut,
    maxTokenIn,
    minDbrOutNum,
    maxTokenInNum,
    estimatedTokenIn,
    estimatedDbrOut,
    isLoading: isEstimating,
  } = invAuctionPricingData;

  const isFormDisabled =
    !account ||
    !invAmount ||
    floatInvAmount <= 0 ||
    isInvalidSlippage ||
    !minDbrOut ||
    minDbrOut.lte(0);

  const handleSell = async (needAccount = false) => {
    if (!provider || !account) {
      if (needAccount) {
        return;
      }
      return;
    }
    const signer = provider.getSigner();
    const bnInv = parseEther(invAmount);
    const minOut = minDbrOut || BigNumber.from("0");
    return buyBackInvForDbr(signer, bnInv, minOut);
  };

  return (
    <Container
      label="Manual INV Buyback"
      description="See buyer contract on Etherscan"
      href={`https://etherscan.io/address/${INV_BUY_BACK_AUCTION_HELPER}`}
      noPadding
      m="0"
      p="0"
      maxW="650px"
    >
      <VStack spacing="4" alignItems="flex-start" w="full">
        {!account ? (
          <InfoMessage
            alertProps={{ w: "full" }}
            description="Please connect your wallet to participate in the INV buyback."
          />
        ) : (
          <>
            {/* <HStack w="full" justify="space-between">
              <Text fontSize="14px">
                INV balance: <b>{shortenNumber(invBalance, 4)}</b>
              </Text>
            </HStack> */}
            <VStack w="full" alignItems="flex-start">
              <TextInfo message="You give INV which is removed from circulation and sent to the Inverse Finance treasury and you receive DBR in exchange.">
                <Text fontWeight="bold" fontSize="16px">
                  Amount of INV to exchange back to the Inverse Finance Treasury:
                </Text>
              </TextInfo>
              <SimpleAmountForm
                defaultAmount={invAmount}
                address={INV}
                destination={INV_BUY_BACK_AUCTION_HELPER}
                signer={provider?.getSigner()}
                decimals={18}
                onAction={() => handleSell()}
                onMaxAction={() => handleSell()}
                actionLabel="Sell INV for DBR"
                onAmountChange={(v) => setInvAmount(v)}
                showMaxBtn={false}
                hideInputIfNoAllowance={false}
                showBalance={true}
                isDisabled={isFormDisabled || isEstimating}
                checkBalanceOnTopOfIsDisabled={true}
                onSuccess={() => {
                  setInvAmount("");
                }}
              />
            </VStack>

            <VStack w="full" alignItems="flex-start" spacing={1}>
              <HStack w="full" justify="space-between">
                <Text fontSize="14px">
                  Estimated DBR to receive:
                </Text>
                {isEstimating ? (
                  <SmallTextLoader height="10px" width="80px" />
                ) : (
                  <Text fontSize="14px" fontWeight="bold">
                    {estimatedDbrOut > 0
                      ? `${shortenNumber(estimatedDbrOut, 4)} DBR${dbrPriceUsd
                        ? ` (${shortenNumber(
                          estimatedDbrOut * dbrPriceUsd,
                          2,
                          true
                        )})`
                        : ""
                      }`
                      : "-"}
                  </Text>
                )}
              </HStack>
              <HStack w="full" justify="space-between">
                <Text fontSize="12px" color={dbrAuctionPriceInToken < dbrSwapPriceInToken ? 'success' : 'warning'}>
                  Auction price:
                </Text>
                <Text fontSize="12px" fontWeight="bold">
                  {dbrAuctionPriceInToken > 0
                    ? `${shortenNumber(dbrAuctionPriceInToken, 4)} (${shortenNumber(dbrAuctionPriceInToken * invPrice, 4, true)})`
                    : "-"}
                </Text>
              </HStack>
              <HStack w="full" justify="space-between">
                <Text fontSize="12px">
                  INV market price:
                </Text>
                <Text fontSize="12px" fontWeight="bold">
                  {dbrSwapPriceInToken > 0 && dbrPriceUsd > 0
                    ? `${shortenNumber(dbrSwapPriceInToken, 4)} INV (${shortenNumber(dbrSwapPriceInToken * invPrice, 4, true)})`
                    : "-"}
                </Text>
              </HStack>
              <Divider />
              <HStack w="full" justify="space-between" alignItems="center">
                <Text fontSize="14px">Max slippage %:</Text>
                <Input
                  py="0"
                  maxH="30px"
                  w='90px'
                  value={slippage}
                  _focusVisible={false}
                  isInvalid={isInvalidSlippage}
                  onChange={(e) =>
                    setSlippage(
                      e.target.value
                        .replace(/[^0-9.]/, "")
                        .replace(/(\..*)\./g, "$1")
                    )
                  }
                />
              </HStack>
              <HStack w="full" justify="space-between">
                <Text fontSize="12px">
                  Min. DBR to receive:
                </Text>
                <Text fontSize="12px" fontWeight="bold">
                  {minDbrOut && minDbrOut.gt(0)
                    ? `${shortenNumber(getBnToNumber(minDbrOut), 4)} DBR (${shortenNumber(getBnToNumber(minDbrOut) * dbrPriceUsd, 2, true)})`
                    : "-"}
                </Text>
              </HStack>
            </VStack>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default InvBuyBackUI;

