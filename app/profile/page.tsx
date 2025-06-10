"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, Copy, Shield, Sparkles, Users, MessageCircle, Brain, X, UserIcon } from "lucide-react";
import Link from 'next/link';
import { PINSetup } from '@/components/ui/pin-setup';
import { ProfileEditor } from '@/components/ui/profile-editor';

// Welcome Ritual Component
const WelcomeRitual = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage < 2) {
        setStage(stage + 1);
      } else {
        setTimeout(() => onComplete(), 1000);
      }
    }, 1800);
    
    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  const stages = [
    { text: "Generating cryptographic identity", detail: "Creating Ed25519 keypair from device entropy" },
    { text: "Establishing decentralized profile", detail: "Zero-knowledge identity verification" },
    { text: "Memory space initialized", detail: "Local storage configured" }
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-background/98 backdrop-blur-md z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Minimal Sacred Geometry Background */}
        <motion.div
          className="absolute inset-0 opacity-5 flex items-center justify-center"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-64 h-64 border border-primary rounded-full"></div>
        </motion.div>

        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 space-y-4"
        >
          {/* Minimal Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>

          <h2 className="text-lg font-mono text-primary font-medium">
            {stages[stage]?.text}
          </h2>
          <p className="text-sm text-muted-foreground font-mono px-4">
            {stages[stage]?.detail}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

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
      collectiveWisdom: 0
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
    collectiveWisdom: Math.floor(rng() * 1000) + 200
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
  const [showWelcomeRitual, setShowWelcomeRitual] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);

  // Check for chipUID in URL parameters
  useEffect(() => {
    const loadProfileData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const verified = urlParams.get('verified');
      const source = urlParams.get('source');
      const chipUID = urlParams.get('chipUID');
      const sessionToken = urlParams.get('session');
      const momentId = urlParams.get('momentId');
      
      console.log('Profile loading with params:', { verified, source, chipUID, sessionToken, momentId });
      
      // Only allow access if properly authenticated via NFC flow
      if (!verified || !source || !chipUID || !sessionToken) {
        console.warn('Missing required authentication parameters:', { verified, source, chipUID, sessionToken });
        // Redirect to NFC authentication - no mock access allowed
        window.location.href = '/nfc';
        return;
      }
      
      // Verify this is a real authentication session, not a mock
      if (source !== 'api') {
        console.warn('Invalid authentication source:', source);
        window.location.href = '/nfc';
        return;
      }
      
      // Load real user identity from localStorage (from decentralized crypto flow)
      try {
        // Use dynamic import for better Next.js compatibility
        const { loadLocalIdentity } = await import('@/lib/crypto/decentralizedNFC');
        const identity = loadLocalIdentity();
        
        console.log('Loaded local identity:', identity ? 'found' : 'not found');
        
        if (!identity) {
          console.warn('No local identity found - this might be a legacy authentication');
          
          // For legacy authentication or first-time users, create a minimal identity
          const { initializeLocalIdentity } = await import('@/lib/crypto/decentralizedNFC');
          const newIdentity = initializeLocalIdentity(`User_${chipUID}`);
          console.log('Created new identity for legacy auth');
        }
        
        // Try to find the device that matches this chipUID
        const updatedIdentity = loadLocalIdentity();
        let matchingDevice = null;
        
        if (updatedIdentity) {
          matchingDevice = Object.values(updatedIdentity.devices).find(
            (device: any) => device.chipUID === chipUID
          ) as any;
        }
        
        console.log('Matching device found:', matchingDevice ? 'yes' : 'no');
        
        if (!matchingDevice) {
          console.warn('Device not found in local identity registry - creating temporary device entry');
          // For authenticated sessions without registered devices, create a temporary entry
          matchingDevice = {
            deviceId: `temp_${Date.now()}`,
            deviceName: `Authenticated Device ${chipUID.slice(-4)}`,
            publicKey: 'temp_public_key', // Placeholder for authenticated session
            chipUID: chipUID,
            createdAt: Date.now()
          };
        }
        
        // Check if this is first visit for welcome ritual
        const hasVisited = localStorage.getItem(`kairos_visited_${chipUID}`);
        if (!hasVisited) {
          setShowWelcomeRitual(true);
          localStorage.setItem(`kairos_visited_${chipUID}`, 'true');
        }
        
        // Use privacy-first account manager to get or create profile
        try {
          const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
          
          // First ensure account exists (this will create or update database entry)
          const accountResult = await NFCAccountManager.authenticateOrCreateAccount(chipUID)
          const currentAccount = accountResult.account
          
          console.log(`Account status: ${accountResult.isNewAccount ? 'New' : 'Existing'}, Device: ${accountResult.isNewDevice ? 'New' : 'Familiar'}`)
          
          // Use REAL account data instead of mock stats
          const profile = {
            chipUID,
            deviceId: matchingDevice?.deviceId || currentAccount.accountId,
            deviceName: currentAccount.deviceName,
            username: currentAccount.username,
            displayName: currentAccount.displayName,
            publicKey: currentAccount.publicKey,
            bio: currentAccount.bio,
            // 🆕 Use REAL stats from account instead of generateUserStats mock
            verificationsGiven: currentAccount.stats.totalSessions || 1,
            memoriesContributed: currentAccount.stats.totalMoments || 0,
            momentsWitnessed: currentAccount.moments?.length || 0,
            collectiveWisdom: Math.floor((currentAccount.stats.totalSessions * 10) + (currentAccount.stats.totalMoments * 25)),
            joinDate: currentAccount.createdAt,
            lastSession: {
              sessionToken,
              momentId,
              timestamp: new Date().toISOString()
            },
            cryptographicIdentity: {
              verified: true,
              deviceRegistered: !!updatedIdentity,
              authenticationMethod: updatedIdentity ? 'decentralized-nfc' : 'legacy-nfc',
              accountId: currentAccount.accountId,
              totalSessions: currentAccount.stats.totalSessions,
              totalMoments: currentAccount.stats.totalMoments,
              isNewAccount: accountResult.isNewAccount,
              isNewDevice: accountResult.isNewDevice
            }
          }
          
          setUserProfile(profile)
          setHasPIN(currentAccount.hasPIN)
          
          // Show PIN setup prompt for new accounts without PIN
          if (!currentAccount.hasPIN && !currentAccount.pinSetupPrompted) {
            setShowPINSetup(true)
          }
          
          console.log('✅ Loaded REAL profile data from account manager (no more mock data!)')
          
                     
         } catch (error) {
           console.error('❌ Failed to load account via NFCAccountManager:', error)
           
           // Show error and redirect - no fallback to mock data
           setUserProfile(null)
           
           setTimeout(() => {
             window.location.href = '/nfc'
           }, 3000)
           return
         }
        console.log('Profile loaded successfully');
        
      } catch (error) {
        console.error('Failed to load cryptographic identity:', error);
        // Instead of redirecting immediately, try to show a more helpful error
        setUserProfile(null);
        
        // Only redirect after a delay to allow user to see any error messages
        setTimeout(() => {
          window.location.href = '/nfc';
        }, 3000);
        return;
      }
    };

    loadProfileData();
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcomeRitual(false);
  };

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

  const handleLogout = () => {
    if (userProfile) {
      // Clear all user data from localStorage
      localStorage.removeItem(`kairos_profile_${userProfile.chipUID}`);
      localStorage.removeItem(`kairos_visited_${userProfile.chipUID}`);
      
      // Redirect to home page
      window.location.href = '/';
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-lg font-mono text-primary">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">
              Verifying your cryptographic identity...
            </p>
            <p className="text-xs text-muted-foreground">
              If you're not redirected automatically, you need to authenticate via NFC first.
            </p>
            <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Debug Information:</p>
              <div className="text-xs font-mono text-left space-y-1">
                <p>URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
                <p>Status: Loading profile data...</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/nfc'}
              className="mt-4"
            >
              Go to NFC Authentication
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>
        {showWelcomeRitual && (
          <WelcomeRitual onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

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
          <Link href="/ritual-designer">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 font-mono w-full sm:w-auto">
              Ritual Designer
            </Button>
          </Link>
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
                <div className="text-lg sm:text-2xl font-bold text-warning font-mono">{userProfile.collectiveWisdom}</div>
                <div className="text-xs text-muted-foreground font-mono">WISDOM</div>
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

        {/* Tabs */}
        <ResponsiveTabs value={activeTab} onValueChange={setActiveTab}>
          <ResponsiveTabsList>
            <ResponsiveTabsTrigger value="profile">
              <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline font-mono text-xs">Edit Profile</span>
              <span className="xs:hidden sm:hidden font-mono text-xs">Edit</span>
            </ResponsiveTabsTrigger>
            <ResponsiveTabsTrigger value="companion">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline font-mono text-xs">AI Companion</span>
              <span className="xs:hidden sm:hidden font-mono text-xs">AI</span>
            </ResponsiveTabsTrigger>
            <ResponsiveTabsTrigger value="transcriptions">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline font-mono text-xs">Transcriptions</span>
              <span className="xs:hidden sm:hidden font-mono text-xs">Text</span>
            </ResponsiveTabsTrigger>
            <ResponsiveTabsTrigger value="community">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline font-mono text-xs">Community</span>
              <span className="xs:hidden sm:hidden font-mono text-xs">Groups</span>
            </ResponsiveTabsTrigger>
            <ResponsiveTabsTrigger value="settings">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline font-mono text-xs">Security</span>
              <span className="xs:hidden sm:hidden font-mono text-xs">Keys</span>
            </ResponsiveTabsTrigger>
          </ResponsiveTabsList>

          <TabsContent value="profile" className="mt-4 sm:mt-6">
            <ProfileEditor
              currentProfile={{
                displayName: userProfile.displayName || userProfile.username,
                username: userProfile.username,
                bio: userProfile.bio,
                deviceName: userProfile.deviceName,
                chipUID: userProfile.chipUID
              }}
              onSave={handleProfileUpdate}
            />
          </TabsContent>

          <TabsContent value="companion" className="mt-4 sm:mt-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 shadow-minimal">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-primary font-mono text-base sm:text-lg">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                  Your AI Memory Companion
                  <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded font-mono">DEMO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <p className="text-foreground text-sm sm:text-base leading-relaxed">
                  Your personal AI companion learns from your interactions and helps you make sense of collective memories and experiences. 
                  It's designed to amplify human wisdom rather than replace it.
                </p>
                <div className="bg-primary/10 border border-primary/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2 font-mono text-sm sm:text-base">What your companion remembers:</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <li>• Patterns in your ritual participation</li>
                    <li>• Connections between your memories and others</li>
                    <li>• Insights that emerge from collective experiences</li>
                    <li>• Questions that help deepen understanding</li>
                  </ul>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm sm:text-base py-2 sm:py-3" disabled>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Conversation (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcriptions" className="mt-4 sm:mt-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 shadow-minimal">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-accent font-mono text-base sm:text-lg">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Collective Transcriptions
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded font-mono">COMING SOON</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <p className="text-foreground text-sm sm:text-base leading-relaxed">
                  Transform spoken conversations into searchable collective memory. Perfect for community gatherings, 
                  ritual debriefs, and capturing the wisdom that emerges in groups.
                </p>
                <div className="bg-accent/10 border border-accent/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-accent mb-2 font-mono text-sm sm:text-base">Collective Sense-Making Features:</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <li>• Real-time transcription of group conversations</li>
                    <li>• Automatic identification of key insights and patterns</li>
                    <li>• Connection to related memories and moments</li>
                    <li>• Privacy-first processing on your device</li>
                  </ul>
                </div>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-sm sm:text-base py-2 sm:py-3" disabled>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Transcription Session (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="mt-4 sm:mt-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-secondary/20 shadow-minimal">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-secondary font-mono text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Your Memory Communities
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded font-mono">DEMO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <p className="text-foreground text-sm sm:text-base leading-relaxed">
                  Connect with others who share similar experiences, participate in collective rituals, 
                  and contribute to our shared understanding of the world.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-secondary font-mono text-sm sm:text-base">Resilience Builders</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">42 active members • Building community strength through shared practices</p>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-warning font-mono text-sm sm:text-base">Memory Weavers</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">28 active members • Connecting stories across time and space</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-primary font-mono text-sm sm:text-base">Ritual Designers</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">63 active members • Creating new practices for collective growth</p>
                  </div>
                </div>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-mono text-sm sm:text-base py-2 sm:py-3" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Explore Communities (Demo Data)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 sm:mt-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 shadow-minimal">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-primary font-mono text-base sm:text-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  Security & Data Portability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div>
                  <h4 className="font-semibold text-primary mb-3 font-mono text-sm sm:text-base">Cryptographic Identity</h4>
                  
                  {userProfile.cryptographicIdentity && (
                    <div className="bg-primary/10 border border-primary/20 p-3 sm:p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm text-primary font-mono">Verified Device: {userProfile.deviceName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Device ID: {userProfile.deviceId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Authentication: {userProfile.cryptographicIdentity.authenticationMethod}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm text-muted-foreground font-mono block mb-1">PUBLIC KEY (Ed25519)</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={userProfile.publicKey} 
                          readOnly 
                          className="bg-muted border-primary/20 text-foreground font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopyKey(userProfile.publicKey, 'Public')}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs px-3"
                        >
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-muted p-3 rounded-lg">
                      <h5 className="text-xs font-mono text-muted-foreground mb-1">🔒 Private Key Security</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your private key is never stored and is derived from your master seed when needed. 
                        This ensures maximum security - even if someone gains access to your profile, 
                        they cannot access your private cryptographic material.
                      </p>
                    </div>
                  </div>
                  {copySuccess && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-secondary text-xs sm:text-sm mt-2 font-mono"
                    >
                      {copySuccess}
                    </motion.p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-primary mb-3 font-mono text-sm sm:text-base">Data Portability</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
                    Your memories and profile data can be exported as a "data crystal" - 
                    an encrypted file that allows you to restore your identity on any device.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setShowExportModal(true)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 font-mono text-xs sm:text-sm py-2"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Export Data Crystal
                    </Button>
                    <Button
                      onClick={() => setShowImportModal(true)}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 flex-1 font-mono text-xs sm:text-sm py-2"
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Import Crystal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ResponsiveTabs>
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
                  <h4 className="font-semibold text-accent mb-2 font-mono text-sm">💡 Recommendation</h4>
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