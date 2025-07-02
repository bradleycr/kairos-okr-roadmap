'use client'

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
  Sparkles,
  Copy,
  LogOut
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface WalletSectionProps {
  className?: string
}

export function WalletSection({ className = "" }: WalletSectionProps) {
  const { address, isConnected, connector } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })
  const { connect, connectors, error: connectError, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

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

  const handleConnect = async (connectorToUse: any) => {
    try {
      connect({ connector: connectorToUse })
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "👋 Wallet Disconnected",
      description: "Your wallet has been safely disconnected"
    })
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

        {connectError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {connectError.message}
            </AlertDescription>
          </Alert>
        )}

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
      </CardContent>
    </Card>
  )
} 