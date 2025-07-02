"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sunrise } from "lucide-react";
import { MorningEightPanel } from '@/src/features/morningEight/components/MorningEightPanel';

export const MorningEightTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Sunrise className="w-5 h-5 text-orange-500" />
            </div>
            <span>Morning Eight</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Your personalized 8-minute morning ritual system
          </p>
        </CardHeader>
        <CardContent>
          <MorningEightPanel onRoutineSelect={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}; 