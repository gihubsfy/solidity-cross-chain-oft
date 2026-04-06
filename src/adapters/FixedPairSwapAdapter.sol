// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

interface IFixedPairLike {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

contract FixedPairSwapAdapter is ISwapAdapter, Ownable {
    using SafeTransferLib for IERC20;

    address public immutable pair;
    address public immutable token0;
    address public immutable token1;

    error InvalidPairConfig();
    error InvalidPath();
    error AmountOutTooLow();

    constructor(address initialOwner, address pair_) Ownable(initialOwner) {
        pair = pair_;
        token0 = IFixedPairLike(pair_).token0();
        token1 = IFixedPairLike(pair_).token1();

        if (pair_ == address(0) || token0 == address(0) || token1 == address(0)) {
            revert InvalidPairConfig();
        }
    }

    function swapExactInput(SwapRequest calldata request) external returns (uint256 amountOut) {
        address[] memory path = abi.decode(request.data, (address[]));
        if (path.length != 2 || path[0] != request.tokenIn || path[1] != request.tokenOut) {
            revert InvalidPath();
        }

        IERC20(request.tokenIn).safeTransferFrom(msg.sender, pair, request.amountIn);

        (uint112 reserve0, uint112 reserve1,) = IFixedPairLike(pair).getReserves();

        if (request.tokenIn == token0 && request.tokenOut == token1) {
            amountOut = _getAmountOut(request.amountIn, reserve0, reserve1);
            if (amountOut < request.minAmountOut) revert AmountOutTooLow();
            IFixedPairLike(pair).swap(0, amountOut, request.recipient, "");
        } else if (request.tokenIn == token1 && request.tokenOut == token0) {
            amountOut = _getAmountOut(request.amountIn, reserve1, reserve0);
            if (amountOut < request.minAmountOut) revert AmountOutTooLow();
            IFixedPairLike(pair).swap(amountOut, 0, request.recipient, "");
        } else {
            revert InvalidPath();
        }
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) private pure returns (uint256) {
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }
}
