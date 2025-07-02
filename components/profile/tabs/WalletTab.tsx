"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Smartphone,
  Monitor,
  Zap
} from "lucide-react";
import { useProfile } from '../ProfileProvider';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

export const WalletTab: React.FC = () => {
  const { profile, wallet } = useProfile();
  const { handleCopyKey, copySuccess } = profile;
  const { 
    address, 
    isConnected, 
    ensName, 
    ensAvatar, 
    connector, 
    connect, 
    disconnect 
  } = wallet;

  const connectWallet = async (connectorType: string) => {
    try {
      let targetConnector;
      
      // Map connector types to actual available connectors - this would need the connectors array
      switch (connectorType.toLowerCase()) {
        case 'metamask':
          targetConnector = metaMask();
          break;
        case 'coinbase':
          targetConnector = coinbaseWallet({ appName: 'KairOS' });
          break;
        case 'injected':
          targetConnector = injected();
          break;
        default:
          targetConnector = injected();
      }
      
      if (targetConnector) {
        console.log(`Connecting to ${targetConnector.name}...`);
        connect({ connector: targetConnector });
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Provider not found')) {
          alert('Wallet not detected. Please install a Web3 wallet like MetaMask, Trust Wallet, or Coinbase Wallet.');
        } else {
          alert(`Connection failed: ${error.message}`);
        }
      }
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Web3 Wallet
          </h2>
          <p className="text-muted-foreground">
            Connect your wallet to access Web3 features
          </p>
        </div>
        <Badge variant="outline" className="border-primary/50 text-primary">
          Modern Integration
        </Badge>
      </div>

      {isConnected ? (
        // Connected State
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {ensAvatar && (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={ensAvatar} alt="ENS Avatar" />
                      <AvatarFallback>
                        <Wallet className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-200">
                        Wallet Connected
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {connector?.name} • {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </p>
                    {ensName && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {address}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Copy Success Alert */}
          {copySuccess && (
            <Alert className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {copySuccess}
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-950/30">
                    <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">View on Explorer</h4>
                    <p className="text-sm text-muted-foreground">Check transactions</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                >
                  Open Etherscan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-950/30">
                    <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Copy Address</h4>
                    <p className="text-sm text-muted-foreground">Share your address</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleCopyKey(address || '', 'Address')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Address
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Web3 Features */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Web3 Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-muted">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    ENS Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {ensName ? `Your ENS: ${ensName}` : 'No ENS name detected'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-muted">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Account Abstraction
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Coming soon - gasless transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Disconnected State - Connection Options
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground">
                  Choose your preferred wallet to get started with Web3 features
                </p>
              </div>

              <div className="space-y-3">
                {/* Desktop Wallets */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop Wallets
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => connectWallet('metamask')}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto p-4"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        🦊
                      </div>
                      <div className="text-left">
                        <div className="font-medium">MetaMask</div>
                        <div className="text-sm text-muted-foreground">Most popular</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => connectWallet('coinbase')}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto p-4"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        🔵
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Coinbase Wallet</div>
                        <div className="text-sm text-muted-foreground">Easy to use</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Mobile Wallets */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile Wallets
                  </h4>
                  <Button
                    onClick={() => connectWallet('injected')}
                    variant="outline"
                    className="w-full flex items-center justify-start gap-3 h-auto p-4"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      📱
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Mobile Wallet</div>
                      <div className="text-sm text-muted-foreground">
                        Trust Wallet, Rainbow, or other mobile wallets
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No Wallet Detected */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>New to Web3?</strong> You'll need a cryptocurrency wallet to get started.{' '}
              <a 
                href="https://metamask.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn how to get one
              </a>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </motion.div>
  );
}; 