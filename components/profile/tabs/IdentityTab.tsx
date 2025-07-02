"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { ProfileEditor } from '@/components/ui/profile-editor';
import { useProfile } from '../ProfileProvider';

export const IdentityTab: React.FC = () => {
  const { profile } = useProfile();
  const { userProfile, handleProfileUpdate } = profile;

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span>Your Digital Identity</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Manage your profile and personal information
          </p>
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
  );
}; 