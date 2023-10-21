import styled from "styled-components";

import { formatAmount } from "@symmio-client/core/utils/numbers";
import { useCollateralToken } from "@symmio-client/core/constants/tokens";
import { getTokenWithFallbackChainId } from "@symmio-client/core/utils/token";

import useActiveWagmi from "@symmio-client/core/lib/hooks/useActiveWagmi";
import useAccountData from "@symmio-client/core/hooks/useAccountData";

import {
  useAccountPartyAStat,
  useActiveAccountAddress,
} from "@symmio-client/core/state/user/hooks";
import { ApplicationModal } from "@symmio-client/core/state/application/reducer";
import {
  useDepositModalToggle,
  useModalOpen,
  useWithdrawModalToggle,
} from "@symmio-client/core/state/application/hooks";

import { DefaultContainer, DefaultHeader } from "./styles";
import Column from "components/Column";
import { RowBetween } from "components/Row";
import DataRow from "components/App/AccountData/DataRow";
import GradientButton from "components/Button/GradientButton";
import DepositModal from "components/ReviewModal/DepositModal";
import WithdrawModal from "components/ReviewModal/WithdrawModal";

const Container = styled(DefaultContainer)`
  overflow: hidden;
`;

const TopContainer = styled(Column)`
  min-height: 150px;
  padding-bottom: 16px;
  background-color: ${({ theme }) => theme.bg1};
`;

const ContentWrapper = styled(Column)`
  gap: 16px;
  flex-grow: 1;
  padding: 0 12px;
  justify-content: flex-end;
`;

export default function AccountBalance() {
  const { chainId } = useActiveWagmi();
  const { availableForOrder, loading } = useAccountData();
  const activeAccountAddress = useActiveAccountAddress();
  const { allocatedBalance, lockedMM } =
    useAccountPartyAStat(activeAccountAddress);
  const COLLATERAL_TOKEN = useCollateralToken();
  const collateralCurrency = getTokenWithFallbackChainId(
    COLLATERAL_TOKEN,
    chainId
  );
  const showDepositModal = useModalOpen(ApplicationModal.DEPOSIT);
  const showWithdrawModal = useModalOpen(ApplicationModal.WITHDRAW);
  const toggleDepositModal = useDepositModalToggle();
  const toggleWithdrawModal = useWithdrawModalToggle();

  return (
    <>
      <Container>
        <TopContainer>
          <DefaultHeader>Balance Overview</DefaultHeader>
          <ContentWrapper>
            <DataRow
              label={"Available for Orders:"}
              value={formatAmount(availableForOrder)}
              ticker={collateralCurrency?.symbol}
              margin={"0px"}
              loading={loading}
            />
            <DataRow
              label={"Allocated Balance:"}
              value={formatAmount(allocatedBalance)}
              ticker={collateralCurrency?.symbol}
              margin={"0px"}
              loading={loading}
            />
            <DataRow
              label={"Locked Margin:"}
              value={formatAmount(lockedMM)}
              ticker={collateralCurrency?.symbol}
              margin={"0px"}
              loading={loading}
            />
          </ContentWrapper>
        </TopContainer>
        <RowBetween padding={"37px 12px 16px"} gap={"12px"}>
          <GradientButton
            label={"Withdraw"}
            onClick={() => toggleWithdrawModal()}
          />
          <GradientButton
            label={"Deposit"}
            onClick={() => toggleDepositModal()}
          />
        </RowBetween>
      </Container>
      {showDepositModal && <DepositModal />}
      {showWithdrawModal && <WithdrawModal />}
    </>
  );
}
