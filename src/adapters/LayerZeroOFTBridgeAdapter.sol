// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {IOFTBridgeAdapter} from "../interfaces/IOFTBridgeAdapter.sol";
import {ILayerZeroOFT} from "../interfaces/ILayerZeroOFT.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {Ownable} from "../utils/Ownable.sol";

contract LayerZeroOFTBridgeAdapter is IOFTBridgeAdapter, Ownable {
    using SafeTransferLib for IERC20;

    mapping(address => bool) public supportedOfts;

    event OftSupportUpdated(address indexed token, bool supported);
    event BridgeForwarded(address indexed token, bytes32 indexed messageId, uint32 dstEid, bytes32 to, uint256 amountLD);

    error UnsupportedOft();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setSupportedOft(address token, bool supported) external onlyOwner {
        supportedOfts[token] = supported;
        emit OftSupportUpdated(token, supported);
    }

    function quoteBridge(BridgeRequest calldata request) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        _requireSupported(request.token);
        ILayerZeroOFT.MessagingFee memory fee = ILayerZeroOFT(request.token).quoteSend(_toSendParam(request), false);
        nativeFee = fee.nativeFee;
        lzTokenFee = fee.lzTokenFee;
    }

    function bridge(BridgeRequest calldata request) external payable returns (bytes32 messageId) {
        _requireSupported(request.token);

        IERC20(request.token).safeTransferFrom(msg.sender, address(this), request.amountLD);
        ILayerZeroOFT.MessagingReceipt memory receipt = ILayerZeroOFT(request.token).send{value: msg.value}(
            _toSendParam(request),
            ILayerZeroOFT.MessagingFee({nativeFee: msg.value, lzTokenFee: 0}),
            request.refundAddress
        );

        messageId = receipt.guid;
        emit BridgeForwarded(request.token, messageId, request.dstEid, request.to, request.amountLD);
    }

    function _toSendParam(BridgeRequest calldata request)
        private
        pure
        returns (ILayerZeroOFT.SendParam memory sendParam)
    {
        sendParam = ILayerZeroOFT.SendParam({
            dstEid: request.dstEid,
            to: request.to,
            amountLD: request.amountLD,
            minAmountLD: request.minAmountLD,
            extraOptions: request.options,
            composeMsg: request.composeMsg,
            oftCmd: ""
        });
    }

    function _requireSupported(address token) private view {
        if (!supportedOfts[token]) revert UnsupportedOft();
    }
}

