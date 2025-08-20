import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { FLAPPY_ARB_DISTRIBUTOR_ABI, CONTRACT_ADDRESSES } from '../contracts/FlappyArbDistributor';
import { keccak256, toBytes } from 'viem';

export interface ClaimRewardParams {
  playerAddress: `0x${string}`;
  amount: bigint;
  score: number;
  multiplier: number;
  gameSessionId: string;
  signature: `0x${string}`;
}

export const useFlappyArbContract = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const claimReward = async (params: ClaimRewardParams) => {
    // Convert gameSessionId to bytes32
    const gameSessionIdBytes32 = keccak256(toBytes(params.gameSessionId));
    
    return writeContract({
      address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
      abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
      functionName: 'claimReward',
      args: [
        params.playerAddress,
        params.amount,
        BigInt(params.score),
        BigInt(params.multiplier),
        gameSessionIdBytes32,
        params.signature,
      ],
    });
  };

  return {
    claimReward,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};

export const useContractReads = (playerAddress?: `0x${string}`) => {
  // Read daily claims for the player
  const { data: dailyClaims } = useReadContract({
    address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
    abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
    functionName: 'getDailyClaims',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  // Read total claimed by the player
  const { data: totalClaimed } = useReadContract({
    address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
    abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
    functionName: 'getTotalClaimed',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  // Read contract configuration
  const { data: maxClaimsPerDay } = useReadContract({
    address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
    abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
    functionName: 'maxClaimsPerDay',
  });

  const { data: minClaimAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
    abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
    functionName: 'minClaimAmount',
  });

  const { data: maxClaimAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.FLAPPY_ARB_DISTRIBUTOR as `0x${string}`,
    abi: FLAPPY_ARB_DISTRIBUTOR_ABI,
    functionName: 'maxClaimAmount',
  });

  return {
    dailyClaims: dailyClaims ? Number(dailyClaims) : 0,
    totalClaimed: totalClaimed ? Number(totalClaimed) : 0,
    maxClaimsPerDay: maxClaimsPerDay ? Number(maxClaimsPerDay) : 5,
    minClaimAmount: minClaimAmount ? Number(minClaimAmount) : 1,
    maxClaimAmount: maxClaimAmount ? Number(maxClaimAmount) : 1000000,
  };
};