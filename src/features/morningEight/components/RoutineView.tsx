"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  CheckCircle,
  Circle,
  X
} from 'lucide-react';

import type { Routine } from '../types';

interface RoutineViewProps {
  routine: Routine;
  onClose?: () => void;
  autoStart?: boolean;
}

export function RoutineView({ routine, onClose, autoStart = false }: RoutineViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per step
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(routine.steps.length).fill(false)
  );

  // Timer effect
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next step
          if (currentStep < routine.steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setCompletedSteps(prev => {
              const updated = [...prev];
              updated[currentStep] = true;
              return updated;
            });
            return 60;
          } else {
            // Routine complete
            setCompletedSteps(prev => {
              const updated = [...prev];
              updated[currentStep] = true;
              return updated;
            });
            setIsActive(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentStep, routine.steps.length]);

  const handlePlayPause = () => {
    setIsActive(!isActive);
  };

  const handleNext = () => {
    if (currentStep < routine.steps.length - 1) {
      setCompletedSteps(prev => {
        const updated = [...prev];
        updated[currentStep] = true;
        return updated;
      });
      setCurrentStep(currentStep + 1);
      setTimeRemaining(60);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeRemaining(60);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setTimeRemaining(60);
    setIsActive(false);
    setCompletedSteps(new Array(routine.steps.length).fill(false));
  };

  const handleStepSelect = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setTimeRemaining(60);
  };

  const progressPercentage = ((currentStep * 60 + (60 - timeRemaining)) / (routine.steps.length * 60)) * 100;
  const allStepsCompleted = completedSteps.every(Boolean);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-primary">Morning Eight</h1>
            <p className="text-sm text-muted-foreground">
              {routine.date} • {routine.steps.length} steps
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {routine.steps.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Current Step */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Step {currentStep + 1}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={isActive ? "default" : "outline"}>
                  {formatTime(timeRemaining)}
                </Badge>
                {allStepsCompleted && currentStep === routine.steps.length - 1 && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.p 
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg leading-relaxed"
            >
              {routine.steps[currentStep]}
            </motion.p>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={handlePlayPause}
            disabled={allStepsCompleted}
            className="w-12 h-12"
          >
            {isActive ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentStep === routine.steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Step List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {routine.steps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentStep 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleStepSelect(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {completedSteps[index] ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className={`w-4 h-4 ${
                        index === currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-sm font-medium ${
                        index === currentStep ? 'text-primary' : 'text-foreground'
                      }`}>
                        Step {index + 1}
                      </span>
                      {index === currentStep && isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${
                      index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion Message */}
        <AnimatePresence>
          {allStepsCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardContent className="pt-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
                    Morning Ritual Complete
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    You've completed your 8-minute morning routine. Have a wonderful day!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 