// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IOFTBridgeAdapter} from "../interfaces/IOFTBridgeAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

contract UnifiedOFTWorkflow is Ownable, ReentrancyGuard {
    using SafeTransferLib for IERC20;

    struct SourceRouteConfig {
        address tokenIn;
        address oftToken;
        address swapAdapter;
        address bridgeAdapter;
        uint32 dstEid;
        bool enabled;
    }

    struct DestinationRouteConfig {
        address oftToken;
        address payoutToken;
        address swapAdapter;
        bool enabled;
    }

    mapping(bytes32 => SourceRouteConfig) public sourceRoutes;
    mapping(bytes32 => DestinationRouteConfig) public destinationRoutes;

    mapping(address => bool) public approvedCallers;
    mapping(address => bool) public approvedSwapAdapters;
    mapping(address => bool) public approvedBridgeAdapters;

    event CallerApprovalUpdated(address indexed caller, bool approved);
    event SwapAdapterApprovalUpdated(address indexed swapAdapter, bool approved);
    event BridgeAdapterApprovalUpdated(address indexed bridgeAdapter, bool approved);
    event SourceRouteUpdated(
        bytes32 indexed routeId,
        address indexed tokenIn,
        address indexed oftToken,
        address swapAdapter,
        address bridgeAdapter,
        uint32 dstEid,
        bool enabled
    );
    event DestinationRouteUpdated(
        bytes32 indexed routeId,
        address indexed oftToken,
        address indexed payoutToken,
        address swapAdapter,
        bool enabled
    );
    event SourceSwapAndBridgeExecuted(
        bytes32 indexed routeId,
        address indexed caller,
        uint256 amountIn,
        uint256 bridgeAmount,
        bytes32 recipient,
        bytes32 messageId
    );
    event DestinationSwapExecuted(
        bytes32 indexed routeId,
        address indexed caller,
        uint256 oftAmountIn,
        uint256 payoutAmountOut,
        address recipient
    );

    error InvalidConfig();
    error CallerNotApproved();
    error SwapAdapterNotApproved();
    error BridgeAdapterNotApproved();
    error SourceRouteMissing();
    error SourceRouteDisabled();
    error DestinationRouteMissing();
    error DestinationRouteDisabled();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setCallerApproval(address caller, bool approved) external onlyOwner {
        approvedCallers[caller] = approved;
        emit CallerApprovalUpdated(caller, approved);
    }

    function setSwapAdapterApproval(address swapAdapter, bool approved) external onlyOwner {
        approvedSwapAdapters[swapAdapter] = approved;
        emit SwapAdapterApprovalUpdated(swapAdapter, approved);
    }

    function setBridgeAdapterApproval(address bridgeAdapter, bool approved) external onlyOwner {
        approvedBridgeAdapters[bridgeAdapter] = approved;
        emit BridgeAdapterApprovalUpdated(bridgeAdapter, approved);
    }

    function setSourceRoute(bytes32 routeId, SourceRouteConfig calldata config) external onlyOwner {
        if (
            config.tokenIn == address(0) || config.oftToken == address(0) || config.swapAdapter == address(0)
                || config.bridgeAdapter == address(0) || config.dstEid == 0
        ) {
            revert InvalidConfig();
        }
        if (!approvedSwapAdapters[config.swapAdapter]) revert SwapAdapterNotApproved();
        if (!approvedBridgeAdapters[config.bridgeAdapter]) revert BridgeAdapterNotApproved();

        sourceRoutes[routeId] = config;
        emit SourceRouteUpdated(
            routeId,
            config.tokenIn,
            config.oftToken,
            config.swapAdapter,
            config.bridgeAdapter,
            config.dstEid,
            config.enabled
        );
    }

    function setDestinationRoute(bytes32 routeId, DestinationRouteConfig calldata config) external onlyOwner {
        if (config.oftToken == address(0) || config.payoutToken == address(0) || config.swapAdapter == address(0)) {
            revert InvalidConfig();
        }
        if (!approvedSwapAdapters[config.swapAdapter]) revert SwapAdapterNotApproved();

        destinationRoutes[routeId] = config;
        emit DestinationRouteUpdated(routeId, config.oftToken, config.payoutToken, config.swapAdapter, config.enabled);
    }

    function quoteBridgeFee(
        bytes32 routeId,
        uint256 bridgeAmount,
        bytes32 recipient,
        bytes calldata bridgeOptions,
        bytes calldata composeMsg
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        SourceRouteConfig memory route = _getEnabledSourceRoute(routeId);

        return IOFTBridgeAdapter(route.bridgeAdapter).quoteBridge(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: route.dstEid,
                to: recipient,
                token: route.oftToken,
                amountLD: bridgeAmount,
                minAmountLD: bridgeAmount,
                refundAddress: msg.sender,
                options: bridgeOptions,
                composeMsg: composeMsg
            })
        );
    }

    function swapAndBridge(
        bytes32 routeId,
        uint256 amountIn,
        uint256 minBridgeAmount,
        bytes32 recipient,
        bytes calldata sourceSwapData,
        bytes calldata bridgeOptions,
        bytes calldata composeMsg
    ) external payable nonReentrant returns (uint256 bridgeAmount, bytes32 messageId) {
        _requireCallerApproved();
        SourceRouteConfig memory route = _getEnabledSourceRoute(routeId);

        IERC20(route.tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(route.tokenIn).forceApprove(route.swapAdapter, amountIn);

        bridgeAmount = ISwapAdapter(route.swapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: route.tokenIn,
                tokenOut: route.oftToken,
                amountIn: amountIn,
                minAmountOut: minBridgeAmount,
                recipient: address(this),
                data: sourceSwapData
            })
        );

        IERC20(route.oftToken).forceApprove(route.bridgeAdapter, bridgeAmount);
        messageId = IOFTBridgeAdapter(route.bridgeAdapter).bridge{value: msg.value}(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: route.dstEid,
                to: recipient,
                token: route.oftToken,
                amountLD: bridgeAmount,
                minAmountLD: minBridgeAmount,
                refundAddress: msg.sender,
                options: bridgeOptions,
                composeMsg: composeMsg
            })
        );

        emit SourceSwapAndBridgeExecuted(routeId, msg.sender, amountIn, bridgeAmount, recipient, messageId);
    }

    function swapReceivedOFT(
        bytes32 routeId,
        uint256 oftAmountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata destinationSwapData
    ) external nonReentrant returns (uint256 payoutAmountOut) {
        _requireCallerApproved();
        DestinationRouteConfig memory route = _getEnabledDestinationRoute(routeId);

        IERC20(route.oftToken).safeTransferFrom(msg.sender, address(this), oftAmountIn);
        IERC20(route.oftToken).forceApprove(route.swapAdapter, oftAmountIn);

        payoutAmountOut = ISwapAdapter(route.swapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: route.oftToken,
                tokenOut: route.payoutToken,
                amountIn: oftAmountIn,
                minAmountOut: minAmountOut,
                recipient: recipient,
                data: destinationSwapData
            })
        );

        emit DestinationSwapExecuted(routeId, msg.sender, oftAmountIn, payoutAmountOut, recipient);
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "NATIVE_TRANSFER_FAILED");
    }

    function _requireCallerApproved() private view {
        if (!approvedCallers[msg.sender]) revert CallerNotApproved();
    }

    function _getEnabledSourceRoute(bytes32 routeId) private view returns (SourceRouteConfig memory route) {
        route = sourceRoutes[routeId];
        if (route.tokenIn == address(0)) revert SourceRouteMissing();
        if (!route.enabled) revert SourceRouteDisabled();
        if (!approvedSwapAdapters[route.swapAdapter]) revert SwapAdapterNotApproved();
        if (!approvedBridgeAdapters[route.bridgeAdapter]) revert BridgeAdapterNotApproved();
    }

    function _getEnabledDestinationRoute(bytes32 routeId)
        private
        view
        returns (DestinationRouteConfig memory route)
    {
        route = destinationRoutes[routeId];
        if (route.oftToken == address(0)) revert DestinationRouteMissing();
        if (!route.enabled) revert DestinationRouteDisabled();
        if (!approvedSwapAdapters[route.swapAdapter]) revert SwapAdapterNotApproved();
    }

    receive() external payable {}
}