// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract Consumable {
    bytes32 public merkleRoot;
    uint256 public totalUsesPerConsumer;
    mapping(address => uint256) public userConsumptions;

    constructor(bytes32 _merkleRoot, uint256 _totalUsesPerConsumer) {
        merkleRoot = _merkleRoot;
        totalUsesPerConsumer = _totalUsesPerConsumer;
    }

    modifier onlyConsumer(bytes32[] calldata _merkleProof) {
        _checkConsumer(_merkleProof);
        _;
    }

    function _checkConsumer(bytes32[] calldata _merkleProof) internal virtual {
        require(isValidConsumer(_merkleProof), "Not a valid consumer");
        require(consumerHasNotExceededTotalUses(), "Consumer has exceeded total uses");
        _incrementConsumerComsumptions();
    }

    function isValidConsumer(bytes32[] calldata _merkleProof) public view returns (bool) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
    }

    function consumerHasNotExceededTotalUses() public view returns (bool) {
        return userConsumptions[msg.sender] < totalUsesPerConsumer;
    }

    function _incrementConsumerComsumptions() internal {
        userConsumptions[msg.sender]++;
    }
}
