// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CrossChainZapRouter} from "../CrossChainZapRouter.sol";
import {DestinationExecutor} from "../DestinationExecutor.sol";
import {DirectSwapStrategy} from "../strategies/DirectSwapStrategy.sol";
import {VaultRewardSwapStrategy} from "../strategies/VaultRewardSwapStrategy.sol";

library MonadAprBscPreset {
    // Monad source-side assets and infra.
    address internal constant MONAD_USDC = 0x754704Bc059F8C67012fEd69BC8A327a5aafb603;
    address internal constant MONAD_APR_OFT = 0x0a332311633C0625f63CFc51EE33fC49826E0a3C;
    address internal constant MONAD_V2_ROUTER = 0x04Ddf65A9E78A0F0E001807E5567996160767f33;

    // BSC destination-side assets and infra.
    uint32 internal constant BSC_EID = 30102;
    address internal constant BSC_APR_OFT = 0x299AD4299Da5b2b93Fba4c96967B040C7F611099;
    address internal constant BSC_USDT = 0x55d398326f99059fF775485246999027B3197955;
    address internal constant BSC_WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address internal constant BSC_INFINITY_VAULT = 0x238a358808379702088667322f80aC48bAd5e6c4;
    address internal constant BSC_PANCAKE_ROUTER = 0xd9C500DfF816a1Da21A48A732d3498Bf09dc9AEB;

    function routeId() internal pure returns (bytes32) {
        return keccak256("monad-usdc-to-bsc-apr-oft");
    }

    function sourceSwapPath() internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = MONAD_USDC;
        path[1] = MONAD_APR_OFT;
    }

    function directSwapPath() internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = BSC_APR_OFT;
        path[1] = BSC_USDT;
    }

    function rewardSwapPath() internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = BSC_WBNB;
        path[1] = BSC_USDT;
    }

    function sourceSwapData() internal pure returns (bytes memory) {
        return abi.encode(sourceSwapPath());
    }

    function directSwapData() internal pure returns (bytes memory) {
        return abi.encode(directSwapPath());
    }

    function rewardSwapData() internal pure returns (bytes memory) {
        return abi.encode(rewardSwapPath());
    }

    function routeConfig(address swapAdapter, address bridgeAdapter)
        internal
        pure
        returns (CrossChainZapRouter.RouteConfig memory config)
    {
        config = CrossChainZapRouter.RouteConfig({
            tokenIn: MONAD_USDC,
            bridgeToken: MONAD_APR_OFT,
            swapAdapter: swapAdapter,
            bridgeAdapter: bridgeAdapter,
            enabled: true
        });
    }

    function buildZapRequest(
        uint256 amountIn,
        uint256 minBridgeAmount,
        address recipient,
        bytes memory bridgeOptions,
        bytes memory composeMsg
    ) internal pure returns (CrossChainZapRouter.ZapRequest memory request) {
        request = CrossChainZapRouter.ZapRequest({
            routeId: routeId(),
            amountIn: amountIn,
            minBridgeAmount: minBridgeAmount,
            dstEid: BSC_EID,
            recipient: toBytes32(recipient),
            swapData: sourceSwapData(),
            bridgeOptions: bridgeOptions,
            composeMsg: composeMsg
        });
    }

    function buildDirectSwapExecutionRequest(
        address strategyAdapter,
        address swapAdapter,
        uint256 inputAmount,
        uint256 minPayoutAmount,
        address recipient
    ) internal pure returns (DestinationExecutor.ExecutionRequest memory request) {
        request = DestinationExecutor.ExecutionRequest({
            strategyAdapter: strategyAdapter,
            inputToken: BSC_APR_OFT,
            inputAmount: inputAmount,
            payoutToken: BSC_USDT,
            minPayoutAmount: minPayoutAmount,
            recipient: recipient,
            strategyData: abi.encode(
                DirectSwapStrategy.DirectSwapData({
                    swapAdapter: swapAdapter,
                    swapData: directSwapData()
                })
            )
        });
    }

    function buildVaultExecutionRequest(
        address strategyAdapter,
        address vaultAdapter,
        address rewardSwapAdapter,
        uint256 inputAmount,
        uint256 minPayoutAmount,
        uint256 minRewardAmount,
        address recipient,
        bytes memory vaultDepositData,
        bytes memory rewardClaimData
    ) internal pure returns (DestinationExecutor.ExecutionRequest memory request) {
        request = DestinationExecutor.ExecutionRequest({
            strategyAdapter: strategyAdapter,
            inputToken: BSC_APR_OFT,
            inputAmount: inputAmount,
            payoutToken: BSC_USDT,
            minPayoutAmount: minPayoutAmount,
            recipient: recipient,
            strategyData: abi.encode(
                VaultRewardSwapStrategy.VaultRewardSwapData({
                    vaultAdapter: vaultAdapter,
                    rewardSwapAdapter: rewardSwapAdapter,
                    minRewardAmount: minRewardAmount,
                    vaultDepositData: vaultDepositData,
                    rewardClaimData: rewardClaimData,
                    rewardSwapData: rewardSwapData()
                })
            )
        });
    }

    function toBytes32(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }
}