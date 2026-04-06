// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

contract DestinationSwapExecutor is Ownable, ReentrancyGuard {
    using SafeTransferLib for IERC20;

    IERC20 public immutable oftToken;
    mapping(address => bool) public approvedSwapAdapters;

    event SwapAdapterApprovalUpdated(address indexed swapAdapter, bool approved);
    event DestinationSwapExecuted(
        address indexed caller,
        address indexed payoutToken,
        uint256 oftAmountIn,
        uint256 payoutAmountOut,
        address recipient
    );

    error InvalidConfig();
    error SwapAdapterNotApproved();

    constructor(address initialOwner, address oftToken_) Ownable(initialOwner) {
        if (oftToken_ == address(0)) revert InvalidConfig();
        oftToken = IERC20(oftToken_);
    }

    function setSwapAdapterApproval(address swapAdapter, bool approved) external onlyOwner {
        approvedSwapAdapters[swapAdapter] = approved;
        emit SwapAdapterApprovalUpdated(swapAdapter, approved);
    }

    function swapReceivedOFT(
        address payoutToken,
        address swapAdapter,
        uint256 oftAmountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata swapData
    ) external nonReentrant returns (uint256 payoutAmountOut) {
        if (!approvedSwapAdapters[swapAdapter]) revert SwapAdapterNotApproved();

        oftToken.safeTransferFrom(msg.sender, address(this), oftAmountIn);
        oftToken.forceApprove(swapAdapter, oftAmountIn);

        payoutAmountOut = ISwapAdapter(swapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: address(oftToken),
                tokenOut: payoutToken,
                amountIn: oftAmountIn,
                minAmountOut: minAmountOut,
                recipient: recipient,
                data: swapData
            })
        );

        emit DestinationSwapExecuted(msg.sender, payoutToken, oftAmountIn, payoutAmountOut, recipient);
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}