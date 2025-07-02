"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PINSetup } from '@/components/ui/pin-setup';
import { NFCGate } from '@/src/features/morningEight/components/NFCGate';
import { User, Heart, Sunrise, Wallet, Sparkles } from "lucide-react";
import Link from 'next/link';

// Import our new modular components
import { ProfileProvider, useProfile } from '@/components/profile/ProfileProvider';
import { ProfileAuthenticationRouter } from '@/components/profile/AuthenticationScreens';
import { DataExportModal, DataImportModal, LogoutModal } from '@/components/profile/ProfileUtilities';
import { IdentityTab } from '@/components/profile/tabs/IdentityTab';
import { WalletTab } from '@/components/profile/tabs/WalletTab';
import { BondsTab } from '@/components/profile/tabs/BondsTab';
import { MomentsTab } from '@/components/profile/tabs/MomentsTab';
import { MorningEightTab } from '@/components/profile/tabs/MorningEightTab';

// Enhanced Profile Header Component
const ProfileHeader: React.FC = () => {
  const { profile } = useProfile();
  const { userProfile, setShowLogoutModal } = profile;

  if (!userProfile) return null;

  return (
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
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2 font-mono truncate">
              {userProfile.username}
            </h2>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              {userProfile.bio}
            </p>
          </div>
        </div>
        
        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-lg sm:text-2xl font-bold text-primary font-mono">
              {userProfile.verificationsGiven}
            </div>
            <div className="text-xs text-muted-foreground font-mono">VERIFICATIONS</div>
          </div>
          <div className="text-center p-3 bg-accent/5 rounded-lg border border-accent/10">
            <div className="text-lg sm:text-2xl font-bold text-accent font-mono">
              {userProfile.memoriesContributed}
            </div>
            <div className="text-xs text-muted-foreground font-mono">MEMORIES</div>
          </div>
          <div className="text-center p-3 bg-secondary/5 rounded-lg border border-secondary/10">
            <div className="text-lg sm:text-2xl font-bold text-secondary font-mono">
              {userProfile.momentsWitnessed}
            </div>
            <div className="text-xs text-muted-foreground font-mono">MOMENTS</div>
          </div>
          <div className="text-center p-3 bg-warning/5 rounded-lg border border-warning/10">
            <div className="text-lg sm:text-2xl font-bold text-warning font-mono">
              {userProfile.totalBonds || 0}
            </div>
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
  );
};

// Main Profile Content Component
const ProfileContent: React.FC = () => {
  const { profile } = useProfile();
  const { activeTab, setActiveTab, showPINSetup, setShowPINSetup, handlePINSetup, userProfile, hasPIN } = profile;

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
        <ProfileHeader />

        {/* PIN Setup Prompt */}
        {showPINSetup && userProfile && (
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

        {/* Enhanced Tabs with Modern Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/30 backdrop-blur-sm rounded-xl p-1">
            <TabsTrigger 
              value="identity" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Identity</span>
              <span className="sm:hidden text-xs">ID</span>
            </TabsTrigger>
            <TabsTrigger 
              value="wallet" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Wallet</span>
              <span className="sm:hidden text-xs">ETH</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bonds" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Bonds</span>
              <span className="sm:hidden text-xs">Bonds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="moments" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Moments</span>
              <span className="sm:hidden text-xs">Moments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="morning-eight" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Sunrise className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Morning</span>
              <span className="sm:hidden text-xs">8min</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="identity" className="mt-6">
            <IdentityTab />
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <WalletTab />
          </TabsContent>

          <TabsContent value="bonds" className="mt-6">
            <BondsTab />
          </TabsContent>

          <TabsContent value="moments" className="mt-6">
            <MomentsTab />
          </TabsContent>

          <TabsContent value="morning-eight" className="mt-6">
            <MorningEightTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Modals */}
      <DataExportModal />
      <DataImportModal />
      <LogoutModal />
    </div>
  );
};

// Main Profile Page Component
const ProfilePage: React.FC = () => {
  return (
    <ProfileProvider>
      <ProfileAuthenticationRouter>
        <ProfileContent />
      </ProfileAuthenticationRouter>
    </ProfileProvider>
  );
};

export default ProfilePage;