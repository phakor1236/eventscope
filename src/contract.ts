import { parseAbi } from "viem";

// PriceDuel on Sepolia (FlipSide). Deployed 2026-07-07.
export const PRICE_DUEL_ADDRESS = "0x769d821592cd0991ff243e3e4741413cb39db7af" as const;
export const DEPLOY_BLOCK = 11_223_091n;

// The six events PriceDuel emits. `Direction` enum encodes as uint8 in the ABI.
export const PRICE_DUEL_EVENTS = parseAbi([
  "event DuelCreated(uint256 indexed id, address indexed creator, uint8 dir, uint256 stake, uint256 duration)",
  "event DuelJoined(uint256 indexed id, address indexed opponent, uint256 startPrice, uint256 endTime)",
  "event DuelResolved(uint256 indexed id, address indexed winner, uint256 startPrice, uint256 endPrice)",
  "event DuelCancelled(uint256 indexed id, address indexed creator, uint256 stake)",
  "event PotClaimed(uint256 indexed id, address indexed winner, uint256 amount)",
  "event RefundClaimed(uint256 indexed id, address indexed party, uint256 amount)",
]);
