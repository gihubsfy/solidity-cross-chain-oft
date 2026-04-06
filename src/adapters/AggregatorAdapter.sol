// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract AggregatorAdapter is ISwapAdapter, Ownable {
    using SafeTransferLib for IERC20;

    struct AggregatorExecution {
        address spender;
        address target;
        uint256 value;
        bytes callData;
    }

    mapping(address => bool) public approvedTargets;
    mapping(address => bool) public approvedSpenders;

    event ApprovedTargetUpdated(address indexed target, bool approved);
    event ApprovedSpenderUpdated(address indexed spender, bool approved);

    error InvalidExecution();
    error TargetNotApproved();
    error SpenderNotApproved();
    error SwapCallFailed();
    error AmountOutTooLow();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setApprovedTarget(address target, bool approved) external onlyOwner {
        approvedTargets[target] = approved;
        emit ApprovedTargetUpdated(target, approved);
    }

    function setApprovedSpender(address spender, bool approved) external onlyOwner {
        approvedSpenders[spender] = approved;
        emit ApprovedSpenderUpdated(spender, approved);
    }

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut) {
        AggregatorExecution memory exec = abi.decode(request.data, (AggregatorExecution));
        if (exec.target == address(0) || exec.spender == address(0) || exec.callData.length == 0) {
            revert InvalidExecution();
        }
        if (!approvedTargets[exec.target]) revert TargetNotApproved();
        if (!approvedSpenders[exec.spender]) revert SpenderNotApproved();

        IERC20 tokenOut = IERC20(request.tokenOut);
        uint256 recipientBalanceBefore = tokenOut.balanceOf(request.recipient);
        uint256 adapterBalanceBefore = tokenOut.balanceOf(address(this));

        IERC20(request.tokenIn).safeTransferFrom(msg.sender, address(this), request.amountIn);
        IERC20(request.tokenIn).forceApprove(exec.spender, request.amountIn);

        (bool success,) = exec.target.call{value: exec.value}(exec.callData);
        if (!success) revert SwapCallFailed();

        uint256 recipientBalanceAfter = tokenOut.balanceOf(request.recipient);
        uint256 adapterBalanceAfter = tokenOut.balanceOf(address(this));

        uint256 directRecipientAmount = recipientBalanceAfter - recipientBalanceBefore;
        uint256 adapterReceivedAmount = adapterBalanceAfter - adapterBalanceBefore;

        if (adapterReceivedAmount != 0 && request.recipient != address(this)) {
            tokenOut.safeTransfer(request.recipient, adapterReceivedAmount);
        }

        amountOut = directRecipientAmount + adapterReceivedAmount;
        if (amountOut < request.minAmountOut) revert AmountOutTooLow();
    }

    receive() external payable {}
}