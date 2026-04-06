// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {Ownable} from "./utils/Ownable.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

contract DestinationExecutor is Ownable, ReentrancyGuard {
    using SafeTransferLib for IERC20;

    struct ExecutionRequest {
        address strategyAdapter;
        address inputToken;
        uint256 inputAmount;
        address payoutToken;
        uint256 minPayoutAmount;
        address recipient;
        bytes strategyData;
    }

    mapping(address => bool) public approvedStrategies;

    event StrategyApprovalUpdated(address indexed strategy, bool approved);
    event Executed(
        address indexed strategyAdapter,
        address indexed caller,
        address indexed inputToken,
        uint256 inputAmount,
        address payoutToken,
        uint256 payoutAmount,
        address recipient
    );

    error StrategyNotApproved();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setStrategyApproval(address strategy, bool approved) external onlyOwner {
        approvedStrategies[strategy] = approved;
        emit StrategyApprovalUpdated(strategy, approved);
    }

    function execute(ExecutionRequest calldata request)
        external
        nonReentrant
        returns (address payoutToken, uint256 payoutAmount)
    {
        if (!approvedStrategies[request.strategyAdapter]) revert StrategyNotApproved();

        IERC20(request.inputToken).safeTransferFrom(msg.sender, address(this), request.inputAmount);
        IERC20(request.inputToken).forceApprove(request.strategyAdapter, request.inputAmount);

        (payoutToken, payoutAmount) = IStrategyAdapter(request.strategyAdapter).executeStrategy(
            IStrategyAdapter.StrategyRequest({
                inputToken: request.inputToken,
                inputAmount: request.inputAmount,
                payoutToken: request.payoutToken,
                minPayoutAmount: request.minPayoutAmount,
                recipient: request.recipient,
                data: request.strategyData
            })
        );

        require(payoutToken == request.payoutToken, "UNEXPECTED_PAYOUT_TOKEN");
        require(payoutAmount >= request.minPayoutAmount, "PAYOUT_TOO_LOW");

        emit Executed(
            request.strategyAdapter,
            msg.sender,
            request.inputToken,
            request.inputAmount,
            payoutToken,
            payoutAmount,
            request.recipient
        );
    }

    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}

