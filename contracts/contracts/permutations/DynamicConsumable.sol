// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

//
///                                                                                   -*+*##*-                          
///    @title CONSUMABLE Secrets                                                    :%=     .=%:                        
///    @notice Secure, one-time granular access control for on-chain actions          =@.  .@+                          
///    @notice Generate and deliver front-running resistant secrets               .:::+@.  .@*:::.                      
///    @notice This version implements a mapping for Dynamic Generation          =+--:::    ---::+=                     
///    @author @gonzaotc, @nv-cho, @estok_eth, @AlexisWolfs                     =%: ..      ....   :%=                   
///    @custom:repository https://github.com/Devconeta/CONSUMABLE            :@=  ...:  .:::::::..  =@:                 
///    @custom:security-contact gonza.otc@gmail.com                         :@= .::::   .:::::::::.. =@:                 
///    @custom:version 0.1.0                                                :@= :===-   :=======+++= =@:                    
///                                                                          :@= :=*=   =+++*****+=.=@:                 
///                                                                            =@:.-=*: -+*****+=::@+                   
///                                                                               +*==--===--=*+                     
//

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

/// @title DynamicConsumable
/// @notice Contract for managing dynamic, mapping-based access control to consumable resources.
/// @dev This contract uses AccessControl for role-based permissions and maintains a mapping for tracking valid consumers.
/// @dev The Multicall utility is included to allow batching multiple consumer additions into a single transaction.
contract DynamicConsumable is AccessControl, Multicall {
    /// @notice Role identifier for the entity that can add new consumers.
    bytes32 public constant GENERATOR_ROLE = keccak256("GENERATOR_ROLE");

    /// @notice The maximum number of uses allowed per consumer.
    uint256 public totalUsesPerConsumer;

    /// @notice A mapping to store valid consumers.
    mapping(address => bool) public consumers;

    /// @notice A mapping to track the number of times each address has consumed the resource.
    mapping(address => uint256) public consumptions;

    /// @notice Initializes the contract with a limit on uses per consumer and grants the deployer the GENERATOR_ROLE.
    /// @param _totalUsesPerConsumer The maximum number of uses allowed per consumer.
    constructor(uint256 _totalUsesPerConsumer) {
        _grantRole(GENERATOR_ROLE, msg.sender);
        totalUsesPerConsumer = _totalUsesPerConsumer;
    }

    /// @notice Modifier to restrict access to valid consumers.
    /// @dev Calls the internal _checkConsumer function to validate the consumer.
    modifier onlyConsumer() {
        _checkConsumer();
        _;
    }

    /// @notice Internal function to validate the consumer and increment their consumption count.
    /// @dev This function checks if the caller is a valid consumer and has not exceeded their allowed uses.
    function _checkConsumer() internal virtual {
        require(isValidConsumer(), "!Consumer");
        require(consumerHasNotExceededTotalUses(), "!Uses");
        _incrementConsumerConsumptions();
    }

    /// @notice Verifies if the caller is a valid consumer.
    /// @return bool True if the caller is a valid consumer, false otherwise.
    function isValidConsumer() public view virtual returns (bool) {
        return consumers[msg.sender];
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

    /// @notice Adds a new consumer to the list of valid consumers.
    /// @param _consumer The address of the consumer to be added.
    /// @dev This function can only be called by an account with the GENERATOR_ROLE.
    function _addConsumer(address _consumer) public onlyRole(GENERATOR_ROLE) {
        consumers[_consumer] = true;
    }

    /// @notice Batches multiple consumer additions into a single transaction.
    /// @dev The Multicall utility allows the generator to add multiple consumers at once, reducing gas costs and improving efficiency.
    /// @dev Example usage: multicall([addConsumer1, addConsumer2, ...]).
}
