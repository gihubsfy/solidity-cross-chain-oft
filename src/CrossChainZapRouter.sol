// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISwapAdapter} from "./interfaces/ISwapAdapter.sol";
import {IOFTBridgeAdapter} from "./interfaces/IOFTBridgeAdapter.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {Ownable} from "./utils/Ownable.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

contract CrossChainZapRouter is Ownable, ReentrancyGuard {
    using SafeTransferLib for IERC20;

    struct RouteConfig {
        address tokenIn;
        address bridgeToken;
        address swapAdapter;
        address bridgeAdapter;
        bool enabled;
    }

    struct ZapRequest {
        bytes32 routeId;
        uint256 amountIn;
        uint256 minBridgeAmount;
        uint32 dstEid;
        bytes32 recipient;
        bytes swapData;
        bytes bridgeOptions;
        bytes composeMsg;
    }

    mapping(bytes32 => RouteConfig) public routes;

    event RouteConfigured(
        bytes32 indexed routeId,
        address indexed tokenIn,
        address indexed bridgeToken,
        address swapAdapter,
        address bridgeAdapter,
        bool enabled
    );
    event ZapBridged(
        bytes32 indexed routeId,
        address indexed sender,
        address indexed bridgeToken,
        uint256 amountIn,
        uint256 bridgeAmount,
        uint32 dstEid,
        bytes32 recipient,
        bytes32 messageId
    );

    error RouteDisabled();
    error RouteMissing();
    error SwapAdapterRequired();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setRoute(bytes32 routeId, RouteConfig calldata config) external onlyOwner {
        if (config.tokenIn == address(0) || config.bridgeToken == address(0) || config.bridgeAdapter == address(0)) {
            revert RouteMissing();
        }
        routes[routeId] = config;
        emit RouteConfigured(
            routeId,
            config.tokenIn,
            config.bridgeToken,
            config.swapAdapter,
            config.bridgeAdapter,
            config.enabled
        );
    }

    function quoteBridgeFee(
        bytes32 routeId,
        uint256 bridgeAmount,
        uint32 dstEid,
        bytes32 recipient,
        bytes calldata bridgeOptions,
        bytes calldata composeMsg
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        RouteConfig memory config = _getEnabledRoute(routeId);
        return IOFTBridgeAdapter(config.bridgeAdapter).quoteBridge(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: dstEid,
                to: recipient,
                token: config.bridgeToken,
                amountLD: bridgeAmount,
                minAmountLD: bridgeAmount,
                refundAddress: msg.sender,
                options: bridgeOptions,
                composeMsg: composeMsg
            })
        );
    }

    function zapAndBridge(ZapRequest calldata request) external payable nonReentrant returns (uint256 bridgeAmount, bytes32 messageId) {
        RouteConfig memory config = _getEnabledRoute(request.routeId);

        IERC20(config.tokenIn).safeTransferFrom(msg.sender, address(this), request.amountIn);

        if (config.tokenIn == config.bridgeToken) {
            bridgeAmount = request.amountIn;
        } else {
            if (config.swapAdapter == address(0)) revert SwapAdapterRequired();
            IERC20(config.tokenIn).forceApprove(config.swapAdapter, request.amountIn);
            bridgeAmount = ISwapAdapter(config.swapAdapter).swapExactInput(
                ISwapAdapter.SwapRequest({
                    tokenIn: config.tokenIn,
                    tokenOut: config.bridgeToken,
                    amountIn: request.amountIn,
                    minAmountOut: request.minBridgeAmount,
                    recipient: address(this),
                    data: request.swapData
                })
            );
        }

        require(bridgeAmount >= request.minBridgeAmount, "BRIDGE_AMOUNT_TOO_LOW");

        IERC20(config.bridgeToken).forceApprove(config.bridgeAdapter, bridgeAmount);
        messageId = IOFTBridgeAdapter(config.bridgeAdapter).bridge{value: msg.value}(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: request.dstEid,
                to: request.recipient,
                token: config.bridgeToken,
                amountLD: bridgeAmount,
                minAmountLD: request.minBridgeAmount,
                refundAddress: msg.sender,
                options: request.bridgeOptions,
                composeMsg: request.composeMsg
            })
        );

        emit ZapBridged(
            request.routeId,
            msg.sender,
            config.bridgeToken,
            request.amountIn,
            bridgeAmount,
            request.dstEid,
            request.recipient,
            messageId
        );
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "NATIVE_TRANSFER_FAILED");
    }

    function _getEnabledRoute(bytes32 routeId) private view returns (RouteConfig memory config) {
        config = routes[routeId];
        if (config.tokenIn == address(0)) revert RouteMissing();
        if (!config.enabled) revert RouteDisabled();
    }

    receive() external payable {}
}

