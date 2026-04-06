// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IOFTBridgeAdapter} from "../interfaces/IOFTBridgeAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

contract SourceSwapAndBridge is Ownable, ReentrancyGuard {
    using SafeTransferLib for IERC20;

    IERC20 public immutable tokenIn;
    IERC20 public immutable oftToken;
    address public immutable swapAdapter;
    address public immutable bridgeAdapter;

    event SwappedAndBridged(
        address indexed caller,
        uint256 amountIn,
        uint256 bridgeAmount,
        uint32 dstEid,
        bytes32 recipient,
        bytes32 messageId
    );

    error InvalidConfig();

    constructor(
        address initialOwner,
        address tokenIn_,
        address oftToken_,
        address swapAdapter_,
        address bridgeAdapter_
    ) Ownable(initialOwner) {
        if (
            tokenIn_ == address(0) || oftToken_ == address(0) || swapAdapter_ == address(0)
                || bridgeAdapter_ == address(0)
        ) {
            revert InvalidConfig();
        }

        tokenIn = IERC20(tokenIn_);
        oftToken = IERC20(oftToken_);
        swapAdapter = swapAdapter_;
        bridgeAdapter = bridgeAdapter_;
    }

    function quoteBridgeFee(
        uint256 bridgeAmount,
        uint32 dstEid,
        bytes32 recipient,
        bytes calldata bridgeOptions,
        bytes calldata composeMsg
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        return IOFTBridgeAdapter(bridgeAdapter).quoteBridge(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: dstEid,
                to: recipient,
                token: address(oftToken),
                amountLD: bridgeAmount,
                minAmountLD: bridgeAmount,
                refundAddress: msg.sender,
                options: bridgeOptions,
                composeMsg: composeMsg
            })
        );
    }

    function swapAndBridge(
        uint256 amountIn,
        uint256 minBridgeAmount,
        uint32 dstEid,
        bytes32 recipient,
        bytes calldata swapData,
        bytes calldata bridgeOptions,
        bytes calldata composeMsg
    ) external payable nonReentrant returns (uint256 bridgeAmount, bytes32 messageId) {
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
        tokenIn.forceApprove(swapAdapter, amountIn);

        bridgeAmount = ISwapAdapter(swapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: address(tokenIn),
                tokenOut: address(oftToken),
                amountIn: amountIn,
                minAmountOut: minBridgeAmount,
                recipient: address(this),
                data: swapData
            })
        );

        oftToken.forceApprove(bridgeAdapter, bridgeAmount);
        messageId = IOFTBridgeAdapter(bridgeAdapter).bridge{value: msg.value}(
            IOFTBridgeAdapter.BridgeRequest({
                dstEid: dstEid,
                to: recipient,
                token: address(oftToken),
                amountLD: bridgeAmount,
                minAmountLD: minBridgeAmount,
                refundAddress: msg.sender,
                options: bridgeOptions,
                composeMsg: composeMsg
            })
        );

        emit SwappedAndBridged(msg.sender, amountIn, bridgeAmount, dstEid, recipient, messageId);
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function rescueNative(uint256 amount, address payable to) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "NATIVE_TRANSFER_FAILED");
    }

    receive() external payable {}
}