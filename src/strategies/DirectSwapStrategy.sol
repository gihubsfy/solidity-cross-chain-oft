// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract DirectSwapStrategy is IStrategyAdapter, Ownable {
    using SafeTransferLib for IERC20;

    struct DirectSwapData {
        address swapAdapter;
        bytes swapData;
    }

    mapping(address => bool) public approvedCallers;

    event CallerApprovalUpdated(address indexed caller, bool approved);

    error CallerNotApproved();
    error SwapAdapterRequired();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setCallerApproval(address caller, bool approved) external onlyOwner {
        approvedCallers[caller] = approved;
        emit CallerApprovalUpdated(caller, approved);
    }

    function executeStrategy(StrategyRequest calldata request)
        external
        returns (address payoutToken, uint256 payoutAmount)
    {
        if (!approvedCallers[msg.sender]) revert CallerNotApproved();

        DirectSwapData memory config = abi.decode(request.data, (DirectSwapData));
        if (config.swapAdapter == address(0)) revert SwapAdapterRequired();

        IERC20(request.inputToken).safeTransferFrom(msg.sender, address(this), request.inputAmount);
        IERC20(request.inputToken).forceApprove(config.swapAdapter, request.inputAmount);

        payoutAmount = ISwapAdapter(config.swapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: request.inputToken,
                tokenOut: request.payoutToken,
                amountIn: request.inputAmount,
                minAmountOut: request.minPayoutAmount,
                recipient: request.recipient,
                data: config.swapData
            })
        );

        payoutToken = request.payoutToken;
    }
}