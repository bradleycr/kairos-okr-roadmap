# Wallet Integration Setup

## Overview

KairOS now includes modern Web3 wallet integration using wagmi v2, supporting multiple wallet types including MetaMask, WalletConnect, Coinbase Wallet, and other injected wallets.

## Features

- **Modern wagmi v2 integration** - Latest Web3 React hooks
- **Multiple wallet support** - MetaMask, WalletConnect, Coinbase Wallet, and more
- **Clean UI** - Modern wallet connection interface with proper error handling
- **Cross-platform** - Works on desktop and mobile
- **ENS support** - Shows ENS names and avatars when available
- **Multi-chain** - Supports Ethereum, Polygon, Optimism, Arbitrum, and Base

## Setup

### 1. WalletConnect Project ID (Optional)

For WalletConnect functionality, you'll need a project ID:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your project ID
4. Add to your environment variables:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

If you don't set this, the app will use a demo project ID with limited functionality.

### 2. Supported Wallets

- **MetaMask** - Browser extension and mobile app
- **WalletConnect** - 300+ wallets via QR code scanning
- **Coinbase Wallet** - Self-custody wallet with DeFi browser
- **Injected Wallets** - Brave Wallet, Trust Wallet, hardware wallets, etc.

## Usage

1. Navigate to `/profile`
2. Click on the "Wallet" tab
3. Choose your preferred wallet connection method
4. Follow the prompts to connect

## Technical Details

- Uses wagmi v2 with React Query for state management
- Client-side only (no SSR issues)
- Proper error handling and loading states
- ENS resolution for addresses
- Multi-chain support with automatic network switching

## Troubleshooting

- Make sure you have a compatible wallet installed
- For mobile, use WalletConnect QR code scanning
- Check browser console for detailed error messages
- Ensure your wallet is unlocked and on a supported network 