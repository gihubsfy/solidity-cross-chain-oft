// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {IOFTBridgeAdapter} from "../interfaces/IOFTBridgeAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";

contract MockBridgeAdapter is IOFTBridgeAdapter {
    using SafeTransferLib for IERC20;

    bytes32 public lastMessageId;

    event MockBridged(bytes32 indexed messageId, address indexed token, uint256 amountLD, uint32 dstEid, bytes32 to);

    function quoteBridge(BridgeRequest calldata request) external pure returns (uint256 nativeFee, uint256 lzTokenFee) {
        nativeFee = request.amountLD / 1000;
        lzTokenFee = 0;
    }

    function bridge(BridgeRequest calldata request) external payable returns (bytes32 messageId) {
        IERC20(request.token).safeTransferFrom(msg.sender, address(this), request.amountLD);
        messageId = keccak256(
            abi.encode(
                request.dstEid, request.to, request.token, request.amountLD, request.minAmountLD, request.options, request.composeMsg
            )
        );
        lastMessageId = messageId;
        emit MockBridged(messageId, request.token, request.amountLD, request.dstEid, request.to);
    }
}
