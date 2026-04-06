// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

interface IV2FactoryLike {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IV2PairLike {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

contract V2PairSwapAdapter is ISwapAdapter, Ownable {
    using SafeTransferLib for IERC20;

    address public immutable factory;

    error InvalidPath();
    error PairNotFound();
    error AmountOutTooLow();

    constructor(address initialOwner, address factory_) Ownable(initialOwner) {
        factory = factory_;
    }

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut) {
        address[] memory path = abi.decode(request.data, (address[]));
        if (path.length != 2 || path[0] != request.tokenIn || path[1] != request.tokenOut) {
            revert InvalidPath();
        }

        address pair = IV2FactoryLike(factory).getPair(request.tokenIn, request.tokenOut);
        if (pair == address(0)) revert PairNotFound();

        IERC20(request.tokenIn).safeTransferFrom(msg.sender, pair, request.amountIn);

        (uint112 reserve0, uint112 reserve1,) = IV2PairLike(pair).getReserves();
        address token0 = IV2PairLike(pair).token0();

        if (request.tokenIn == token0) {
            amountOut = _getAmountOut(request.amountIn, reserve0, reserve1);
            if (amountOut < request.minAmountOut) revert AmountOutTooLow();
            IV2PairLike(pair).swap(0, amountOut, request.recipient, "");
        } else {
            amountOut = _getAmountOut(request.amountIn, reserve1, reserve0);
            if (amountOut < request.minAmountOut) revert AmountOutTooLow();
            IV2PairLike(pair).swap(amountOut, 0, request.recipient, "");
        }
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) private pure returns (uint256) {
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }
}