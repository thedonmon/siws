
import { SiweMessage, VerifyParams, VerifyOpts, SiweResponse } from 'siwe'
import { BlockchainMessage } from '../common/BlockchainMessage'

export class SiweMessageWrapper implements BlockchainMessage {
  private siweMessage: SiweMessage

  constructor(params: string | Partial<SiweMessage>) {
    this.siweMessage = new SiweMessage(params)
  }

  get domain(): string {
    return this.siweMessage.domain
  }

  get address(): string {
    return this.siweMessage.address
  }

  get expirationTime(): string {
    return this.siweMessage.expirationTime
  }
  get nonce(): string {
    return this.siweMessage.nonce
  }
  get chainId(): number {
    return this.siweMessage.chainId
  }
  get issuedAt(): string {
    return this.siweMessage.issuedAt
  }
  get notBefore(): string {
    return this.siweMessage.notBefore
  }
  get requestId(): string {
    return this.siweMessage.requestId
  }
  get resources(): string[] {
    return this.siweMessage.resources
  }
  get uri(): string {
    return this.siweMessage.uri
  }
  get version(): string {
    return this.siweMessage.version
  }

  toMessage(): string {
    return this.siweMessage.toMessage()
  }

  prepareMessage(): string {
    return this.siweMessage.prepareMessage()
  }

  validate(signature: string, provider?: any): Promise<SiweMessageWrapper> {
    // validate method should return Promise<SiweMessageWrapper> according to BlockchainMessage interface,
    // but SiweMessage's validate method returns Promise<SiweMessage>. To satisfy this,
    // wrap SiweMessage in SiweMessageWrapper after validation.

    return this.siweMessage.validate(signature, provider).then(() => this)
  }

  verify(params: VerifyParams, opts?: VerifyOpts): Promise<SiweResponse> {
    return this.siweMessage.verify(params, opts)
  }
}
