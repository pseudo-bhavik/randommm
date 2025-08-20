// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol"; // For signature verification

/**
 * @title FlappyArbDistributor
 * @dev Contract for distributing $FLAPPY tokens to Flappy Arb game players
 *
 * This contract allows a designated game server to authorize token claims
 * by signing messages. It includes features for pausing distribution,
 * setting daily claim limits, and defining min/max claim amounts.
 */
contract FlappyArbDistributor is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32; // Enables .toEthSignedMessageHash() and .recover()

    IERC20 public immutable flappyToken;
    
    // The address of the game server that is authorized to sign claim requests.
    // Only signatures from this address will be accepted for token claims.
    address public gameServerSigner;
    
    // --- Configuration Limits (set by owner) ---
    uint256 public maxClaimsPerDay; // Maximum number of claims a user can make per day
    uint256 public minClaimAmount;  // Minimum amount of tokens that can be claimed in a single transaction
    uint256 public maxClaimAmount;  // Maximum amount of tokens that can be claimed in a single transaction
    
    // --- State Variables ---
    // Mapping to track claimed rewards by user and a unique game session ID.
    // This prevents the same game session from being claimed multiple times.
    mapping(address => mapping(bytes32 => bool)) public claimedRewards;
    
    // Mapping to track the total amount of tokens claimed by each user over time.
    mapping(address => uint256) public totalClaimed;
    
    // Mapping to track daily claims per user.
    // Stores (user address => day timestamp => count of claims for that day).
    mapping(address => mapping(uint256 => uint256)) public dailyClaims;
    
    // --- Events ---
    event RewardClaimed(
        address indexed player,
        bytes32 indexed gameSessionId,
        uint256 amount,
        uint256 score,
        uint256 multiplier
    );
    event GameServerSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event MaxClaimsPerDayUpdated(uint256 oldLimit, uint256 newLimit);
    event MinClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    event Paused(address account);
    event Unpaused(address account);

    /**
     * @dev Constructor to initialize the contract.
     * @param _flappyTokenAddress The address of the $FLAPPY ERC20 token.
     * @param _initialGameServerSigner The initial address authorized to sign claim requests.
     */
    constructor(address _flappyTokenAddress, address _initialGameServerSigner) Ownable(msg.sender) {
        require(_flappyTokenAddress != address(0), "Invalid FLAPPY token address");
        require(_initialGameServerSigner != address(0), "Invalid initial game server signer address");
        
        flappyToken = IERC20(_flappyTokenAddress);
        gameServerSigner = _initialGameServerSigner;
        
        // Set initial default limits (owner can change these later)
        maxClaimsPerDay = 5; // Default: 5 claims per user per day
        minClaimAmount = 1;  // Default: Minimum 1 token per claim
        // Default max claim amount is set to a large number, assuming 18 decimals for the token.
        // This should be adjusted based on actual token decimals and game economics.
        maxClaimAmount = 1_000_000 * (10**18); 
    }

    // --- Owner-Only Functions ---

    /**
     * @dev Pauses the contract. When paused, `claimReward` cannot be called.
     * Only callable by the owner.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract. Allows `claimReward` to be called again.
     * Only callable by the owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Sets the address of the game server that is authorized to sign claim requests.
     * This is crucial for security, as only signatures from this address will be honored.
     * Only callable by the owner.
     * @param _newGameServerSigner The new address for the game server signer.
     */
    function setGameServerSigner(address _newGameServerSigner) public onlyOwner {
        require(_newGameServerSigner != address(0), "Invalid game server signer address");
        emit GameServerSignerUpdated(gameServerSigner, _newGameServerSigner);
        gameServerSigner = _newGameServerSigner;
    }

    /**
     * @dev Sets the maximum number of claims a user can make per day.
     * Only callable by the owner.
     * @param _newLimit The new daily claim limit. Must be greater than 0.
     */
    function setMaxClaimsPerDay(uint256 _newLimit) public onlyOwner {
        require(_newLimit > 0, "Daily limit must be greater than 0");
        emit MaxClaimsPerDayUpdated(maxClaimsPerDay, _newLimit);
        maxClaimsPerDay = _newLimit;
    }

    /**
     * @dev Sets the minimum amount of tokens that can be claimed in a single transaction.
     * Only callable by the owner.
     * @param _newMinAmount The new minimum claim amount. Must not exceed `maxClaimAmount`.
     */
    function setMinClaimAmount(uint256 _newMinAmount) public onlyOwner {
        require(_newMinAmount <= maxClaimAmount, "Min amount cannot exceed max amount");
        emit MinClaimAmountUpdated(minClaimAmount, _newMinAmount);
        minClaimAmount = _newMinAmount;
    }

    /**
     * @dev Sets the maximum amount of tokens that can be claimed in a single transaction.
     * Only callable by the owner.
     * @param _newMaxAmount The new maximum claim amount. Must not be less than `minClaimAmount`.
     */
    function setMaxClaimAmount(uint256 _newMaxAmount) public onlyOwner {
        require(_newMaxAmount >= minClaimAmount, "Max amount cannot be less than min amount");
        emit MaxClaimAmountUpdated(maxClaimAmount, _newMaxAmount);
        maxClaimAmount = _newMaxAmount;
    }

    /**
     * @dev Allows the owner to withdraw any ERC20 tokens accidentally sent to this contract.
     * This is an emergency function and should be used with caution.
     * Only callable by the owner.
     * @param _tokenAddress The address of the ERC20 token to withdraw.
     * @param _to The address to send the tokens to.
     */
    function emergencyWithdrawToken(address _tokenAddress, address _to) public onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        // Prevent withdrawing the main SMOL token if it's the only one in the contract
        // This check is important if the contract is intended to hold SMOL tokens for distribution.
        // If the contract is only meant to hold other accidental tokens, this check can be removed.
        if (_tokenAddress == address(flappyToken)) {
            revert("Cannot use emergency withdraw for the main FLAPPY token");
        }

        token.transfer(_to, balance);
        emit TokensWithdrawn(_to, balance);
    }

    // --- User Claim Function ---

    /**
     * @dev Allows a user to claim their $FLAPPY token rewards.
     * This function is protected by a signature verification mechanism, ensuring that
     * only claims authorized by the designated `gameServerSigner` are processed.
     *
     * @param _player The address of the player claiming the reward. This must be `msg.sender`.
     * @param _amount The amount of $FLAPPY tokens to claim.
     * @param _score The game score associated with this claim (for record-keeping).
     * @param _multiplier The multiplier associated with this claim (for record-keeping).
     * @param _gameSessionId A unique identifier for the game session. This prevents
     *                       the same game session's reward from being claimed multiple times.
     * @param _signature The ECDSA signature from the `gameServerSigner` authorizing this claim.
     */
    function claimReward(
        address _player,
        uint256 _amount,
        uint256 _score,
        uint256 _multiplier,
        bytes32 _gameSessionId,
        bytes memory _signature
    ) public nonReentrant whenNotPaused {
        // 1. Basic Checks
        require(msg.sender == _player, "Claimer must be the player");
        require(!claimedRewards[_player][_gameSessionId], "Reward already claimed for this session");

        // 2. Amount Validation
        require(_amount >= minClaimAmount, "Claim amount too low");
        require(_amount <= maxClaimAmount, "Claim amount too high");

        // 3. Daily Limit Check
        // Calculate the start of the current day in UTC (midnight).
        // This ensures daily limits reset consistently regardless of timezone.
        uint256 today = block.timestamp / 1 days; 
        require(dailyClaims[_player][today] < maxClaimsPerDay, "Daily claim limit reached");

        // 4. Signature Verification
        // Construct the message hash that was originally signed by the game server.
        // It's crucial that this message matches exactly what the server signed.
        // Including `address(this)` prevents signatures from being replayed on other contracts.
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                _player,
                _amount,
                _score,
                _multiplier,
                _gameSessionId,
                address(this) // Contract address for domain separation
            )
        );
        // Convert to Ethereum-signed message hash (adds "\x19Ethereum Signed Message:\n32" prefix)
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // Recover the signer address from the signature.
        address signer = ethSignedMessageHash.recover(_signature);

        // Verify that the recovered signer is the authorized game server.
        require(signer == gameServerSigner, "Invalid signature or unauthorized signer");

        // 5. Token Transfer
        // Transfer the specified amount of FLAPPY tokens from this contract to the player.
        flappyToken.transfer(_player, _amount);

        // 6. Update State
        claimedRewards[_player][_gameSessionId] = true; // Mark this session as claimed
        totalClaimed[_player] += _amount;              // Add to player's total claimed amount
        dailyClaims[_player][today]++;                 // Increment player's daily claim count

        // 7. Emit Event
        emit RewardClaimed(_player, _gameSessionId, _amount, _score, _multiplier);
    }

    // --- View Functions ---

    /**
     * @dev Returns the number of claims a user has made today (UTC).
     * @param _user The address of the user.
     * @return The number of claims made by the user for the current UTC day.
     */
    function getDailyClaims(address _user) public view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return dailyClaims[_user][today];
    }

    /**
     * @dev Returns the total amount of tokens claimed by a user across all sessions.
     * @param _user The address of the user.
     * @return The total amount of tokens claimed by the user.
     */
    function getTotalClaimed(address _user) public view returns (uint256) {
        return totalClaimed[_user];
    }

    /**
     * @dev Checks if a specific game session ID has already been claimed by a player.
     * @param _player The address of the player.
     * @param _gameSessionId The unique identifier for the game session.
     * @return True if the reward for this session has been claimed, false otherwise.
     */
    function isRewardClaimed(address _player, bytes32 _gameSessionId) public view returns (bool) {
        return claimedRewards[_player][_gameSessionId];
    }
}