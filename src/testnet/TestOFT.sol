// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";

contract TestOFT is OFT {
    constructor(
        string memory name_,
        string memory symbol_,
        address endpoint_,
        address owner_,
        uint256 initialSupply
    ) OFT(name_, symbol_, endpoint_, owner_) Ownable(owner_) {
        if (initialSupply > 0) {
            _mint(owner_, initialSupply);
        }
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}