import { PublicKey } from '@solana/web3.js';

export function isValidPublicKey(publicKey: string) {
  try {
    new PublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}
