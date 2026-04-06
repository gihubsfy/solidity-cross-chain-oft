// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISwapAdapter {
    struct SwapRequest {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address recipient;
        bytes data;
    }

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut);
}

