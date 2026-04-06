// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOFTBridgeAdapter {
    struct BridgeRequest {
        uint32 dstEid;
        bytes32 to;
        address token;
        uint256 amountLD;
        uint256 minAmountLD;
        address refundAddress;
        bytes options;
        bytes composeMsg;
    }

    function quoteBridge(BridgeRequest calldata request) external view returns (uint256 nativeFee, uint256 lzTokenFee);
    function bridge(BridgeRequest calldata request) external payable returns (bytes32 messageId);
}

