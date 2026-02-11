import { useEffect, useState } from "react";
import { HStack, Input, Text, VStack } from "@chakra-ui/react";
import Container from "@app/components/common/Container";
import { TextInfo } from "@app/components/common/Messages/TextInfo";
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm";
import { InfoMessage } from "@app/components/common/Messages";
import { useWeb3React } from "@web3-react/core";
import { getNetworkConfigConstants } from "@app/util/networks";
import { INV_BUY_BACK_AUCTION_HELPER } from "@app/config/constants";
import { buyBackInvForDbr } from "@app/util/dbr-auction";
import { parseEther } from "@ethersproject/units";
import { BigNumber, Contract } from "ethers";
import { INV_BUY_BACK_AUCTION_HELPER_ABI } from "@app/config/abis";
import { getBnToNumber, getNumberToBn, shortenNumber } from "@app/util/markets";
import { useDBRPrice } from "@app/hooks/useDBR";
import { useINVBalance } from "@app/hooks/useBalances";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";

const { INV } = getNetworkConfigConstants();

export const InvBuyBackUI = () => {
  const { provider, account } = useWeb3React();
  const { balance: invBalance } = useINVBalance(account);
  const { priceUsd: dbrPriceUsd } = useDBRPrice();

  const [invAmount, setInvAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [estimatedDbrOut, setEstimatedDbrOut] = useState(0);
  const [minDbrOut, setMinDbrOut] = useState<BigNumber | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const floatInvAmount = parseFloat(invAmount || "0") || 0;
  const isInvalidSlippage =
    !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;

  useEffect(() => {
    const estimate = async () => {
      if (!provider || !invAmount || floatInvAmount <= 0 || isInvalidSlippage) {
        setEstimatedDbrOut(0);
        setMinDbrOut(null);
        return;
      }
      try {
        setIsEstimating(true);
        const bnInv = parseEther(invAmount);
        const contract = new Contract(
          INV_BUY_BACK_AUCTION_HELPER,
          INV_BUY_BACK_AUCTION_HELPER_ABI,
          provider
        );
        const dbrOutBn: BigNumber = await contract.getDbrOut(bnInv);
        const dbrOutNum = getBnToNumber(dbrOutBn);
        const slip = parseFloat(slippage || "0");
        const minOutBn =
          dbrOutNum > 0 && slip > 0
            ? getNumberToBn(dbrOutNum * (1 - slip / 100))
            : BigNumber.from("0");
        setEstimatedDbrOut(dbrOutNum);
        setMinDbrOut(minOutBn);
      } catch (e) {
        setEstimatedDbrOut(0);
        setMinDbrOut(null);
      } finally {
        setIsEstimating(false);
      }
    };
    estimate();
  }, [provider, invAmount, slippage, floatInvAmount, isInvalidSlippage]);

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
      label="Manual INV Buy Back"
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
            description="Please connect your wallet to participate in the INV buy back."
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
                  setEstimatedDbrOut(0);
                  setMinDbrOut(null);
                }}
              />
            </VStack>
            <HStack w="full" justify="space-between" alignItems="center">
              <HStack spacing="2">
                <Text fontSize="14px">Max slippage %:</Text>
                <Input
                  value={slippage}
                  maxW="80px"
                  size="sm"
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
            </HStack>
            <VStack w="full" alignItems="flex-start" spacing={1}>
              <Text fontSize="14px" color="secondaryTextColor">
                Estimated DBR to receive:
              </Text>
              {isEstimating ? (
                <SmallTextLoader height="10px" width="80px" />
              ) : (
                <Text fontSize="14px" fontWeight="bold">
                  {estimatedDbrOut > 0
                    ? `${shortenNumber(estimatedDbrOut, 4)} DBR${
                        dbrPriceUsd
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
              <Text fontSize="12px" color="secondaryTextColor">
                Min. DBR to receive:{" "}
                {minDbrOut && minDbrOut.gt(0)
                  ? `${shortenNumber(getBnToNumber(minDbrOut), 4)} DBR`
                  : "-"}
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default InvBuyBackUI;

