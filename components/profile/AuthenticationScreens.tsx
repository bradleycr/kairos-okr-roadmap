"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle } from "lucide-react";
import PINEntry from '@/components/ui/pin-entry';
import { useProfile } from './ProfileProvider';

// Loading Screen Component
export const ProfileLoadingScreen: React.FC = () => {
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
  );
};

// Authentication Required Screen
export const AuthenticationRequiredScreen: React.FC = () => {
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
  );
};

// Account Setup Required Screen
export const AccountSetupRequiredScreen: React.FC = () => {
  const { profile } = useProfile();
  const { userProfile } = profile;

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
            onClick={() => {
              const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
              const chipUID = userProfile?.chipUID ? encodeURIComponent(userProfile.chipUID) : '';
              window.location.href = `/nfc?chipUID=${chipUID}&returnTo=${returnUrl}`;
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            Complete Authentication Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

// PIN Authentication Gate Screen
export const PINAuthenticationGate: React.FC = () => {
  const { profile } = useProfile();
  const { userProfile, handleProfilePINAuth } = profile;

  if (!userProfile) {
    return <AuthenticationRequiredScreen />;
  }

  const handlePINSuccess = async (account: any, pin: string) => {
    try {
      const success = await handleProfilePINAuth(account, pin);
      if (!success) {
        console.error('PIN authentication failed');
      }
    } catch (error) {
      console.error('PIN authentication error:', error);
    }
  };

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
            displayName={userProfile.displayName}
            isNewDevice={false}
            onSuccess={handlePINSuccess}
          />
        </div>
      </div>
    </div>
  );
};

// Main Authentication Router Component
export const ProfileAuthenticationRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { 
    isLoadingProfile, 
    userProfile, 
    requiresPINAuth, 
    pinAuthenticatedChipUID 
  } = profile;

  // Show loading spinner while profile is loading
  if (isLoadingProfile) {
    return <ProfileLoadingScreen />;
  }

  // If profile loading failed, show authentication required message
  if (userProfile === null) {
    return <AuthenticationRequiredScreen />;
  }

  // Show PIN authentication gate if required
  if (requiresPINAuth && userProfile && pinAuthenticatedChipUID !== userProfile.chipUID) {
    // If account doesn't have PIN, redirect to NFC setup
    if (!userProfile.hasPIN) {
      return <AccountSetupRequiredScreen />;
    }
    
    // Account has PIN - show PIN entry
    return <PINAuthenticationGate />;
  }

  // User is authenticated - show main profile content
  return <>{children}</>;
}; 