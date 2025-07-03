'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Target, Calendar, 
  Activity, AlertTriangle, CheckCircle, Clock,
  BarChart3, LineChart, PieChart, Zap
} from 'lucide-react';

interface AnalyticsData {
  timeframe: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    overallProgress: number;
    progressTrend: number;
    objectivesOnTrack: number;
    objectivesAtRisk: number;
    objectivesCompleted: number;
    averageCompletionTime: number;
    velocityTrend: number;
    predictedCompletionDate: Date | null;
  };
  categoryBreakdown: {
    category: string;
    progress: number;
    count: number;
    trend: number;
  }[];
  progressHistory: {
    date: Date;
    value: number;
    category?: string;
  }[];
  upcomingMilestones: {
    id: string;
    title: string;
    dueDate: Date;
    progress: number;
    risk: 'low' | 'medium' | 'high';
  }[];
  insights: {
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    description: string;
    action?: string;
  }[];
}

/**
 * OKR Analytics Component - Real-time analytics and visualization for OKR tracking
 * 
 * This component provides comprehensive analytics including:
 * - Real-time progress tracking and trends
 * - Predictive completion analysis
 * - Category-based performance breakdown
 * - Risk assessment and early warning systems
 * - Actionable insights and recommendations
 */
export default function OKRAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'predictions' | 'insights'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation for demonstration
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      const now = new Date();
      const startDate = new Date();
      
      switch (selectedTimeframe) {
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      return {
        timeframe: selectedTimeframe,
        period: { start: startDate, end: now },
        metrics: {
          overallProgress: 67,
          progressTrend: 8.5,
          objectivesOnTrack: 12,
          objectivesAtRisk: 3,
          objectivesCompleted: 4,
          averageCompletionTime: 45,
          velocityTrend: 12.3,
          predictedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        categoryBreakdown: [
          { category: 'Technical', progress: 85, count: 8, trend: 12 },
          { category: 'Research', progress: 45, count: 6, trend: 5 },
          { category: 'Community', progress: 25, count: 4, trend: -2 },
          { category: 'Strategic', progress: 72, count: 3, trend: 8 }
        ],
        progressHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          value: Math.max(0, 40 + Math.random() * 30 + i * 0.8)
        })),
        upcomingMilestones: [
          {
            id: 'ms-1',
            title: 'W3C DID:Key Compliance',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            progress: 95,
            risk: 'low'
          },
          {
            id: 'ms-2',
            title: 'ESP32 Firmware Release',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            progress: 60,
            risk: 'medium'
          },
          {
            id: 'ms-3',
            title: 'Community Deployment',
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            progress: 20,
            risk: 'high'
          }
        ],
        insights: [
          {
            type: 'success',
            title: 'Technical Objectives Ahead of Schedule',
            description: 'All technical objectives are progressing 12% faster than planned.',
            action: 'Consider advancing timeline for dependent objectives'
          },
          {
            type: 'warning',
            title: 'Community Engagement Lagging',
            description: 'Community objectives are behind schedule by 15%.',
            action: 'Increase outreach efforts and allocate additional resources'
          },
          {
            type: 'info',
            title: 'Research Publications On Track',
            description: 'Academic partnerships are yielding expected results.',
            action: 'Prepare for Q2 publication submissions'
          },
          {
            type: 'error',
            title: 'Hardware Timeline Risk',
            description: 'ESP32 firmware may be delayed due to testing requirements.',
            action: 'Review testing protocols and consider parallel development'
          }
        ]
      };
    };

    setIsLoading(true);
    setTimeout(() => {
      setAnalyticsData(generateMockData());
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeframe]);

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Activity className="w-5 h-5 text-blue-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              OKR Analytics
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Real-time insights and predictive analytics for KairOS objectives
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as typeof selectedTimeframe)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-indigo-600">{analyticsData.metrics.overallProgress}%</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(analyticsData.metrics.progressTrend)}
                  <span className="text-sm font-medium text-gray-600">
                    {analyticsData.metrics.progressTrend > 0 ? '+' : ''}{analyticsData.metrics.progressTrend}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Objectives on Track</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.metrics.objectivesOnTrack}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">{analyticsData.metrics.objectivesAtRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.metrics.objectivesCompleted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as typeof selectedView)}>
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Category Breakdown */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analyticsData.categoryBreakdown.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.category}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(category.trend)}
                          <span className="text-sm text-gray-600">{category.progress}%</span>
                        </div>
                      </div>
                      <Progress value={category.progress} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {category.count} objectives • {category.trend > 0 ? '+' : ''}{category.trend}% this period
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.upcomingMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {milestone.dueDate.toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className={getRiskColor(milestone.risk)}>
                          {milestone.risk} risk
                        </Badge>
                        <span className="text-sm font-bold">{milestone.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-indigo-600" />
                  Progress Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Interactive chart would be rendered here</p>
                    <p className="text-sm text-gray-400">
                      Chart.js or D3.js integration for historical progress visualization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50/50">
                      <h4 className="font-medium text-blue-900">Projected Completion</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData.metrics.predictedCompletionDate?.toLocaleDateString() || 'TBD'}
                      </p>
                      <p className="text-sm text-blue-700">
                        Based on current velocity of {analyticsData.metrics.velocityTrend}% per week
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-green-50/50">
                      <h4 className="font-medium text-green-900">Success Probability</h4>
                      <p className="text-2xl font-bold text-green-600">87%</p>
                      <p className="text-sm text-green-700">
                        Based on historical performance and current trends
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-yellow-50/50">
                      <h4 className="font-medium text-yellow-900">Risk Assessment</h4>
                      <p className="text-2xl font-bold text-yellow-600">Medium</p>
                      <p className="text-sm text-yellow-700">
                        Hardware milestones pose the highest risk to timeline
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-purple-50/50">
                      <h4 className="font-medium text-purple-900">Resource Optimization</h4>
                      <p className="text-2xl font-bold text-purple-600">+15%</p>
                      <p className="text-sm text-purple-700">
                        Potential efficiency gain with resource reallocation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="space-y-4">
              {analyticsData.insights.map((insight, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        {insight.action && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              {insight.action}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 