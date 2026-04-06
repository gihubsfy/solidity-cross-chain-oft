// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {IVaultAdapter} from "../interfaces/IVaultAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract SingleVaultAdapter is IVaultAdapter, Ownable {
    using SafeTransferLib for IERC20;

    address public immutable vault;
    address public immutable rewardToken;

    mapping(address => bool) public approvedCallers;

    event Deposited(address indexed token, uint256 amount, uint256 sharesMinted);
    event RewardsClaimed(address indexed rewardToken, uint256 rewardAmount);
    event CallerApprovalUpdated(address indexed caller, bool approved);

    error VaultCallFailed();
    error RewardTokenRequired();
    error VaultRequired();
    error CallerNotApproved();

    constructor(address initialOwner, address vault_, address rewardToken_) Ownable(initialOwner) {
        if (vault_ == address(0)) revert VaultRequired();
        if (rewardToken_ == address(0)) revert RewardTokenRequired();
        vault = vault_;
        rewardToken = rewardToken_;
    }

    function setCallerApproval(address caller, bool approved) external onlyOwner {
        approvedCallers[caller] = approved;
        emit CallerApprovalUpdated(caller, approved);
    }

    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256 sharesMinted) {
        if (!approvedCallers[msg.sender]) revert CallerNotApproved();

        (bytes memory depositCallData, address shareToken) = abi.decode(data, (bytes, address));

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).forceApprove(vault, amount);

        uint256 beforeShares = shareToken == address(0) ? 0 : IERC20(shareToken).balanceOf(address(this));
        (bool success, bytes memory returnData) = vault.call(depositCallData);
        if (!success) revert VaultCallFailed();

        if (shareToken != address(0)) {
            sharesMinted = IERC20(shareToken).balanceOf(address(this)) - beforeShares;
        } else if (returnData.length >= 32) {
            sharesMinted = abi.decode(returnData, (uint256));
        }

        emit Deposited(token, amount, sharesMinted);
    }

    function claimRewards(bytes calldata data) external returns (address rewardToken_, uint256 rewardAmount) {
        if (!approvedCallers[msg.sender]) revert CallerNotApproved();

        bytes memory claimCallData = abi.decode(data, (bytes));

        uint256 beforeRewards = IERC20(rewardToken).balanceOf(address(this));
        (bool success,) = vault.call(claimCallData);
        if (!success) revert VaultCallFailed();

        rewardAmount = IERC20(rewardToken).balanceOf(address(this)) - beforeRewards;
        rewardToken_ = rewardToken;

        if (rewardAmount > 0) {
            IERC20(rewardToken).safeTransfer(msg.sender, rewardAmount);
        }

        emit RewardsClaimed(rewardToken, rewardAmount);
    }
}