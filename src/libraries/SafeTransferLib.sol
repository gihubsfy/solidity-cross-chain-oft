// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";

library SafeTransferLib {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        _callOptionalReturn(token, abi.encodeCall(IERC20.transfer, (to, amount)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        _callOptionalReturn(token, abi.encodeCall(IERC20.transferFrom, (from, to, amount)));
    }

    function forceApprove(IERC20 token, address spender, uint256 amount) internal {
        bool approved = _callOptionalReturnBool(token, abi.encodeCall(IERC20.approve, (spender, amount)));
        if (!approved) {
            _callOptionalReturn(token, abi.encodeCall(IERC20.approve, (spender, 0)));
            _callOptionalReturn(token, abi.encodeCall(IERC20.approve, (spender, amount)));
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "TOKEN_CALL_FAILED");
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "TOKEN_CALL_REJECTED");
        }
    }

    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        (bool success, bytes memory returndata) = address(token).call(data);
        if (!success) {
            return false;
        }
        if (returndata.length == 0) {
            return true;
        }
        return abi.decode(returndata, (bool));
    }
}

