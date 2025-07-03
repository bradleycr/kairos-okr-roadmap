'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, TrendingUp, Users, Code, Zap } from 'lucide-react';

interface KeyResult {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track' | 'completed';
  lastUpdated: Date;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'research' | 'community' | 'strategic';
  quarter: string;
  priority: 'high' | 'medium' | 'low';
  owner: string;
  keyResults: KeyResult[];
  overallProgress: number;
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate: Date;
}

/**
 * KairOS OKR Dashboard - Live tracking of project objectives and key results
 * 
 * This component provides a comprehensive view of the KairOS project's strategic goals,
 * technical milestones, and community engagement metrics. It visualizes progress
 * across multiple dimensions and timeframes.
 */
export default function OKRDashboard() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | 'upcoming' | 'historical'>('current');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'research' | 'community' | 'strategic'>('all');

  // Initialize with KairOS-specific OKRs based on the project analysis
  useEffect(() => {
    const kairosOKRs: Objective[] = [
      {
        id: 'obj-1',
        title: 'Achieve Production-Ready Decentralized Authentication',
        description: 'Deliver a fully functional, secure, and scalable DID:Key authentication system with W3C standards compliance',
        category: 'technical',
        quarter: 'Q1 2025',
        priority: 'high',
        owner: 'Core Development Team',
        overallProgress: 85,
        status: 'active',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-03-31'),
        keyResults: [
          {
            id: 'kr-1-1',
            title: 'W3C DID:Key Standards Compliance',
            description: 'Achieve 100% compliance with W3C DID:Key specification',
            target: 100,
            current: 95,
            unit: '%',
            progress: 95,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-1-2',
            title: 'Zero Infrastructure Dependencies',
            description: 'Eliminate all external dependencies for core authentication',
            target: 0,
            current: 1,
            unit: 'dependencies',
            progress: 90,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-1-3',
            title: 'Cross-Platform Compatibility',
            description: 'Support all major browsers and mobile platforms',
            target: 5,
            current: 4,
            unit: 'platforms',
            progress: 80,
            status: 'on-track',
            lastUpdated: new Date()
          }
        ]
      },
      {
        id: 'obj-2',
        title: 'Establish Research Community Adoption',
        description: 'Build a thriving research ecosystem around privacy-preserving authentication',
        category: 'research',
        quarter: 'Q1-Q2 2025',
        priority: 'high',
        owner: 'Research & Community Team',
        overallProgress: 45,
        status: 'active',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-06-30'),
        keyResults: [
          {
            id: 'kr-2-1',
            title: 'Academic Project Adoption',
            description: 'Onboard 10+ academic research projects',
            target: 10,
            current: 3,
            unit: 'projects',
            progress: 30,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-2-2',
            title: 'Research Publications',
            description: 'Enable 5+ peer-reviewed publications using KairOS',
            target: 5,
            current: 1,
            unit: 'publications',
            progress: 20,
            status: 'at-risk',
            lastUpdated: new Date()
          },
          {
            id: 'kr-2-3',
            title: 'Educational Integration',
            description: 'Integrate into 3+ university curricula',
            target: 3,
            current: 2,
            unit: 'universities',
            progress: 67,
            status: 'on-track',
            lastUpdated: new Date()
          }
        ]
      },
      {
        id: 'obj-3',
        title: 'Deploy Community-Governed Digital Infrastructure',
        description: 'Enable self-governed digital communities with privacy-preserving tools',
        category: 'community',
        quarter: 'Q2-Q3 2025',
        priority: 'medium',
        owner: 'Community Development Team',
        overallProgress: 25,
        status: 'active',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-09-30'),
        keyResults: [
          {
            id: 'kr-3-1',
            title: 'Community Deployments',
            description: 'Deploy in 5+ organizations for community governance',
            target: 5,
            current: 1,
            unit: 'deployments',
            progress: 20,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-3-2',
            title: 'User Base Growth',
            description: 'Reach 1000+ active users across all deployments',
            target: 1000,
            current: 150,
            unit: 'users',
            progress: 15,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-3-3',
            title: 'Governance Protocol Development',
            description: 'Create 3+ new privacy-preserving governance protocols',
            target: 3,
            current: 1,
            unit: 'protocols',
            progress: 33,
            status: 'on-track',
            lastUpdated: new Date()
          }
        ]
      },
      {
        id: 'obj-4',
        title: 'Advance Hardware-Software Integration',
        description: 'Complete ESP32 firmware and physical MELD network infrastructure',
        category: 'technical',
        quarter: 'Q2-Q4 2025',
        priority: 'medium',
        owner: 'Hardware Team',
        overallProgress: 40,
        status: 'active',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-12-31'),
        keyResults: [
          {
            id: 'kr-4-1',
            title: 'ESP32 Firmware Completion',
            description: 'Complete and test ESP32 firmware for NFC authentication',
            target: 100,
            current: 60,
            unit: '%',
            progress: 60,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-4-2',
            title: 'Physical MELD Network',
            description: 'Deploy 10+ physical MELD nodes for testing',
            target: 10,
            current: 2,
            unit: 'nodes',
            progress: 20,
            status: 'on-track',
            lastUpdated: new Date()
          },
          {
            id: 'kr-4-3',
            title: 'NFC Pendant Production',
            description: 'Produce 100+ NFC pendants for community testing',
            target: 100,
            current: 15,
            unit: 'pendants',
            progress: 15,
            status: 'at-risk',
            lastUpdated: new Date()
          }
        ]
      }
    ];

    setObjectives(kairosOKRs);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800 border-green-200';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off-track': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Code className="w-4 h-4" />;
      case 'research': return <TrendingUp className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      case 'strategic': return <Target className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const filteredObjectives = objectives.filter(obj => 
    selectedCategory === 'all' || obj.category === selectedCategory
  );

  const overallProgress = objectives.reduce((sum, obj) => sum + obj.overallProgress, 0) / objectives.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              KairOS OKR Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Live tracking of objectives and key results for decentralized authentication infrastructure
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Project Completion</span>
              <span className="text-sm font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-gray-600 mt-2">
              Based on {objectives.length} active objectives across technical, research, and community domains
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="max-w-7xl mx-auto mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger 
              value="all" 
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              All
            </TabsTrigger>
            <TabsTrigger 
              value="technical" 
              onClick={() => setSelectedCategory('technical')}
              className="flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger 
              value="research" 
              onClick={() => setSelectedCategory('research')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Research
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              onClick={() => setSelectedCategory('community')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
            <TabsTrigger 
              value="strategic" 
              onClick={() => setSelectedCategory('strategic')}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Strategic
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Objectives Grid */}
      <div className="max-w-7xl mx-auto grid gap-6">
        {filteredObjectives.map((objective) => (
          <Card key={objective.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(objective.category)}
                    <CardTitle className="text-xl text-gray-900">{objective.title}</CardTitle>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{objective.description}</p>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(objective.status)}>
                    {objective.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                    {objective.quarter}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-indigo-600">{objective.overallProgress}%</span>
              </div>
              <Progress value={objective.overallProgress} className="h-2" />
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Key Results</h4>
                {objective.keyResults.map((kr) => (
                  <div key={kr.id} className="border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">{kr.title}</h5>
                      <Badge variant="outline" className={getStatusColor(kr.status)}>
                        {kr.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{kr.description}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {kr.current} / {kr.target} {kr.unit}
                      </span>
                      <span className="text-sm font-bold text-indigo-600">{kr.progress}%</span>
                    </div>
                    <Progress value={kr.progress} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm text-gray-600">
                  <span>Owner: {objective.owner}</span>
                  <span>
                    {objective.startDate.toLocaleDateString()} - {objective.endDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 