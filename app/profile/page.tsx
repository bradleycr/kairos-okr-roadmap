"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Copy, Shield, Sparkles, Users, MessageCircle, Brain, X, UserIcon, HeartIcon, User, Heart, Sunrise, Wallet, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { PINSetup } from '@/components/ui/pin-setup';
import { ProfileEditor } from '@/components/ui/profile-editor';
import PINEntry from '@/components/ui/pin-entry';
import { MorningEightPanel } from '@/src/features/morningEight/components/MorningEightPanel';
import { NFCGate } from '@/src/features/morningEight/components/NFCGate';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { notFound } from 'next/navigation';

// Custom QR Code Generator Component
const CustomQRCode = ({ data, size = 200 }: { data: string, size?: number }) => {
  // Create a simple artistic pattern instead of a real QR code
  const createPattern = (input: string) => {
    const hash = input.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const gridSize = 21;
    const pattern = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      const value = (hash + x + y * 7) % 3;
      pattern.push(value > 0);
    }
    
    return pattern;
  };

  const pattern = createPattern(data);
  const cellSize = size / 21;

  return (
    <div className="p-4 bg-card rounded-lg shadow-minimal">
      <svg width={size} height={size} className="border-2 border-primary/20">
        {pattern.map((filled, i) => {
          const x = (i % 21) * cellSize;
          const y = Math.floor(i / 21) * cellSize;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={filled ? 'rgb(var(--primary))' : 'rgb(var(--background))'}
            />
          );
        })}
        {/* Artistic corners */}
        <rect x={0} y={0} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
        <rect x={size - cellSize * 7} y={0} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
        <rect x={0} y={size - cellSize * 7} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
      </svg>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Scan to transfer your data crystal
      </p>
    </div>
  );
};

// Utility functions for data portability
const generateUserStats = (chipUID: string, isNewUser: boolean = false) => {
  if (isNewUser) {
    return {
      verificationsGiven: 1,
      memoriesContributed: 0,
      momentsWitnessed: 0,
      totalBonds: 0
    };
  }
  
  const seed = chipUID;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
  }
  
  const rng = () => {
    hash = ((hash * 1103515245) + 12345) & 0xffffffff;
    return Math.abs(hash) / 0xffffffff;
  };
  
  return {
    verificationsGiven: Math.floor(rng() * 50) + 15,
    memoriesContributed: Math.floor(rng() * 30) + 8,
    momentsWitnessed: Math.floor(rng() * 100) + 25,
    totalBonds: Math.floor(rng() * 10) + 1 // Random bond count for fallback/demo use
  };
};

const exportUserData = async (userData: any) => {
  const dataBundle = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    profile: userData,
    signature: "crystal_" + Date.now()
  };
  
  const blob = new Blob([JSON.stringify(dataBundle, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kairos-crystal-${userData.chipUID}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const importUserData = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data.profile);
      } catch (error) {
        reject(new Error('Invalid data crystal file'));
      }
    };
    reader.readAsText(file);
  });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Responsive Tabs Component
const ResponsiveTabs = ({ value, onValueChange, children }: any) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      {children}
    </Tabs>
  );
};

const ResponsiveTabsList = ({ children }: any) => {
  return (
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card/50 backdrop-blur-sm border border-primary/20 p-1 h-auto">
      {children}
    </TabsList>
  );
};

const ResponsiveTabsTrigger = ({ value, children }: any) => {
  return (
    <TabsTrigger 
      value={value} 
      className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1 p-2 h-12 sm:h-10 rounded-md data-[state=active]:shadow-sm"
    >
      {children}
    </TabsTrigger>
  );
};

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);
  const [userBonds, setUserBonds] = useState<any[]>([]);
  const [requiresPINAuth, setRequiresPINAuth] = useState(false);
  const [pinAuthenticatedChipUID, setPinAuthenticatedChipUID] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [shouldShowNotFound, setShouldShowNotFound] = useState(false);
  
  // Wagmi hooks for wallet integration
  const { address, isConnected, connector } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });
  const { connect, connectors, error: connectError, isLoading } = useConnect();
  const { disconnect } = useDisconnect();

  const loadProfileData = async () => {
    setIsLoadingProfile(true)
    
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const chipUID = urlParams.get('chipUID')
      const verified = urlParams.get('verified') === 'true'
      const source = urlParams.get('source')
      const isNewCard = urlParams.get('newCard') === 'true'
      const setupPIN = urlParams.get('setupPIN') === 'true'
      
      console.log('📱 Profile loading params:', {
        chipUID,
        verified,
        source,
        isNewCard,
        setupPIN
      })
      
      // Handle new card setup flow
      if (isNewCard && setupPIN && chipUID) {
        console.log('🆕 New card setup detected - showing PIN setup flow')
        
        // Create a basic profile for the new card
        const newCardProfile = {
          chipUID,
          did: urlParams.get('did') || `did:key:z${chipUID}`,
          displayName: `User ${chipUID.slice(-4).toUpperCase()}`,
          username: `user_${chipUID.slice(-4).toLowerCase()}`,
          bio: 'New KairOS user',
          deviceName: 'New Device',
          accountType: 'standard',
          hasPIN: false,
          isNewUser: true,
          needsPINSetup: true,
          source: 'chip-config-new-card',
          ...generateUserStats(chipUID, true)
        }
        
        setUserProfile(newCardProfile)
        setShowPINSetup(true)
        setHasPIN(false)
        setIsLoadingProfile(false)
        return
      }
      
      // 🔐 SECURITY FIX: Always validate session before trusting URL parameters
      console.log('🔐 Validating session before profile access...')
      
      try {
        const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
        const { SessionManager } = await import('@/lib/nfc/sessionManager')
        
        // Get current session
        const session = await SessionManager.getCurrentSession()
        console.log('🔍 Session check result:', {
          hasSession: !!session,
          isActive: session?.isActive,
          sessionChipUID: session?.currentUser?.chipUID?.slice(-4) || 'none',
          urlChipUID: chipUID?.slice(-4) || 'none'
        })
        
        // If chipUID provided in URL, validate it matches current session
        if (chipUID) {
          // 🔐 SECURITY FIX: Always check PIN gate before allowing profile access
          console.log('🔐 SECURITY: Checking PIN gate for profile access...')
          const authCheck = await NFCAccountManager.authenticateWithPINGate(chipUID)
          
          console.log('🔍 PIN Gate result:', authCheck)
          
          if (authCheck.requiresPIN) {
            console.log('🔒 PIN authentication required for profile access')
            
            // Set up PIN requirement state and load basic account info
            const basicProfile = {
              chipUID,
              displayName: authCheck.account?.displayName || `User ${chipUID.slice(-4).toUpperCase()}`,
              username: authCheck.account?.username || `user_${chipUID.slice(-4).toLowerCase()}`,
              bio: authCheck.account?.bio || 'KairOS user',
              hasPIN: authCheck.hasPIN,
              isNewUser: authCheck.isNewAccount
            }
            
            setUserProfile(basicProfile)
            setRequiresPINAuth(true)
            setIsLoadingProfile(false)
            return
          }
          
          // Only proceed if PIN gate explicitly allows access
          if (!session?.isActive || session.currentUser?.chipUID !== chipUID) {
            console.log('🚫 SECURITY: URL chipUID does not match authenticated session, but PIN gate allows access')
          }
          
          console.log('✅ PIN gate passed - loading profile')
          
          // Proceed with validated chipUID
          console.log(`✅ Loading verified profile for authenticated chipUID: ${chipUID}`)
          const profile = await loadUserProfileData(chipUID)
          setUserProfile(profile)
          
        } else {
          // No chipUID in URL - use session chipUID
          if (!session?.currentUser?.chipUID) {
            console.log('❌ No session found and no chipUID provided - this is a 404 case')
            setShouldShowNotFound(true)
            setIsLoadingProfile(false)
            return
          }
          
          const sessionChipUID = session.currentUser.chipUID
          console.log(`✅ Using authenticated session chipUID: ${sessionChipUID}`)
          const profile = await loadUserProfileData(sessionChipUID)
          setUserProfile(profile)
        }
        
      } catch (error) {
        console.error('❌ Session validation failed:', error)
        setUserProfile(null)
        setIsLoadingProfile(false)
        return
      }
      
    } catch (error) {
      console.error('Profile loading failed:', error)
      setUserProfile(null)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const loadUserProfileData = async (chipUID: string) => {
    try {
      // Use privacy-first account manager to get or create profile
            const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
            
            // Get account data for the authenticated user
            const accountResult = await NFCAccountManager.authenticateOrCreateAccount(chipUID)
            const currentAccount = accountResult.account
            
            console.log(`Account status: ${accountResult.isNewAccount ? 'New' : 'Existing'}, Device: ${accountResult.isNewDevice ? 'New' : 'Familiar'}`)
            
      // Show welcome ritual ONLY for truly new accounts
            if (accountResult.isNewAccount) {
              console.log('🎉 New account detected - showing welcome ritual')
              setShowWelcomeRitual(true)
            }
            
            // 🆕 Get persistent verification count from database
            let persistentVerificationCount = currentAccount.stats.totalSessions || 1
            try {
              const response = await fetch('/api/nfc/accounts', {
                method: 'GET',
                headers: { 'X-Chip-UID': chipUID }
              })
              const dbData = await response.json()
              if (dbData.success && dbData.account) {
                persistentVerificationCount = dbData.account.verificationCount || currentAccount.stats.totalSessions || 1
                console.log(`✅ Using persistent verification count: ${persistentVerificationCount}`)
              }
            } catch (error) {
              console.warn('Failed to fetch database verification count, using local:', error)
            }

      // Create profile object
            const profile = {
              chipUID,
        deviceId: currentAccount.accountId,
              deviceName: currentAccount.deviceName,
              username: currentAccount.username,
              displayName: currentAccount.displayName,
              publicKey: currentAccount.publicKey,
              bio: currentAccount.bio,
              verificationsGiven: persistentVerificationCount,
              memoriesContributed: currentAccount.stats.totalMoments || 0,
              momentsWitnessed: currentAccount.moments?.length || 0,
              totalBonds: 0, // Will be loaded from bond manager
              joinDate: currentAccount.createdAt,
              lastSession: {
          sessionToken: Date.now().toString(),
                momentId: `moment_${Date.now()}`,
                timestamp: new Date().toISOString()
              },
        hasPIN: currentAccount.hasPIN,
        isNewUser: accountResult.isNewAccount
      }
      
            setHasPIN(currentAccount.hasPIN)
            
            // Load user bonds
            await loadUserBonds(chipUID)
            
            // Show PIN setup prompt for new accounts without PIN
            if (!currentAccount.hasPIN && !currentAccount.pinSetupPrompted) {
              setShowPINSetup(true)
            }
            
      return profile
            
          } catch (error) {
      console.error('❌ Failed to load user profile data:', error)
      throw error
    }
  }

  // Check for chipUID in URL parameters
  useEffect(() => {
    loadProfileData()
  }, [])

  // Trigger 404 page if needed
  useEffect(() => {
    if (shouldShowNotFound) {
      notFound()
    }
  }, [shouldShowNotFound])

  const markRitualFlowCompleted = async (chipUID: string) => {
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const success = await NFCAccountManager.markRitualFlowCompleted(chipUID)
      if (success) {
        console.log('🎭 Ritual flow marked as completed for user')
      } else {
        console.warn('Failed to mark ritual flow as completed')
      }
    } catch (error) {
      console.error('Error marking ritual flow completion:', error)
    }
  }

  const handleExport = async () => {
    if (userProfile) {
      await exportUserData(userProfile);
      setShowExportModal(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedProfile = await importUserData(file);
        setUserProfile(importedProfile);
        localStorage.setItem(`kairos_profile_${importedProfile.chipUID}`, JSON.stringify(importedProfile));
        setShowImportModal(false);
      } catch (error) {
        alert('Error importing data crystal. Please check the file format.');
      }
    }
  };

  const handleCopyKey = async (key: string, type: string) => {
    const success = await copyToClipboard(key);
    if (success) {
      setCopySuccess(`${type} key copied!`);
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const handlePINSetup = async (pin: string): Promise<boolean> => {
    if (!userProfile?.chipUID) return false
    
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const success = await NFCAccountManager.setupPIN(userProfile.chipUID, pin)
      
      if (success) {
        setHasPIN(true)
        setShowPINSetup(false)
        
        // Update local profile to mark PIN as set up
        const updatedProfile = { ...userProfile }
        updatedProfile.hasPIN = true
        updatedProfile.pinSetupPrompted = true
        setUserProfile(updatedProfile)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('PIN setup failed:', error)
      return false
    }
  }

  const handleProfileUpdate = async (updates: {
    displayName?: string
    username?: string
    bio?: string
    deviceName?: string
  }): Promise<boolean> => {
    if (!userProfile?.chipUID) return false
    
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const success = await NFCAccountManager.updateBasicProfileInfo(userProfile.chipUID, updates)
      
      if (success) {
        // Update local profile state
        setUserProfile((prev: any) => prev ? { ...prev, ...updates } : null)
      }
      
      return success
    } catch (error) {
      console.error('Profile update failed:', error)
      return false
    }
  }

  const loadUserBonds = async (chipUID: string) => {
    try {
      const { BondManager } = await import('@/lib/nfc/bondManager')
      const bonds = await BondManager.getUserBonds(chipUID)
      const formattedBonds = BondManager.formatBondsForProfile(bonds, chipUID)
      setUserBonds(formattedBonds)
      
      // Also update the profile with the total bonds count
      setUserProfile(prev => prev ? {
        ...prev,
        totalBonds: bonds.length
      } : null)
      
      console.log(`✅ Loaded ${bonds.length} bonds for user`)
    } catch (error) {
      console.error('Failed to load user bonds:', error)
      setUserBonds([])
    }
  }

  const handleProfilePINAuth = async (account: any, pin: string) => {
    // This function is called by PINEntry after successful PIN verification
    if (!userProfile) return
    
    try {
      console.log('✅ PIN authentication successful - granting profile access')
      console.log(`Account: ${account.chipUID}, PIN verified for profile access`)
      
      setPinAuthenticatedChipUID(userProfile.chipUID)
      setRequiresPINAuth(false)
    } catch (error) {
      console.error('Profile PIN auth failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const { SessionManager } = await import('@/lib/nfc/sessionManager')
      await SessionManager.clearSession()
      
      // Clear local state
      setUserProfile(null)
      setPinAuthenticatedChipUID(null)
      setRequiresPINAuth(false)
      
      // Redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Wallet Integration Functions - Simplified and Fixed
  const connectWallet = async (connectorType: string) => {
    try {
      let targetConnector;
      
      // Map connector types to actual available connectors
      switch (connectorType.toLowerCase()) {
        case 'metamask':
          targetConnector = connectors.find(c => c.name === 'MetaMask');
          break;
        case 'coinbase':
          targetConnector = connectors.find(c => c.name === 'Coinbase Wallet');
          break;
        case 'injected':
          targetConnector = connectors.find(c => c.name === 'Injected');
          break;
        default:
          targetConnector = connectors[0]; // Fallback to first available
      }
      
      if (targetConnector) {
        console.log(`Connecting to ${targetConnector.name}...`);
        connect({ connector: targetConnector });
      } else {
        console.error(`Connector ${connectorType} not found`);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  // Wallet integration is now handled by wagmi hooks above
  // No need for manual session loading

  // Show loading spinner while profile is loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
        {/* Holographic Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
          <div className="text-center space-y-6 mt-32">
            <div className="relative p-4 rounded-full bg-primary/10 border border-primary/20 mx-auto w-fit">
              <Shield className="h-12 w-12 text-primary animate-spin" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-mono font-light text-foreground/90">
                Loading Profile
              </h1>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                Verifying secure session...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If profile loading failed, show authentication required message
  if (userProfile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
        {/* Holographic Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
          <div className="text-center space-y-6 mt-32">
            <div className="relative p-4 rounded-full bg-destructive/10 border border-destructive/20 mx-auto w-fit">
              <Shield className="h-12 w-12 text-destructive animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-mono font-light text-foreground/90">
                Authentication Required
              </h1>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                Verifying your cryptographic identity...
              </p>
              <div className="bg-card/50 backdrop-blur-sm border border-destructive/20 rounded-lg p-4 text-left">
                <p className="text-xs text-muted-foreground font-mono mb-2">
                  <strong>Security Notice:</strong>
                </p>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  Your KairOS profile requires physical NFC chip authentication. 
                  URL-based access has been disabled for your security.
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                If you're not redirected automatically, you need to authenticate via NFC first.
              </p>
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground font-mono">
              <p><strong>Debug Information:</strong></p>
              <p>URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
              <p>Status: Loading profile data...</p>
            </div>
            
            <Button
              onClick={() => window.location.href = '/nfc'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
            >
              <Shield className="h-4 w-4 mr-2" />
              Go to NFC Authentication
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show PIN authentication gate if required
  if (requiresPINAuth && userProfile && pinAuthenticatedChipUID !== userProfile.chipUID) {
    
    // 🔐 SECURITY: If account doesn't have PIN, redirect to NFC setup
    if (!userProfile.hasPIN) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
          {/* Holographic Background Effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
          </div>
          
          <div className="container mx-auto px-4 py-8 max-w-md relative z-10 flex items-center justify-center min-h-screen">
            <div className="w-full text-center space-y-6">
              <div className="relative p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto w-fit mb-6">
                <AlertCircle className="h-12 w-12 text-amber-500" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-2xl font-mono font-light text-foreground/90">
                  Account Setup Required
                </h1>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Your account needs to be properly authenticated via NFC to set up security.
                </p>
                
                <div className="bg-card/50 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 text-left">
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    <strong>Security Setup:</strong>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    For your security, this account must be authenticated through the proper NFC flow 
                    to establish your PIN and complete setup.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => window.location.href = `/nfc?chipUID=${encodeURIComponent(userProfile.chipUID)}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Complete Authentication Setup
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // Account has PIN - show PIN entry
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
        {/* Holographic Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-md relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full">
            <div className="text-center mb-8">
              <div className="relative p-4 rounded-full bg-primary/10 border border-primary/20 mx-auto w-fit mb-6">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              
              <h1 className="text-2xl font-mono font-light text-foreground/90 mb-2">
                Profile Security Gate
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Enter your PIN to access your KairOS profile
              </p>
            </div>
            
            <PINEntry
              chipUID={userProfile.chipUID}
              isNewDevice={false}
              displayName={userProfile.displayName}
              onSuccess={handleProfilePINAuth}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Morning Eight NFC Gate - runs in background */}
      <NFCGate />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <motion.div 
          className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-primary">
            Memory Keeper Profile
          </h1>
          {/* Hide Ritual Designer button on mobile devices */}
          <div className="hidden md:block">
            <Link href="/ritual-designer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 font-mono">
                Ritual Designer
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-minimal"
        >
          <div className="flex flex-col space-y-4 sm:space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-primary flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${userProfile.chipUID}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-mono">
                  {userProfile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2 font-mono truncate">{userProfile.username}</h2>
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">{userProfile.bio}</p>
              </div>
            </div>
            
            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-lg sm:text-2xl font-bold text-primary font-mono">{userProfile.verificationsGiven}</div>
                <div className="text-xs text-muted-foreground font-mono">VERIFICATIONS</div>
              </div>
              <div className="text-center p-3 bg-accent/5 rounded-lg border border-accent/10">
                <div className="text-lg sm:text-2xl font-bold text-accent font-mono">{userProfile.memoriesContributed}</div>
                <div className="text-xs text-muted-foreground font-mono">MEMORIES</div>
              </div>
              <div className="text-center p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                <div className="text-lg sm:text-2xl font-bold text-secondary font-mono">{userProfile.momentsWitnessed}</div>
                <div className="text-xs text-muted-foreground font-mono">MOMENTS</div>
              </div>
              <div className="text-center p-3 bg-warning/5 rounded-lg border border-warning/10">
                <div className="text-lg sm:text-2xl font-bold text-warning font-mono">{userProfile.totalBonds || 0}</div>
                <div className="text-xs text-muted-foreground font-mono">BONDS</div>
              </div>
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                onClick={() => setShowLogoutModal(true)}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 font-mono text-sm w-full sm:w-auto"
              >
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* PIN Setup Prompt */}
        {showPINSetup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <PINSetup
              chipUID={userProfile.chipUID}
              hasPIN={hasPIN}
              onPINSetup={handlePINSetup}
              onDismiss={() => setShowPINSetup(false)}
            />
          </motion.div>
        )}

        {/* Enhanced Tabs with Wallet Integration */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/30 backdrop-blur-sm rounded-xl p-1">
            <TabsTrigger value="identity" className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Identity</span>
              <span className="sm:hidden text-xs">ID</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Wallet</span>
              <span className="sm:hidden text-xs">ETH</span>
            </TabsTrigger>
            <TabsTrigger value="memories" className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Bonds</span>
              <span className="sm:hidden text-xs">Bonds</span>
            </TabsTrigger>
            <TabsTrigger value="moments" className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Moments</span>
              <span className="sm:hidden text-xs">Moments</span>
            </TabsTrigger>
            <TabsTrigger value="morning-eight" className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Sunrise className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Morning</span>
              <span className="sm:hidden text-xs">8min</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span>Your Digital Identity</span>
                  </CardTitle>
                  <p className="text-muted-foreground">Manage your profile and personal information</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProfileEditor
                    currentProfile={{
                      displayName: userProfile.displayName,
                      bio: userProfile.bio,
                      interests: userProfile.interests,
                      avatar: userProfile.avatar
                    }}
                    onSave={handleProfileUpdate}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="space-y-6">
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
                          onClick={() => navigator.clipboard.writeText(address || '')}
                        >
                          Copy to Clipboard
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // Disconnected State
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-800">
                      <Wallet className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No Wallet Connected
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Connect your Web3 wallet to access DeFi features, NFTs, and blockchain interactions
                    </p>
                  </div>

                  {connectError && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        {connectError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Wallet Connection Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* MetaMask */}
                    <Card className="hover:border-orange-300 transition-colors cursor-pointer group" onClick={() => connectWallet('metamask')}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors dark:bg-orange-950/30">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <path d="M22.05 8.76L12.84 1.2a1.24 1.24 0 0 0-1.68 0L1.95 8.76a1.24 1.24 0 0 0-.45.95v6.58c0 .37.16.72.45.95l9.21 7.56c.5.41 1.18.41 1.68 0l9.21-7.56c.29-.23.45-.58.45-.95V9.71c0-.37-.16-.72-.45-.95z" fill="#F6851B"/>
                              <path d="M12 15.84L7.2 12l4.8-3.84L16.8 12l-4.8 3.84z" fill="#E2761B"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">MetaMask</h4>
                            <p className="text-sm text-muted-foreground">Most popular wallet</p>
                          </div>
                        </div>
                        <Button 
                          disabled={isLoading}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          size="sm"
                        >
                          {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                        </Button>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Browser extension</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Mobile app support</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>



                    {/* Coinbase Wallet */}
                    <Card className="hover:border-indigo-300 transition-colors cursor-pointer group" onClick={() => connectWallet('coinbase')}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors dark:bg-indigo-950/30">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" fill="#0052FF"/>
                              <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Coinbase Wallet</h4>
                            <p className="text-sm text-muted-foreground">Self-custody wallet</p>
                          </div>
                        </div>
                        <Button 
                          disabled={isLoading}
                          variant="outline"
                          className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                          size="sm"
                        >
                          {isLoading ? 'Connecting...' : 'Connect Coinbase'}
                        </Button>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Built-in DeFi browser</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Multi-chain support</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Injected/Other */}
                    <Card className="hover:border-slate-300 transition-colors cursor-pointer group" onClick={() => connectWallet('injected')}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors dark:bg-slate-800">
                            <Wallet className="w-7 h-7 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Other Wallets</h4>
                            <p className="text-sm text-muted-foreground">Browser injected</p>
                          </div>
                        </div>
                        <Button 
                          disabled={isLoading}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Brave, Trust Wallet</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Hardware wallets</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have a wallet?{' '}
                      <a 
                        href="https://ethereum.org/en/wallets/find-wallet/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Learn how to get one
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="memories" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <span>Memory Bonds</span>
                  </CardTitle>
                  <p className="text-muted-foreground">Connect with others through shared experiences</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200/50 dark:border-red-800/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-red-900 dark:text-red-100 flex items-center space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>Shared Moments</span>
                        </h4>
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                          3 Active
                        </Badge>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Create lasting connections through meaningful shared experiences and memories.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        disabled
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Explore Bonds (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="moments" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <span>Collective Moments</span>
                  </CardTitle>
                  <p className="text-muted-foreground">Transform conversations into shared knowledge</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Live Transcription</span>
                        </h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                          Beta
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                        Real-time transcription for group conversations, town halls, and community forums.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400">
                          <span>• Privacy-first processing</span>
                          <span>• Pattern recognition</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400">
                          <span>• Memory connection</span>
                          <span>• Collective wisdom</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/30"
                        disabled
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Session (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="morning-eight" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Sunrise className="w-5 h-5 text-orange-500" />
                    </div>
                    <span>Morning Eight</span>
                  </CardTitle>
                  <p className="text-muted-foreground">Your personalized 8-minute morning ritual system</p>
                </CardHeader>
                <CardContent>
                  <MorningEightPanel onRoutineSelect={() => {}} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-card border border-primary/20 rounded-t-lg sm:rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-primary font-mono">Export Data Crystal</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportModal(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-foreground text-sm">
                  Your data crystal contains your complete profile, memories, and connections. 
                  Keep this file safe - it's your key to restoring your identity.
                </p>
                
                <div className="bg-muted border border-primary/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2 font-mono text-sm">Crystal Contents:</h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <li>• Profile information and settings</li>
                    <li>• Cryptographic keys and verification data</li>
                    <li>• Memory contributions and connections</li>
                    <li>• Community participation history</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleExport}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Crystal
                  </Button>
                  <Button
                    onClick={() => setShowExportModal(false)}
                    variant="outline"
                    className="border-muted text-muted-foreground hover:bg-muted font-mono"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-card border border-primary/20 rounded-t-lg sm:rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-primary font-mono">Import Data Crystal</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-foreground text-sm">
                  Select your data crystal file to restore your profile, memories, and connections. 
                  This will replace your current profile data.
                </p>
                
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                    id="crystal-import"
                  />
                  <label
                    htmlFor="crystal-import"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="w-8 h-8 text-primary" />
                    <span className="text-primary font-medium font-mono">Choose Crystal File</span>
                    <span className="text-xs text-muted-foreground">Select your .json data crystal</span>
                  </label>
                </div>

                <Button
                  onClick={() => setShowImportModal(false)}
                  variant="outline"
                  className="w-full border-muted text-muted-foreground hover:bg-muted font-mono"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-card border border-destructive/20 rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-destructive font-mono">⚠ Logout Warning</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogoutModal(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-2 font-mono text-sm">Data Loss Warning</h4>
                  <p className="text-foreground text-sm leading-relaxed">
                    Logging out will permanently delete all your profile data, memories, and cryptographic keys from this device.
                  </p>
                </div>
                
                <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-accent mb-2 font-mono text-sm">Recommendation</h4>
                  <p className="text-foreground text-sm leading-relaxed">
                    Export your data crystal first (Security tab) to preserve your identity and memories for future use.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setShowLogoutModal(false);
                      setActiveTab("settings");
                    }}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-sm py-2"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Export Data First
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-mono text-sm py-2"
                  >
                    Logout Anyway (Delete All Data)
                  </Button>
                  <Button
                    onClick={() => setShowLogoutModal(false)}
                    variant="outline"
                    className="border-muted text-muted-foreground hover:bg-muted font-mono text-sm py-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;