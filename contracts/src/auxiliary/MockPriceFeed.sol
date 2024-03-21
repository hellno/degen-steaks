// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/**
 * @dev MockPriceFeed is used on Testnet
 */
contract MockPriceFeed {
    uint256 price;

    /// @dev returns the usdc value of 1 mio DEGEN
    function getPrice(uint32) external view returns (uint256) {
        return price;
    }

    function setPrice(uint256 price_) public {
        price = price_;
    }
}
