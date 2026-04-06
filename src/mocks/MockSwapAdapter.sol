// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";

contract MockSwapAdapter is ISwapAdapter {
    using SafeTransferLib for IERC20;

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut) {
        IERC20(request.tokenIn).safeTransferFrom(msg.sender, address(this), request.amountIn);
        amountOut = request.amountIn;
        require(amountOut >= request.minAmountOut, "MIN_OUT");
        IERC20(request.tokenOut).safeTransfer(request.recipient, amountOut);
    }
}

