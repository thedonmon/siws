import { Keypair } from "@solana/web3.js";
import { BlockchainType, MessageFactory, SiwsMessage, SolanaMessageParams, SolanaVerifyParams } from "../index";
import nacl from 'tweetnacl'
import bs58 from 'bs58'

describe("Testing message factory", () => {
  test("solana message", () => {
    const keypair = Keypair.generate();
    const solanaParams: SolanaMessageParams = {
        domain: "solana.com",
        address: keypair.publicKey.toBase58(),
        statement: "This is a test message.",
        uri: "https://solana.com",
        version: "1",
        chainId: -1,
        nonce: "abcdefghiJs23232Hsp",
        issuedAt: new Date().toISOString()
    }
    const message = MessageFactory.createMessage(solanaParams, BlockchainType.SOL)
    expect(message).toBeDefined()
  }),
  test("solana message sign", async () => {
    const keypair = Keypair.generate();
    const solanaParams: SolanaMessageParams = {
        domain: "solana.com",
        address: keypair.publicKey.toBase58(),
        statement: "This is a test message.",
        uri: "https://solana.com",
        version: "1",
        chainId: -1,
        nonce: "abcdefghiJs23232Hsp",
        issuedAt: new Date().toISOString()
    }
    const message = MessageFactory.createMessage(solanaParams, BlockchainType.SOL) as SiwsMessage;
    const messageToSign = message.prepareMessage();
    const encoder = new TextEncoder();
    const messageUint8 = encoder.encode(messageToSign);
    const signature = nacl.sign.detached(messageUint8, keypair.secretKey);
    const solanaVerifyParams: SolanaVerifyParams = {
        signature: bs58.encode(signature),
        nonce: solanaParams.nonce,
        message: message,
    }
    const verifyResult = await message.verify(solanaVerifyParams)
    expect(message).toBeDefined()
  })
})