// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {IOFTBridgeAdapter} from "../interfaces/IOFTBridgeAdapter.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract ForkBridgeRecorderAdapter is IOFTBridgeAdapter, Ownable {
    using SafeTransferLib for IERC20;

    BridgeRequest public lastRequest;
    bytes32 public lastMessageId;

    event BridgeRecorded(bytes32 indexed messageId, address indexed token, uint256 amountLD, uint32 dstEid, bytes32 to);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function quoteBridge(BridgeRequest calldata request) external pure returns (uint256 nativeFee, uint256 lzTokenFee) {
        nativeFee = request.amountLD / 1000;
        lzTokenFee = 0;
    }

    function bridge(BridgeRequest calldata request) external payable returns (bytes32 messageId) {
        IERC20(request.token).safeTransferFrom(msg.sender, address(this), request.amountLD);
        lastRequest = request;
        messageId = keccak256(
            abi.encode(request.dstEid, request.to, request.token, request.amountLD, request.minAmountLD, block.timestamp)
        );
        lastMessageId = messageId;
        emit BridgeRecorded(messageId, request.token, request.amountLD, request.dstEid, request.to);
    }
}
