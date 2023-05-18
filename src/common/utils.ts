import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { TextEncoder, TextDecoder } from 'util'

export function isSolanaAddress(address: string, allowOffCurve = false): boolean {
  try {
    const solAddress = new PublicKey(address)
    if (allowOffCurve) {
      return true
    } else {
      return PublicKey.isOnCurve(solAddress.toBuffer())
    }
  } catch (err) {
    return false
  }
}

export const checkInvalidKeys = <T>(obj: T, keys: Array<keyof T>): Array<keyof T> => {
  const invalidKeys: Array<keyof T> = []
  Object.keys(obj).forEach((key) => {
    if (!keys.includes(key as keyof T)) {
      invalidKeys.push(key as keyof T)
    }
  })
  return invalidKeys
}

export function verifySolanaMessage(
  messageStr: string,
  signatureStr: string,
  publicKeyStr: string,
): boolean {
  const textEncoder = new TextEncoder()
  const textDecoder = new TextDecoder()

  const messageString = messageStr
  const signatureString = signatureStr

  // Convert to Uint8Arrays
  const message = textEncoder.encode(messageString)
  const sigFromBase58 = bs58.decode(signatureString)
  const publicKey = new PublicKey(publicKeyStr).toBuffer()
  console.log('publicKey', publicKeyStr, messageStr, signatureStr)
  // Verify the signature
  const isValid = nacl.sign.detached.verify(message, sigFromBase58, publicKey)
  return isValid
}
