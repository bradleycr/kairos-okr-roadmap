"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Plus, MessageCircle, Calendar, MapPin } from "lucide-react";
import { useProfile } from '../ProfileProvider';

export const BondsTab: React.FC = () => {
  const { profile } = useProfile();
  const { userProfile, userBonds } = profile;

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading bonds...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <span>Memory Bonds</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Connect with others through shared experiences and memories
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bond Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200/50 dark:border-red-800/30">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                {userBonds.length}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 font-mono">
                ACTIVE BONDS
              </div>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200/50 dark:border-pink-800/30">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 font-mono">
                {userProfile.totalBonds || 0}
              </div>
              <div className="text-xs text-pink-700 dark:text-pink-300 font-mono">
                TOTAL BONDS
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                {userProfile.memoriesContributed}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                MEMORIES
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {userProfile.verificationsGiven}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                VERIFICATIONS
              </div>
            </div>
          </div>

          {/* Recent Bonds */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Bonds</h3>
              <Button variant="outline" size="sm" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Create Bond
              </Button>
            </div>

            {userBonds.length > 0 ? (
              <div className="space-y-3">
                {userBonds.slice(0, 3).map((bond, index) => (
                  <div 
                    key={bond.id}
                    className="p-4 rounded-lg border border-muted bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {bond.type === 'memory' ? 'Memory Bond' : 
                             bond.type === 'moment' ? 'Moment Bond' : 'Verification Bond'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(bond.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {bond.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Bonds Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Start creating meaningful connections through shared experiences
                </p>
                <Button variant="outline" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Find People to Bond With
                </Button>
              </div>
            )}
          </div>

          {/* Bond Features */}
          <div className="grid gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-red-900 dark:text-red-100 flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Shared Moments</span>
                </h4>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Create lasting connections through meaningful shared experiences and memories.
              </p>
              <div className="flex items-center space-x-4 text-xs text-red-600 dark:text-red-400">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Real-time sharing
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Memory timeline
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location bonds
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Community Bonds</span>
                </h4>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                  Beta
                </Badge>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Connect with like-minded individuals in your community through verified experiences.
              </p>
              <div className="flex items-center space-x-4 text-xs text-purple-600 dark:text-purple-400">
                <span>• Trust networks</span>
                <span>• Reputation system</span>
                <span>• Social verification</span>
              </div>
            </div>
          </div>

          {/* Bond Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
              disabled
            >
              <Heart className="w-4 h-4 mr-2" />
              Create Memory Bond
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/30"
              disabled
            >
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 