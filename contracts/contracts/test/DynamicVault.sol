// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../permutations/DynamicConsumable.sol";

/* My Vault has 1000 Scroll Tokens, and each voucher is worth 100 tokens */
contract DynamicVault is Ownable, DynamicConsumable {
    address public tokenAddress;
    uint256 public voucherValue;

    constructor(
        uint256 _totalUsesPerConsumer,
        address _tokenAddress,
        uint256 _voucherValue
    ) DynamicConsumable(_totalUsesPerConsumer) Ownable(msg.sender) {
        tokenAddress = _tokenAddress;
        voucherValue = _voucherValue;
    }

    function ownerWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function consumeSecret(
        address receiver
    ) external onlyConsumer() {
        IERC20(tokenAddress).transfer(receiver, voucherValue);
    }
}
