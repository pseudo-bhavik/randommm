# Flappy Arb - $FLAPPY Token Integration Guide

This project is a Farcaster Mini-App that includes a complete backend system for handling token claims through smart contracts on Arbitrum.

## Farcaster Mini-App Integration

The project is built as a Farcaster Mini-App that allows users to play the game and earn $FLAPPY tokens directly within the Farcaster ecosystem.

### Mini-App Features
- **Native Farcaster Integration**: Seamless wallet connection through Farcaster
- **Arbitrum-Only**: Optimized for Arbitrum blockchain only
- **Token Claiming**: Direct token claiming within the Mini-App
- **Social Sharing**: Easy sharing of game results to Farcaster

## Backend Architecture

### 1. Supabase Edge Function (`supabase/functions/sign-claim/index.ts`)
- **Purpose**: Signs claim requests with the game server's private key
- **Security**: Validates all inputs and uses secure signature generation
- **Environment Variables Required**:
  - `GAME_SERVER_PRIVATE_KEY`: The private key of the wallet that will sign claims

### 2. Smart Contract Integration
- **Contract ABI**: Defined in `src/contracts/FlappyArbDistributor.ts` 
- **Hooks**: Custom React hooks in `src/hooks/useContract.ts` for contract interactions
- **Service**: Claim service in `src/utils/claimService.ts` for backend communication

## Setup Instructions

### 1. Deploy Your Smart Contract
1. Deploy `FlappyArbDistributor.sol` to Arbitrum mainnet
2. Update the contract addresses in `src/contracts/FlappyArbDistributor.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     FLAPPY_ARB_DISTRIBUTOR: '0xYourDeployedContractAddress',
     FLAPPY_TOKEN: '0xYourFLAPPYTokenAddress',
   };
   ```

### 2. Configure Supabase Environment Variables
1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add the following environment variable:
   - `GAME_SERVER_PRIVATE_KEY`: The private key of the wallet address you set as `gameServerSigner` in your contract

**⚠️ Security Note**: Never commit private keys to version control. Always use environment variables.

### 3. Deploy the Edge Function
The Edge Functions will be automatically deployed when you connect to Supabase. Make sure your Supabase project is properly configured.

**Edge Functions included:**
- `sign-claim`: Signs token claim requests
- `flappy-frame`: Handles Farcaster Frame interactions

### 4. Update Frontend Configuration
1. Ensure your `.env` file has the correct Supabase configuration:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## How It Works

### Token Claiming Flow
1. **Game Completion**: Player finishes a game with a score and multiplier
2. **Signature Request**: Frontend calls the `sign-claim` Edge Function with game data
3. **Backend Validation**: Edge Function validates the request and signs it with the game server's private key
4. **Smart Contract Call**: Frontend uses the signature to call `claimReward` on the smart contract
5. **Token Transfer**: Smart contract validates the signature and transfers $FLAPPY tokens to the player

### Security Features
- **Signature Verification**: Only the designated game server can authorize token claims
- **Replay Protection**: Each game session has a unique ID to prevent double-claiming
- **Daily Limits**: Smart contract enforces daily claim limits per user
- **Amount Validation**: Min/max claim amounts are enforced
- **Pausable**: Contract owner can pause distributions if needed

### Farcaster Mini-App Flow
1. **Launch**: User opens the Mini-App from Farcaster
2. **Play**: Full game experience within the Mini-App
3. **Claim**: Direct token claiming with Farcaster wallet integration
4. **Share**: Easy sharing of results back to Farcaster feed
5. **Seamless UX**: All interactions happen within the Farcaster ecosystem
## Smart Contract Functions

### For Players
- `claimReward()`: Claim $FLAPPY tokens with a valid signature
- `getDailyClaims()`: Check how many claims made today
- `getTotalClaimed()`: Check total tokens claimed

### For Contract Owner
- `setGameServerSigner()`: Update the authorized signer address
- `setMaxClaimsPerDay()`: Update daily claim limits
- `setMinClaimAmount()` / `setMaxClaimAmount()`: Update claim amount limits
- `pause()` / `unpause()`: Emergency controls

## Testing

### Local Testing
1. Deploy contract to Arbitrum mainnet
2. Fund the contract with $FLAPPY tokens
3. Set up Supabase with production environment variables
4. Test the complete flow from game completion to token claiming

### Mini-App Testing
1. Test the Mini-App in Farcaster's development environment
2. Test wallet connection and transaction flow
3. Verify sharing functionality works correctly

### Production Deployment
1. Deploy contract to Arbitrum mainnet
2. Update contract addresses in the frontend
3. Configure production Supabase environment

## Monitoring

- **Transaction Hashes**: All successful claims return transaction hashes for tracking
- **Error Handling**: Comprehensive error messages for debugging
- **Event Logs**: Smart contract emits events for all claims
- **Daily Limits**: Built-in rate limiting prevents abuse

### Mini-App Analytics
- **App Launches**: Track how many users launch the Mini-App
- **Game Sessions**: Monitor game completion rates
- **Token Claims**: Track successful token claims through the Mini-App

## Security Considerations

1. **Private Key Management**: Store game server private key securely in Supabase secrets
2. **Signature Validation**: All claims must be signed by the authorized game server
3. **Replay Protection**: Unique game session IDs prevent double-spending
4. **Rate Limiting**: Daily claim limits prevent abuse
5. **Emergency Controls**: Contract can be paused if issues are detected

### Mini-App Security
1. **Wallet Integration**: Secure wallet connection through Farcaster's native system
2. **Transaction Security**: All transactions are validated and signed securely
3. **Data Validation**: All game data is validated before token claiming

## Support

For issues with:
- **Smart Contract**: Check Etherscan for transaction details
- **Backend**: Check Supabase Edge Function logs
- **Frontend**: Check browser console for errors
- **Farcaster Mini-App**: Check Farcaster developer tools and browser console