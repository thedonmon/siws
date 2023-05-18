import {
  BlockchainMessage,
  BlockchainVerifyOpts,
  BlockchainVerifyParams,
  BlockchainVerifyParamsKeys,
  SiwsResponse,
  BlockchainVerifyOptsKeys,
  SolanaVerifyOpts,
} from '../common/BlockchainMessage'
import { MessageParams } from '../common/BlockchainMessage'

import { checkInvalidKeys, generateNonce, isValidISO8601Date } from 'siwe'
import { BlockchainError as BlockchainMessageError, SiwsError, SiwsErrorType } from '../errors/errors'
import * as URLJS from 'uri-js'
import { isSolanaAddress, verifySolanaMessage } from '../common/utils'


export interface SolanaMessageParams extends MessageParams {
    allowOffCurve?: boolean
}

export class SiwsMessage implements BlockchainMessage {
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
  allowOffCurve?: boolean

  constructor(params: SolanaMessageParams) {
    Object.assign(this, params)
  }

  toMessage(): string {
    /** Validates all fields of the object */
    this.validateMessage()

    const header = `${this.domain} wants you to sign in with your Solana account:`
    const uriField = `URI: ${this.uri}`
    let prefix = [header, this.address].join('\n')
    const versionField = `Version: ${this.version}`

    if (!this.nonce) {
      this.nonce = generateNonce()
    }

    const chainField = `Chain ID: ` + this.chainId || '1'

    const nonceField = `Nonce: ${this.nonce}`

    const suffixArray = [uriField, versionField, chainField, nonceField]

    this.issuedAt = this.issuedAt || new Date().toISOString()

    suffixArray.push(`Issued At: ${this.issuedAt}`)

    if (this.expirationTime) {
      const expiryField = `Expiration Time: ${this.expirationTime}`

      suffixArray.push(expiryField)
    }

    if (this.notBefore) {
      suffixArray.push(`Not Before: ${this.notBefore}`)
    }

    if (this.requestId) {
      suffixArray.push(`Request ID: ${this.requestId}`)
    }

    if (this.resources) {
      suffixArray.push([`Resources:`, ...this.resources.map((x) => `- ${x}`)].join('\n'))
    }

    const suffix = suffixArray.join('\n')
    prefix = [prefix, this.statement].join('\n\n')
    if (this.statement) {
      prefix += '\n'
    }
    return [prefix, suffix].join('\n')
  }
  prepareMessage(): string {
    let message: string
    switch (this.version) {
      case '1': {
        message = this.toMessage()
        break
      }

      default: {
        message = this.toMessage()
        break
      }
    }
    return message
  }

  validate(signature: string, provider?: any): Promise<BlockchainMessage> {
    throw new Error('Method not implemented.')
  }
  verify(params: any, opts?: any): Promise<any> {
    const solanaParams = params as BlockchainVerifyParams<this>
    const solanaOpts = opts as BlockchainVerifyOpts<this, SiwsResponse>
    return new Promise<SiwsResponse>((resolve, reject) => {
      const fail = (result) => {
        if (solanaOpts.suppressExceptions) {
          return resolve(result)
        } else {
          return reject(result)
        }
      }

      const invalidParams: Array<keyof BlockchainVerifyParams<this>> = checkInvalidKeys<
        BlockchainVerifyParams<this>
      >(solanaParams, BlockchainVerifyParamsKeys)
      if (invalidParams.length > 0) {
        fail({
          success: false,
          data: this,
          error: new Error(`${invalidParams.join(', ')} is/are not valid key(s) for VerifyParams.`),
        })
      }

      if (opts) {
        const invalidOpts: Array<keyof SolanaVerifyOpts> = checkInvalidKeys<
        SolanaVerifyOpts
        >(solanaOpts, BlockchainVerifyOptsKeys())
        if (invalidParams.length > 0) {
          fail({
            success: false,
            data: this,
            error: new Error(`${invalidOpts.join(', ')} is/are not valid key(s) for VerifyOpts.`),
          })
        }
      }
      

      const { signature, domain, nonce, time } = solanaParams

      /** Domain binding */
      if (domain && domain !== this.domain) {
        fail({
          success: false,
          data: this,
          error: new SiwsError(SiwsErrorType.DOMAIN_MISMATCH, domain, this.domain),
        })
      }

      /** Nonce binding */
      if (nonce && nonce !== this.nonce) {
        fail({
          success: false,
          data: this,
          error: new SiwsError(SiwsErrorType.NONCE_MISMATCH, nonce, this.nonce),
        })
      }

      /** Check time or now */
      const checkTime = new Date(time || new Date())

      /** Message not expired */
      if (this.expirationTime) {
        const expirationDate = new Date(this.expirationTime)
        if (checkTime.getTime() >= expirationDate.getTime()) {
          fail({
            success: false,
            data: this,
            error: new SiwsError(
              SiwsErrorType.EXPIRED_MESSAGE,
              `${checkTime.toISOString()} < ${expirationDate.toISOString()}`,
              `${checkTime.toISOString()} >= ${expirationDate.toISOString()}`,
            ),
          })
        }
      }

      /** Message is valid already */
      if (this.notBefore) {
        const notBefore = new Date(this.notBefore)
        if (checkTime.getTime() < notBefore.getTime()) {
          fail({
            success: false,
            data: this,
            error: new SiwsError(
              SiwsErrorType.NOT_YET_VALID_MESSAGE,
              `${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
              `${checkTime.toISOString()} < ${notBefore.toISOString()}`,
            ),
          })
        }
      }
      let EIP4361Message
      try {
        EIP4361Message = this.prepareMessage()
      } catch (e) {
        fail({
          success: false,
          data: this,
          error: e,
        })
      }

      /** Recover address from signature */
      let isValid = false
      try {
        isValid = verifySolanaMessage(EIP4361Message, signature, this.address)
      } catch (e) {
        console.error(e)
      }
      /** Match signature with message's address */
      if (isValid) {
        return resolve({
          success: true,
          data: this,
        })
      }
    })
  }
  /**
   * Validates the values of this object fields.
   * @throws Throws an {ErrorType} if a field is invalid.
   */
  validateMessage(...args) {
    /** Checks if the user might be using the function to verify instead of validate. */
    if (args.length > 0) {
      throw new BlockchainMessageError(
        SiwsErrorType.UNABLE_TO_PARSE,
        `Unexpected argument in the validateMessage function.`,
      )
    }

    /** `domain` check. */
    if (!this.domain || this.domain.length === 0 || !/[^#?]*/.test(this.domain)) {
      throw new BlockchainMessageError(
        SiwsErrorType.INVALID_DOMAIN,
        `${this.domain} to be a valid domain.`,
      )
    }

    /** EIP-55 `address` check. */
    if (!isSolanaAddress(this.address, this.allowOffCurve)) {
      throw new BlockchainMessageError(`${SiwsErrorType.INVALID_ADDRESS} allow off curve address: ${this.allowOffCurve}`, this.address, this.address)
    }

    /** Check if the URI is valid. */
    const parsedUri = URLJS.parse(this.uri)
    if (!(parsedUri.scheme && parsedUri.host)) {
      throw new BlockchainMessageError(SiwsErrorType.INVALID_URI, `${this.uri} to be a valid uri.`)
    }

    /** Check if the version is 1. */
    if (this.version !== '1') {
      throw new BlockchainMessageError(SiwsErrorType.INVALID_MESSAGE_VERSION, '1', this.version)
    }

    /** Check if the nonce is alphanumeric and bigger then 8 characters */
    const nonce = this?.nonce?.match(/[a-zA-Z0-9]{8,}/)
    if (!nonce || this.nonce.length < 8 || nonce[0] !== this.nonce) {
      throw new BlockchainMessageError(
        SiwsErrorType.INVALID_NONCE,
        `Length > 8 (${nonce.length}). Alphanumeric.`,
        this.nonce,
      )
    }

    /** `issuedAt` conforms to ISO-8601 and is a valid date. */
    if (this.issuedAt) {
      if (!isValidISO8601Date(this.issuedAt)) {
        throw new Error(SiwsErrorType.INVALID_TIME_FORMAT)
      }
    }

    /** `expirationTime` conforms to ISO-8601 and is a valid date. */
    if (this.expirationTime) {
      if (!isValidISO8601Date(this.expirationTime)) {
        throw new Error(SiwsErrorType.INVALID_TIME_FORMAT)
      }
    }

    /** `notBefore` conforms to ISO-8601 and is a valid date. */
    if (this.notBefore) {
      if (!isValidISO8601Date(this.notBefore)) {
        throw new Error(SiwsErrorType.INVALID_TIME_FORMAT)
      }
    }
  }
}
