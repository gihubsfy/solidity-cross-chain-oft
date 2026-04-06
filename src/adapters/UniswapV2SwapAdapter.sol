// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IUniswapV2RouterLike} from "../interfaces/IUniswapV2RouterLike.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract UniswapV2SwapAdapter is ISwapAdapter, Ownable {
    using SafeTransferLib for IERC20;

    IUniswapV2RouterLike public immutable router;

    error InvalidPath();

    constructor(address initialOwner, address router_) Ownable(initialOwner) {
        router = IUniswapV2RouterLike(router_);
    }

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut) {
        address[] memory path = abi.decode(request.data, (address[]));
        if (path.length < 2 || path[0] != request.tokenIn || path[path.length - 1] != request.tokenOut) {
            revert InvalidPath();
        }

        IERC20(request.tokenIn).safeTransferFrom(msg.sender, address(this), request.amountIn);
        IERC20(request.tokenIn).forceApprove(address(router), request.amountIn);

        uint256[] memory amounts = router.swapExactTokensForTokens(
            request.amountIn,
            request.minAmountOut,
            path,
            request.recipient,
            block.timestamp
        );

        amountOut = amounts[amounts.length - 1];
    }
}

