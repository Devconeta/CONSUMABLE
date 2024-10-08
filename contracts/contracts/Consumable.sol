// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

//
///                                                                                   -*+*##*-                          
///    @title CONSUMABLE Secrets                                                    :%=     .=%:                        
///    @notice Secure, one-time granular access control for on-chain actions          =@.  .@+                          
///    @notice Generate and deliver front-running resistant secrets               .:::+@.  .@*:::.                      
///    @notice This version implements a Merkletree for Static Generation       =+--:::    ---::+=                     
///    @author @gonzaotc, @nv-cho, @estok_eth, @AlexisWolfs                    =%: ..      ....   :%=                   
///    @custom:repository https://github.com/Devconeta/CONSUMABLE            :@=  ...:  .:::::::..  =@:                 
///    @custom:security-contact gonza.otc@gmail.com                         :@= .::::   .:::::::::.. =@:                 
///    @custom:version 0.1.0                                                :@= :===-   :=======+++= =@:                    
///                                                                          :@= :=*=   =+++*****+=.=@:                 
///                                                                            =@:.-=*: -+*****+=::@+                   
///                                                                               +*==--===--=*+                     
//

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title Consumable
/// @notice Abstract contract for managing consumable resources with Merkle tree-based access control.
/// @dev This contract should be inherited by other contracts that implement specific consumer validation logic.
abstract contract Consumable {
    /// @notice The Merkle root used to verify consumer eligibility.
    bytes32 public merkleRoot;

    /// @notice The maximum number of uses allowed per consumer.
    uint256 public totalUsesPerConsumer;

    /// @notice A mapping to track the number of times each address has consumed the resource.
    mapping(address => uint256) public consumptions;

    /// @notice Initializes the contract with a Merkle root and a limit on uses per consumer.
    /// @param _merkleRoot The Merkle root for consumer verification.
    /// @param _totalUsesPerConsumer The maximum number of uses allowed per consumer.
    constructor(bytes32 _merkleRoot, uint256 _totalUsesPerConsumer) {
        merkleRoot = _merkleRoot;
        totalUsesPerConsumer = _totalUsesPerConsumer;
    }

    /// @notice Modifier to restrict access to valid consumers based on a Merkle proof.
    /// @param _merkleProof The Merkle proof provided by the caller to validate their eligibility.
    modifier onlyConsumer(bytes32[] calldata _merkleProof) {
        _checkConsumer(_merkleProof);
        _;
    }

    /// @notice Internal function to validate the consumer and increment their consumption count.
    /// @param _merkleProof The Merkle proof provided by the caller.
    /// @dev This function can be overridden by derived contracts to customize consumer validation.
    function _checkConsumer(bytes32[] calldata _merkleProof) internal virtual {
        require(isValidConsumer(_merkleProof), "!Consumer");
        require(consumerHasNotExceededTotalUses(), "!Uses");
        _incrementConsumerConsumptions();
    }

    /// @notice Verifies if the caller is a valid consumer using a Merkle proof.
    /// @param _merkleProof The Merkle proof provided by the caller.
    /// @return bool True if the caller is a valid consumer, false otherwise.
    function isValidConsumer(bytes32[] calldata _merkleProof) public view virtual returns (bool) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
    }

    /// @notice Checks if the caller has not exceeded their allowed number of uses.
    /// @return bool True if the caller has not exceeded their allowed uses, false otherwise.
    function consumerHasNotExceededTotalUses() public view returns (bool) {
        return consumptions[msg.sender] < totalUsesPerConsumer;
    }

    /// @notice Increments the consumption count for the caller.
    /// @dev This function is called after successful validation of the consumer.
    function _incrementConsumerConsumptions() internal {
        consumptions[msg.sender]++;
    }
}
