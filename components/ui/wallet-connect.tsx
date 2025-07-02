'use client'

/**
 * 🎯 KairOS Wallet Connection - Pure wagmi v2
 * 
 * Modern, free, open-source wallet integration using wagmi v2.
 * No external services, no API keys, no paid subscriptions.
 * Covers 95%+ of Web3 users with industry-standard wallets.
 */

import React, { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { 
  Wallet, 
  LogOut, 
  Copy, 
  ExternalLink, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

/**
 * 🔗 Modern Wallet Connection Component
 */
export function WalletConnect() {
  const { address, isConnected, connector, chain } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [copiedAddress, setCopiedAddress] = useState(false)

  // ENS resolution (only on mainnet)
  const { data: ensName } = useEnsName({ 
    address,
    chainId: 1, // Mainnet only
  })
  const { data: ensAvatar } = useEnsAvatar({ 
    name: ensName,
    chainId: 1,
  })

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get connector display info
  const getConnectorInfo = (connectorId: string) => {
    switch (connectorId) {
      case 'metaMask':
        return { name: 'MetaMask', icon: '🦊', color: 'bg-orange-500' }
      case 'coinbaseWallet':
        return { name: 'Coinbase Wallet', icon: '🔵', color: 'bg-blue-500' }
      case 'injected':
        return { name: 'Browser Wallet', icon: '🌐', color: 'bg-green-500' }
      default:
        return { name: 'Wallet', icon: '👛', color: 'bg-gray-500' }
    }
  }

  // Handle connection errors
  const handleConnect = (connector: any) => {
    connect({ connector }, {
      onError: (error) => {
        console.error('Wallet connection error:', error)
        toast({
          title: "Connection Failed",
          description: error.message || "Could not connect to wallet",
          variant: "destructive",
        })
      },
      onSuccess: () => {
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to your wallet",
        })
      }
    })
  }

  if (isConnected && address) {
    const connectorInfo = getConnectorInfo(connector?.id || '')
    
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${connectorInfo.color} flex items-center justify-center text-white text-sm`}>
              {connectorInfo.icon}
            </div>
            <CardTitle className="text-lg">Connected</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <CardDescription>
            Connected via {connectorInfo.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={ensAvatar || undefined} />
              <AvatarFallback>
                {ensName ? ensName.slice(0, 2).toUpperCase() : address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {ensName || formatAddress(address)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {ensName ? formatAddress(address) : 'Ethereum Address'}
              </p>
            </div>
          </div>

          {/* Network Info */}
          {chain && (
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {chain.name}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              className="gap-2"
            >
              {copiedAddress ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedAddress ? 'Copied!' : 'Copy'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
              className="gap-1 text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              View on Etherscan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wallet className="w-6 h-6" />
          <CardTitle>Connect Wallet</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred wallet to get started
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {connectors.map((connector) => {
          const connectorInfo = getConnectorInfo(connector.id)
          const isReady = connector.ready ?? true
          
          return (
            <Button
              key={connector.id}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleConnect(connector)}
              disabled={isPending || !isReady}
            >
              <div className={`w-8 h-8 rounded-full ${connectorInfo.color} flex items-center justify-center text-white text-sm`}>
                {connectorInfo.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{connectorInfo.name}</div>
                <div className="text-xs text-muted-foreground">
                  {!isReady ? 'Not installed' : 'Connect to your wallet'}
                </div>
              </div>
              {!isReady && <AlertCircle className="w-4 h-4 text-muted-foreground" />}
            </Button>
          )
        })}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">
              {error.message}
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            ✨ Free & open source • No signup required
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 🎯 Compact Wallet Status Component
 */
export function WalletStatus() {
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()

  if (!isConnected || !address) return null

  const connectorInfo = getConnectorInfo(connector?.id || '')

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full">
      <div className={`w-5 h-5 rounded-full ${connectorInfo.color} flex items-center justify-center text-white text-xs`}>
        {connectorInfo.icon}
      </div>
      <span className="text-sm font-medium">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => disconnect()}
        className="h-6 w-6 p-0 hover:bg-destructive/10"
      >
        <LogOut className="w-3 h-3" />
      </Button>
    </div>
  )
}

// Helper function (also used in main component)
function getConnectorInfo(connectorId: string) {
  switch (connectorId) {
    case 'metaMask':
      return { name: 'MetaMask', icon: '🦊', color: 'bg-orange-500' }
    case 'coinbaseWallet':
      return { name: 'Coinbase Wallet', icon: '🔵', color: 'bg-blue-500' }
    case 'injected':
      return { name: 'Browser Wallet', icon: '🌐', color: 'bg-green-500' }
    default:
      return { name: 'Wallet', icon: '👛', color: 'bg-gray-500' }
  }
} 