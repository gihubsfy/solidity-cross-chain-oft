// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStrategyAdapter {
    struct StrategyRequest {
        address inputToken;
        uint256 inputAmount;
        address payoutToken;
        uint256 minPayoutAmount;
        address recipient;
        bytes data;
    }

    function executeStrategy(StrategyRequest calldata request)
        external
        returns (address payoutToken, uint256 payoutAmount);
}

