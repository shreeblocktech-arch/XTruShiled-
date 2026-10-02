// Real BIP-39 12-word mnemonic generation + validation, offline, in pure JS.
// Entropy comes from expo-crypto's CSPRNG; the checksum uses our SHA-256.
import * as Crypto from "expo-crypto";

import { sha256Bytes } from "./sha256";
import { WORDLIST } from "./wordlist";

function bytesToBits(bytes: Uint8Array): string {
  let bits = "";
  for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, "0");
  return bits;
}

export function entropyToMnemonic(entropy: Uint8Array): string {
  const entBits = bytesToBits(entropy);
  const csLen = (entropy.length * 8) / 32; // 4 bits for 128-bit entropy
  const hash = sha256Bytes(entropy);
  const csBits = bytesToBits(hash).slice(0, csLen);
  const bits = entBits + csBits;
  const words: string[] = [];
  for (let i = 0; i < bits.length; i += 11) {
    const idx = parseInt(bits.slice(i, i + 11), 2);
    words.push(WORDLIST[idx]);
  }
  return words.join(" ");
}

export async function generateMnemonic(): Promise<string> {
  const entropy = await Crypto.getRandomBytesAsync(16); // 128-bit -> 12 words
  return entropyToMnemonic(Uint8Array.from(entropy));
}

export function validateMnemonic(phrase: string): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12) return false;
  const indexes: number[] = [];
  for (const w of words) {
    const idx = WORDLIST.indexOf(w);
    if (idx === -1) return false;
    indexes.push(idx);
  }
  let bits = "";
  for (const idx of indexes) bits += idx.toString(2).padStart(11, "0");
  const csLen = bits.length % 32 === 0 ? 0 : bits.length - Math.floor(bits.length / 33) * 32;
  const entBitsLen = bits.length - bits.length / 33;
  const entBits = bits.slice(0, entBitsLen);
  const csBits = bits.slice(entBitsLen);
  const entropy = new Uint8Array(entBits.length / 8);
  for (let i = 0; i < entropy.length; i++) entropy[i] = parseInt(entBits.slice(i * 8, i * 8 + 8), 2);
  const hash = sha256Bytes(entropy);
  let hashBits = "";
  for (let i = 0; i < hash.length; i++) hashBits += hash[i].toString(2).padStart(8, "0");
  return hashBits.slice(0, csBits.length) === csBits;
}
