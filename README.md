# siw-any-chain

siw-any-chain is a flexible package that provides a unified interface for signing and verifying messages across different blockchain platforms. It supports Sign-In With Ethereum (SIWE) and Sign-In With Solana (SIWS) implementations out of the box, and it can be easily extended to support additional blockchain platforms.

## Features

- **Sign-In With Ethereum (SIWE)**: Provides the ability to create, sign, and verify Ethereum-based messages using the SIWE standard.
- **Sign-In With Solana (SIWS)**: Offers support for creating, signing, and verifying messages specific to the Solana blockchain using the SIWS standard.
- **Flexible Architecture**: Designed to be extensible, allowing easy integration of new blockchain platforms by implementing the provided `BlockchainMessage` interface.
- **TypeScript Support**: Written in TypeScript and includes type declarations for seamless integration with TypeScript projects.
- **Easy-to-Use API**: Provides a simple and intuitive API for creating, signing, and verifying messages across different blockchain platforms.

## Installation

Install the package using npm:

`npm install siw-any-chain`

Or with yarn:

`yarn add siw-any-chain`


## Usage

```typescript
import { MessageFactory, BlockchainType } from 'siw-any-chain';

// Create a SIWE message
const siweMessage = MessageFactory.createMessage(siweParams, BlockchainType.EVM);

// Create a SIWS message
const siwsMessage = MessageFactory.createMessage(siwsParams, BlockchainType.SOL);

// Sign and verify the messages
const signature = ...; // Get the signature
const verified = await siweMessage.verify(signature);
```

## Contributing
Contributions are welcome! If you have any ideas, bug fixes, or feature suggestions, please open an issue or submit a pull request on the GitHub repository.

## License
This project is licensed under the MIT License. See the LICENSE file for details.


# siws
