// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVaultAdapter {
    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256 sharesMinted);
    function claimRewards(bytes calldata data) external returns (address rewardToken, uint256 rewardAmount);
}

