// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";
import {IVaultAdapter} from "../interfaces/IVaultAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract VaultRewardSwapStrategy is IStrategyAdapter, Ownable {
    using SafeTransferLib for IERC20;

    struct VaultRewardSwapData {
        address vaultAdapter;
        address rewardSwapAdapter;
        uint256 minRewardAmount;
        bytes vaultDepositData;
        bytes rewardClaimData;
        bytes rewardSwapData;
    }

    mapping(address => bool) public approvedCallers;

    event CallerApprovalUpdated(address indexed caller, bool approved);

    error CallerNotApproved();

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

        VaultRewardSwapData memory config = abi.decode(request.data, (VaultRewardSwapData));

        IERC20(request.inputToken).safeTransferFrom(msg.sender, address(this), request.inputAmount);
        IERC20(request.inputToken).forceApprove(config.vaultAdapter, request.inputAmount);
        IVaultAdapter(config.vaultAdapter).deposit(request.inputToken, request.inputAmount, config.vaultDepositData);

        (address rewardToken, uint256 rewardAmount) = IVaultAdapter(config.vaultAdapter).claimRewards(config.rewardClaimData);
        require(rewardAmount >= config.minRewardAmount, "REWARD_TOO_LOW");

        if (rewardToken == request.payoutToken) {
            IERC20(rewardToken).safeTransfer(request.recipient, rewardAmount);
            return (rewardToken, rewardAmount);
        }

        IERC20(rewardToken).forceApprove(config.rewardSwapAdapter, rewardAmount);
        payoutAmount = ISwapAdapter(config.rewardSwapAdapter).swapExactInput(
            ISwapAdapter.SwapRequest({
                tokenIn: rewardToken,
                tokenOut: request.payoutToken,
                amountIn: rewardAmount,
                minAmountOut: request.minPayoutAmount,
                recipient: request.recipient,
                data: config.rewardSwapData
            })
        );

        payoutToken = request.payoutToken;
    }
}