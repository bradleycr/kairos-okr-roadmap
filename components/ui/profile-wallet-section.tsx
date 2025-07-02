'use client'

/**
 * 🎯 Profile Wallet Section
 * 
 * Modular wallet integration component with Web3 standards
 * Handles wallet connections, account abstraction, and gasless transactions
 */

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Shield,
  Copy,
  LogOut,
  Sparkles
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ProfileWalletSectionProps {
  className?: string
}

export function ProfileWalletSection({ className = "" }: ProfileWalletSectionProps) {
  const { address, isConnected, connector } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })
  const { connect, connectors, error: connectError, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  
  const [isAccountAbstractionEnabled, setIsAccountAbstractionEnabled] = useState(false)
  const [gaslessTransactionsAvailable, setGaslessTransactionsAvailable] = useState(false)

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Copy address to clipboard
  const copyAddress = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "✅ Copied!",
        description: `${label} copied to clipboard`
      })
    } catch (err) {
      toast({
        title: "❌ Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      })
    }
  }

  // Handle wallet connection
  const handleConnect = async (connectorToUse: any) => {
    try {
      connect({ connector: connectorToUse })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast({
        title: "❌ Connection Failed",
        description: "Could not connect wallet. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "👋 Wallet Disconnected",
      description: "Your wallet has been safely disconnected"
    })
  }

  // Placeholder for Account Abstraction setup
  const handleEnableAccountAbstraction = async () => {
    toast({
      title: "🚧 Coming Soon",
      description: "Account Abstraction features are in development",
    })
    // TODO: Implement Account Abstraction setup
    setIsAccountAbstractionEnabled(true)
  }

  // Placeholder for gasless transaction setup
  const handleEnableGaslessTransactions = async () => {
    toast({
      title: "🚧 Coming Soon", 
      description: "Gasless transactions are in development"
    })
    // TODO: Implement gasless transaction setup
    setGaslessTransactionsAvailable(true)
  }

  if (isConnected && address) {
    return (
      <Card className={`border-primary/20 shadow-lift ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Web3 Wallet</CardTitle>
            </div>
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          <CardDescription>
            Your wallet is connected and ready for Web3 interactions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={ensAvatar || undefined} alt={ensName || address} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {ensName?.slice(0, 2).toUpperCase() || address.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {ensName || formatAddress(address)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAddress(address, "Wallet address")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{formatAddress(address)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              
              {connector && (
                <p className="text-xs text-muted-foreground">
                  Connected via {connector.name}
                </p>
              )}
            </div>
          </div>

          {/* Web3 Features */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Web3 Features</h4>
            
            {/* Account Abstraction */}
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Account Abstraction</p>
                  <p className="text-xs text-muted-foreground">
                    Enable smart account features and gasless transactions
                  </p>
                </div>
              </div>
              
              {isAccountAbstractionEnabled ? (
                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                  Enabled
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAccountAbstraction}
                  className="text-xs"
                >
                  Enable
                </Button>
              )}
            </div>
            
            {/* Gasless Transactions */}
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Gasless Transactions</p>
                  <p className="text-xs text-muted-foreground">
                    Sponsored transactions without gas fees
                  </p>
                </div>
              </div>
              
              {gaslessTransactionsAvailable ? (
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                  Available
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableGaslessTransactions}
                  className="text-xs"
                >
                  Setup
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="flex-1 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on Etherscan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Not connected state
  return (
    <Card className={`border-primary/20 shadow-lift ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Web3 Wallet</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
            Not Connected
          </Badge>
        </div>
        <CardDescription>
          Connect your wallet to access Web3 features and DeFi interactions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection prompt */}
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            No Wallet Connected
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Connect your Web3 wallet to access DeFi features, NFTs, and blockchain interactions
          </p>
        </div>

        {/* Error display */}
        {connectError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {connectError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Choose Your Wallet</h4>
          
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full justify-start gap-3 h-12"
            >
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">{connector.name}</div>
                <div className="text-xs text-muted-foreground">
                  {connector.name === 'MetaMask' && 'Most popular Web3 wallet'}
                  {connector.name === 'Coinbase Wallet' && 'Self-custody with smart features'}
                  {connector.name === 'Injected' && 'Browser extension or mobile app'}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Web3 Benefits Preview */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3">What you'll get:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Multi-chain support (Ethereum, Polygon, Base, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>ENS name and avatar support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Account Abstraction features (coming soon)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Gasless transactions (coming soon)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader
export function ProfileWalletSectionSkeleton() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted animate-pulse rounded" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
} 