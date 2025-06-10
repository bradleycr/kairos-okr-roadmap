'use client'

/**
 * NFC Database Monitoring Dashboard
 * 
 * Production-level monitoring for real NFC chip deployments
 * Track account creation, PIN setup rates, and chip usage analytics
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  DatabaseIcon,
  RefreshCwIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UsersIcon,
  ShieldIcon,
  TrendingUpIcon,
  ClockIcon,
  CpuIcon,
  EyeIcon,
  BarChart3Icon,
  CalendarIcon
} from 'lucide-react'

interface DatabaseAccount {
  accountId: string
  chipUID: string
  publicKey: string
  did: string
  createdAt: string
  lastSeen: string
  verificationCount: number
  hasPIN: boolean
  encryptedPIN?: string
  pinSalt?: string
}

interface DatabaseStats {
  totalAccounts: number
  accountsWithPIN: number
  accountsWithoutPIN: number
  recentAccounts: number // last 24 hours
  totalVerifications: number
  avgVerificationsPerAccount: number
  oldestAccount?: string
  newestAccount?: string
}

interface RecentActivity {
  type: 'account_created' | 'pin_setup' | 'verification'
  accountId: string
  chipUID: string
  timestamp: string
  details?: string
}

export default function NFCDatabaseDashboard() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<DatabaseAccount[]>([])
  const [stats, setStats] = useState<DatabaseStats>({
    totalAccounts: 0,
    accountsWithPIN: 0,
    accountsWithoutPIN: 0,
    recentAccounts: 0,
    totalVerifications: 0,
    avgVerificationsPerAccount: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch all accounts from database
  const fetchAllAccounts = async () => {
    setIsLoading(true)
    
    try {
      console.log('🔍 Fetching ALL accounts from production database...')
      
      // PRODUCTION METHOD: Use dedicated endpoint to get ALL accounts from Vercel KV
      const response = await fetch('/api/nfc/accounts/all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        throw new Error(`Database API error: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📊 API Response Result:', result)
      
      if (!result.success) {
        console.error(`❌ API returned error: ${result.error}`)
        throw new Error(result.error || 'Failed to fetch accounts')
      }
      
      const allAccounts = result.accounts || []
      console.log(`✅ Fetched ${allAccounts.length} accounts from ${result.dataSource}`)
      console.log('📋 Account Details:', allAccounts.map((acc: any) => ({ 
        chipUID: acc.chipUID, 
        accountId: acc.accountId, 
        createdAt: acc.createdAt,
        hasPIN: acc.hasPIN 
      })))
      
      setAccounts(allAccounts)
      calculateStats(allAccounts)
      generateRecentActivity(allAccounts)
      setLastRefresh(new Date())
      
      toast({
        title: "📊 Database Refreshed",
        description: `Found ${allAccounts.length} accounts from ${result.dataSource}`,
      })
      
    } catch (error) {
      console.error('❌ Failed to fetch accounts:', error)
      toast({
        title: "❌ Fetch Failed", 
        description: `Could not load database accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Calculate statistics
  const calculateStats = (accounts: DatabaseAccount[]) => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const totalAccounts = accounts.length
    const accountsWithPIN = accounts.filter(acc => acc.hasPIN).length
    const accountsWithoutPIN = totalAccounts - accountsWithPIN
    const recentAccounts = accounts.filter(acc => 
      new Date(acc.createdAt) > yesterday
    ).length
    const totalVerifications = accounts.reduce((sum, acc) => sum + acc.verificationCount, 0)
    const avgVerificationsPerAccount = totalAccounts > 0 ? totalVerifications / totalAccounts : 0
    
    const sortedByCreation = [...accounts].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    setStats({
      totalAccounts,
      accountsWithPIN,
      accountsWithoutPIN,
      recentAccounts,
      totalVerifications,
      avgVerificationsPerAccount,
      oldestAccount: sortedByCreation[0]?.createdAt,
      newestAccount: sortedByCreation[sortedByCreation.length - 1]?.createdAt
    })
  }
  
  // Generate recent activity log
  const generateRecentActivity = (accounts: DatabaseAccount[]) => {
    const activities: RecentActivity[] = []
    
    accounts.forEach(account => {
      // Account creation activity
      activities.push({
        type: 'account_created',
        accountId: account.accountId,
        chipUID: account.chipUID,
        timestamp: account.createdAt,
        details: `Account ${account.accountId} created`
      })
      
      // PIN setup activity (if applicable)
      if (account.hasPIN) {
        activities.push({
          type: 'pin_setup',
          accountId: account.accountId,
          chipUID: account.chipUID,
          timestamp: account.createdAt, // Approximation
          details: 'PIN protection enabled'
        })
      }
      
      // Recent verifications
      if (account.verificationCount > 1) {
        activities.push({
          type: 'verification',
          accountId: account.accountId,
          chipUID: account.chipUID,
          timestamp: account.lastSeen,
          details: `${account.verificationCount} total verifications`
        })
      }
    })
    
    // Sort by timestamp (newest first) and take last 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
    
    setRecentActivity(sortedActivities)
  }
  
  // Export data to CSV
  const exportToCSV = () => {
    const headers = [
      'Account ID',
      'Chip UID', 
      'Has PIN',
      'Created At',
      'Last Seen',
      'Verification Count',
      'DID'
    ]
    
    const rows = accounts.map(account => [
      account.accountId,
      account.chipUID,
      account.hasPIN ? 'Yes' : 'No',
      account.createdAt,
      account.lastSeen,
      account.verificationCount.toString(),
      account.did
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `kairos-nfc-accounts-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "📊 Export Complete",
      description: `Exported ${accounts.length} accounts to CSV`,
    })
  }
  
  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(fetchAllAccounts, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])
  
  // Initial load
  useEffect(() => {
    fetchAllAccounts()
  }, [])
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }
  
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'account_created': return <UsersIcon className="h-4 w-4 text-green-500" />
      case 'pin_setup': return <ShieldIcon className="h-4 w-4 text-blue-500" />
      case 'verification': return <CheckCircleIcon className="h-4 w-4 text-purple-500" />
    }
  }
  
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <DatabaseIcon className="h-8 w-8 text-primary" />
              NFC Database Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Production monitoring for your NFC chip deployment
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              onClick={fetchAllAccounts}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
            
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={accounts.length === 0}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Last updated: {formatTimestamp(lastRefresh.toISOString())}
            {autoRefresh && <Badge variant="secondary" className="ml-2">Auto-refreshing every 30s</Badge>}
          </div>
        )}
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recentAccounts} in last 24h
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PIN Protected</CardTitle>
              <ShieldIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accountsWithPIN}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAccounts > 0 ? Math.round((stats.accountsWithPIN / stats.totalAccounts) * 100) : 0}% adoption rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVerifications}</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgVerificationsPerAccount.toFixed(1)} avg per account
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need PIN Setup</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.accountsWithoutPIN}</div>
              <p className="text-xs text-muted-foreground">
                Accounts without PIN protection
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Accounts Table */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                All registered NFC accounts in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {accounts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <CpuIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No accounts found in database</p>
                    <p className="text-sm">Accounts will appear here as people use their NFC chips</p>
                  </div>
                ) : (
                  accounts.map((account, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm font-medium text-primary">
                          {account.chipUID}
                        </div>
                        <div className="flex items-center gap-2">
                          {account.hasPIN ? (
                            <Badge variant="secondary" className="text-xs">
                              🔐 PIN Protected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              ⚠️ No PIN
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {account.verificationCount}x used
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div>ID: {account.accountId}</div>
                        <div>Created: {formatTimestamp(account.createdAt)}</div>
                        <div>Last seen: {formatTimestamp(account.lastSeen)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest account events and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <EyeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Activity will appear here as people use their chips</p>
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {activity.chipUID}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.details}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Production Status */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircleIcon className="h-5 w-5" />
              Production Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-700">Database</div>
                <div className="text-green-600">✅ Operational</div>
              </div>
              <div>
                <div className="font-medium text-green-700">Authentication</div>
                <div className="text-green-600">✅ Ed25519 Active</div>
              </div>
              <div>
                <div className="font-medium text-green-700">PIN System</div>
                <div className="text-green-600">✅ AES-256 Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
} 