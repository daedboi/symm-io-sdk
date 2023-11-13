import { useCallback } from "react";
import { shallowEqual } from "react-redux";

import { makeHttpRequest } from "../../utils/http";
import {
  BALANCE_HISTORY_ITEMS_NUMBER,
  CHECK_IS_WHITE_LIST,
} from "../../constants/misc";
import {
  Account,
  UserPartyAStatDetail,
  initialUserPartyAStatDetail,
} from "../../types/user";
import { ApiState } from "../../types/api";
import {
  BalanceHistoryData,
  ConnectionStatus,
  GetWhiteListType,
  WhiteListResponse,
} from "./types";
import { getBalanceHistory } from "./thunks";
import { AppThunkDispatch, useAppDispatch, useAppSelector } from "..";

import {
  updateUserSlippageTolerance,
  updateUserDarkMode,
  updateUserLeverage,
  updateUserFavorites,
  updateUserExpertMode,
  updateUpnlWebSocketStatus as updateUpnlWebSocketStatus,
} from "./actions";
import { useHedgerInfo } from "../hedger/hooks";
import useDebounce from "../../lib/hooks/useDebounce";

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useAppSelector(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode,
    }),
    shallowEqual
  );
  return userDarkMode === null ? matchesDarkMode : userDarkMode;
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useAppDispatch();
  const darkMode = useIsDarkMode();

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }));
  }, [darkMode, dispatch]);

  return [darkMode, toggleSetDarkMode];
}

export function useSetSlippageToleranceCallback(): (
  slippageTolerance: "auto"
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (userSlippageTolerance: "auto") => {
      dispatch(
        updateUserSlippageTolerance({
          userSlippageTolerance,
        })
      );
    },
    [dispatch]
  );
}

export function useSlippageTolerance(): number | "auto" {
  const userSlippageTolerance = useAppSelector(
    (state) => state.user.userSlippageTolerance
  );
  return userSlippageTolerance;
}

export function useSetExpertModeCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    (userExpertMode: boolean) => {
      dispatch(updateUserExpertMode({ userExpertMode }));
    },
    [dispatch]
  );
}

export function useExpertMode(): boolean {
  const userExpertMode = useAppSelector((state) => state.user.userExpertMode);
  return userExpertMode ? true : false;
}

export function useUserWhitelist(): null | boolean {
  const whiteListAccount = useAppSelector(
    (state) => state.user.whiteListAccount
  );
  return whiteListAccount;
}

export function useLeverage(): number {
  const leverage = useAppSelector((state) => state.user.leverage);
  return leverage;
}

export function useSetLeverageCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    (leverage: number) => {
      dispatch(updateUserLeverage(leverage));
    },
    [dispatch]
  );
}

export function useFavorites(): string[] {
  const favorites = useAppSelector((state) => state.user.favorites);
  return favorites;
}

export function useToggleUserFavoriteCallback(symbol: string): () => void {
  const dispatch = useAppDispatch();
  const favorites = useFavorites() ?? [];

  return useCallback(() => {
    const isFavorite = favorites?.includes(symbol);
    if (isFavorite) {
      const filteredFavorites = favorites.filter(
        (favorite) => favorite !== symbol
      );
      dispatch(updateUserFavorites(filteredFavorites));
    } else {
      dispatch(updateUserFavorites([...favorites, symbol]));
    }
  }, [favorites, symbol, dispatch]);
}

export function useActiveAccount(): Account | null {
  const activeAccount = useAppSelector((state) => state.user.activeAccount);
  return activeAccount;
}

export function useActiveAccountAddress(): string | null {
  const activeAccount = useAppSelector((state) => state.user.activeAccount);
  return activeAccount && activeAccount.accountAddress;
}

export function useAccountPartyAStat(
  address: string | null | undefined
): UserPartyAStatDetail {
  const accountsPartyAStat = useAppSelector(
    (state) => state.user.accountsPartyAStat
  );
  if (!address || !accountsPartyAStat) return initialUserPartyAStatDetail;
  if (!accountsPartyAStat[address]) return initialUserPartyAStatDetail;
  return accountsPartyAStat[address];
}

export function useAccountUpnl() {
  const activeAccountUpnl = useAppSelector(
    (state) => state.user.activeAccountUpnl
  );
  return activeAccountUpnl;
}

export function useSetUpnlWebSocketStatus() {
  const dispatch = useAppDispatch();
  return useCallback(
    (status: ConnectionStatus) => {
      dispatch(updateUpnlWebSocketStatus({ status }));
    },
    [dispatch]
  );
}

export function useGetBalanceHistoryCallback() {
  const thunkDispatch: AppThunkDispatch = useAppDispatch();
  return useCallback(
    (
      chainId: number | undefined,
      account: string | null,
      skip?: number,
      first?: number
    ) => {
      if (!chainId || !account) return;
      thunkDispatch(
        getBalanceHistory({
          account,
          chainId,
          first: first ?? BALANCE_HISTORY_ITEMS_NUMBER,
          skip: skip ? skip : 0,
        })
      );
    },
    [thunkDispatch]
  );
}

export function useUpnlWebSocketStatus() {
  const upnlWebSocketStatus = useAppSelector(
    (state) => state.user.upnlWebSocketStatus
  );
  return upnlWebSocketStatus;
}

export function useIsWhiteList(
  account: string | undefined
): () => Promise<WhiteListResponse> {
  const { baseUrl, fetchData, clientName } = useHedgerInfo() || {};
  return useCallback(async () => {
    if (!CHECK_IS_WHITE_LIST || !fetchData || !account || !baseUrl) return null;
    const { href: url } = new URL(
      `/check_in-whitelist/${account}/${clientName}`,
      baseUrl
    );
    return makeHttpRequest<WhiteListResponse>(url);
  }, [fetchData, account, baseUrl, clientName]);
}

export function useAddInWhitelist(
  subAccount: string | undefined
): () => Promise<GetWhiteListType | null> {
  const { baseUrl, fetchData, clientName } = useHedgerInfo() || {};
  return useCallback(async () => {
    if (!CHECK_IS_WHITE_LIST || !fetchData || !subAccount || !baseUrl)
      return null;
    const { href: url } = new URL(
      `/add-sub-address-in-whitelist/${subAccount}/${clientName}`,
      baseUrl
    );
    return makeHttpRequest<GetWhiteListType>(url);
  }, [baseUrl, clientName, fetchData, subAccount]);
}

export function useBalanceHistory(): {
  hasMoreHistory: boolean | undefined;
  balanceHistory: { [txHash: string]: BalanceHistoryData } | undefined;
  balanceHistoryState: ApiState;
} {
  const hasMoreHistory = useAppSelector((state) => state.user.hasMoreHistory);
  const balanceHistory = useAppSelector((state) => state.user.balanceHistory);
  const balanceHistoryState = useAppSelector(
    (state) => state.user.balanceHistoryState
  );

  return { hasMoreHistory, balanceHistory, balanceHistoryState };
}

export function useTotalDepositsAndWithdrawals() {
  const depositWithdrawalsData = useAppSelector(
    (state) => state.user.depositWithdrawalsData
  );
  const depositWithdrawalsState = useAppSelector(
    (state) => state.user.depositWithdrawalsState
  );
  const debounceState = useDebounce(depositWithdrawalsState, 200);

  return { depositWithdrawalsData, depositWithdrawalsState: debounceState };
}
