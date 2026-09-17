import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePublicId(): string {
  const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) array[i] = Math.floor(Math.random() * 256);
  }
  
  let num = BigInt(0);
  for (let i = 0; i < 6; i++) {
    num = (num << BigInt(8)) | BigInt(array[i]);
  }

  let result = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(32));
    result = CROCKFORD_ALPHABET[remainder] + result;
    num = num / BigInt(32);
  }
  
  return `PX-${result.padStart(8, '0')}`;
}
