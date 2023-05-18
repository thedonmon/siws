import { SiwsMessage } from '../sol/SiwsMessage'
import { SiwsError } from '../errors/errors'
import { SiweResponse, SiweMessage } from 'siwe'
import { SiweMessageWrapper } from '../evm/SiweMessageWrapper'

export interface BlockchainMessage {
  domain: string
  address: string
  statement?: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt?: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]

  toMessage(): string
  prepareMessage(): string
  validate(signature: string, provider?: any): Promise<BlockchainMessage>
  verify(params: any, opts?: any): Promise<any>
}

export const BlockchainVerifyParamsKeys: Array<keyof BlockchainVerifyParams<any>> = [
  'signature',
  'domain',
  'nonce',
  'time',
  'message',
]

export interface BlockchainVerifyParams<MessageType> {
  signature: string
  domain?: string
  nonce?: string
  time?: string
  message: MessageType
}

export function BlockchainVerifyOptsKeys<MessageType, ResponseType>(): Array<
  keyof BlockchainVerifyOpts<MessageType, ResponseType>
> {
  return ['provider', 'suppressExceptions', 'verificationFallback']
}
export interface BlockchainVerifyOpts<MessageType, ResponseType> {
  provider?: any // replace 'any' with a generic provider type if you have one
  suppressExceptions?: boolean
  verificationFallback?: (
    params: BlockchainVerifyParams<MessageType>,
    opts: BlockchainVerifyOpts<MessageType, ResponseType>,
    message: MessageType,
    EIP1271Promise?: Promise<ResponseType>,
  ) => Promise<ResponseType>
}

export interface BlockchainResponse<MessageType, ErrorType> {
  success: boolean
  error?: ErrorType
  data: MessageType
}

export type SolanaVerifyParams = BlockchainVerifyParams<SiwsMessage>
export type SolanaVerifyOpts = BlockchainVerifyOpts<SiwsMessage, SiwsResponse>
export type SiwsResponse = BlockchainResponse<SiwsMessage, SiwsError>

export type SiweVerifyParams = BlockchainVerifyParams<SiweMessage>
export type SiweVerifyOpts = BlockchainVerifyOpts<SiweMessage, SiweResponse>

export enum BlockchainType {
  SOL = 'sol',
  EVM = 'evm',
}

export interface MessageParams {
  domain: string
  address: string
  statement?: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt?: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
}

export class MessageFactory {
  static createMessage(params: MessageParams, type: BlockchainType): BlockchainMessage {
    switch (type) {
      case BlockchainType.SOL:
        return new SiwsMessage(params)
      case BlockchainType.EVM:
        return new SiweMessageWrapper(params)
      default:
        throw new Error(`Unsupported blockchain type: ${type}`)
    }
  }
}
