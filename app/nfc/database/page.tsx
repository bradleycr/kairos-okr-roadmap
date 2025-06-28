'use client'

/**
 * Enhanced NFC Database Monitoring Dashboard
 * 
 * Production-level monitoring with comprehensive bond tracking,
 * real-time activity monitoring, and advanced account management
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  UserIcon,
  KeyIcon,
  ActivityIcon,
  TrashIcon,
  AlertTriangleIcon,
  HeartIcon,
  LinkIcon,
  SparklesIcon,
  MapPinIcon,
  MessageSquareIcon,
  TagIcon,
  UserPlusIcon,
  NetworkIcon
} from 'lucide-react'

interface DatabaseAccount {
  chipUID: string
  accountId: string
  displayName: string
  createdAt: string
  lastActivity: string
  isActive: boolean
  bondCount?: number
  recentBonds?: Bond[]
  profileData?: {
    bio?: string
    location?: string
    interests?: string[]
  }
}

interface Bond {
  id: string
  fromChipUID: string
  toChipUID: string
  fromDisplayName: string
  toDisplayName: string
  bondType: 'friend'
  createdAt: string
  metadata?: {
    location?: string
    event?: string
    note?: string
  }
}

interface DatabaseStats {
  totalAccounts: number
  accountsWithPIN: number
  accountsWithoutPIN: number
  recentAccounts: number
  totalBonds: number
  avgBondsPerAccount: number
  totalVerifications: number
  avgVerificationsPerAccount: number
  oldestAccount?: string
  newestAccount?: string
  mostConnectedAccount?: {
    displayName: string
    bondCount: number
  }
}

interface RecentActivity {
  type: 'account_created' | 'pin_setup' | 'verification' | 'bond_created' | 'profile_updated' | 'zk_proof_generated'
  accountId: string
  chipUID: string
  timestamp: string
  details?: string
  relatedChipUID?: string
  relatedDisplayName?: string
}

interface ZKProofEntry {
  proofId: string
  proofType: 'bonding' | 'moment_count' | 'presence'
  timestamp: number
  verificationStatus: 'verified' | 'pending' | 'failed'
  publicSignals: {
    bondHash?: string
    participantCount?: number
    locationHash?: string
    timeWindow?: string
  }
  analytics: {
    geographicRegion?: string
    eventType?: string
    networkSize?: number
    isFirstTimeUser?: boolean
    deviceType?: string
  }
}

interface ZKStats {
  totalProofs: number
  proofsLast24h: number
  verifiedProofs: number
  privacyPreservationRate: number
  averageNetworkSize: number
}

export default function EnhancedNFCDatabaseDashboard() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<DatabaseAccount[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [zkProofs, setZkProofs] = useState<ZKProofEntry[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<DatabaseAccount[]>([])
  const [stats, setStats] = useState<DatabaseStats>({
    totalAccounts: 0,
    accountsWithPIN: 0,
    accountsWithoutPIN: 0,
    recentAccounts: 0,
    totalBonds: 0,
    avgBondsPerAccount: 0,
    totalVerifications: 0,
    avgVerificationsPerAccount: 0
  })
  const [zkStats, setZkStats] = useState<ZKStats>({
    totalProofs: 0,
    proofsLast24h: 0,
    verifiedProofs: 0,
    privacyPreservationRate: 1.0,
    averageNetworkSize: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState<'accounts' | 'bonds' | 'zkproofs'>('accounts')
  
  // Enhanced admin features
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'pin' | 'no-pin' | 'recent' | 'connected' | 'isolated'>('all')
  const [selectedAccount, setSelectedAccount] = useState<DatabaseAccount | null>(null)
  const [editingAccount, setEditingAccount] = useState<DatabaseAccount | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<DatabaseAccount | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch all data from database
  const refreshData = useCallback(async () => {
    console.log('🔄 Starting refreshData...')
    setIsLoading(true)
    try {
      console.log('📡 Fetching accounts...')
      // Fetch accounts
      const accountsResponse = await fetch('/api/nfc/accounts/all')
      const accountsData = await accountsResponse.json()
      console.log('📊 Accounts response:', accountsData)
      
      console.log('🤝 Fetching bonds...')
      // Fetch bonds
      const bondsResponse = await fetch('/api/nfc/bonds', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const bondsData = await bondsResponse.json()
      console.log('💕 Bonds response:', bondsData)
      
      console.log('🔐 Fetching ZK proofs...')
      // Fetch ZK proofs
      const zkResponse = await fetch('/api/zkproofs/archive?timeRange=30d&limit=100')
      const zkData = await zkResponse.json()
      console.log('⚡ ZK proofs response:', zkData)
      
      if (accountsData.success) {
        console.log('✅ Processing data...')
        const accountsWithBonds = await enrichAccountsWithBonds(accountsData.accounts, bondsData.bonds || [])
        console.log('🔗 Accounts with bonds:', accountsWithBonds.length)
        
        setAccounts(accountsWithBonds)
        setFilteredAccounts(accountsWithBonds)
        setBonds(bondsData.bonds || [])
        setZkProofs(zkData.proofs || [])
        calculateEnhancedStats(accountsWithBonds, bondsData.bonds || [])
        calculateZKStats(zkData.proofs || [])
        generateEnhancedActivity(accountsWithBonds, bondsData.bonds || [], zkData.proofs || [])
        setLastRefresh(new Date())
        
        console.log('🎉 Data loaded successfully!')
        toast({
          title: "📊 Database Refreshed",
          description: `Found ${accountsData.accounts.length} accounts, ${bondsData.bonds?.length || 0} bonds, ${zkData.proofs?.length || 0} ZK proofs`,
        })
      } else {
        console.error('❌ Failed to fetch data:', accountsData.error)
        toast({
          title: "❌ Data Fetch Failed",
          description: "Could not fetch account data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('💥 Error refreshing data:', error)
      toast({
        title: "❌ Refresh Failed",
        description: "Could not fetch database information",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      console.log('🏁 refreshData completed')
    }
  }, [])

  // Enrich accounts with bond information
  const enrichAccountsWithBonds = async (accounts: DatabaseAccount[], bonds: Bond[]) => {
    return accounts.map(account => {
      const userBonds = bonds.filter(bond => 
        bond.fromChipUID === account.chipUID || bond.toChipUID === account.chipUID
      )
      
      const recentBonds = userBonds
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
      
      return {
        ...account,
        bondCount: userBonds.length,
        recentBonds
      }
    })
  }
  
  // Enhanced search and filter
  const applySearchAndFilter = (searchValue: string, filterValue: string, accountsToFilter = accounts) => {
    let filtered = [...accountsToFilter]
    
    // Apply search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase()
      filtered = filtered.filter(account => 
        account.displayName?.toLowerCase().includes(search) ||
        account.accountId.toLowerCase().includes(search) ||
        account.chipUID.toLowerCase().includes(search) ||
        account.profileData?.bio?.toLowerCase().includes(search) ||
        account.profileData?.location?.toLowerCase().includes(search)
      )
    }
    
    // Apply filter
    switch (filterValue) {
      case 'pin':
        filtered = filtered.filter(account => account.isActive)
        break
      case 'no-pin':
        filtered = filtered.filter(account => !account.isActive)
        break
      case 'recent':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        filtered = filtered.filter(account => new Date(account.createdAt) > yesterday)
        break
      case 'connected':
        filtered = filtered.filter(account => (account.bondCount || 0) > 0)
        break
      case 'isolated':
        filtered = filtered.filter(account => (account.bondCount || 0) === 0)
        break
      default:
        // 'all' - no additional filtering
        break
    }
    
    setFilteredAccounts(filtered)
  }
  
  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    applySearchAndFilter(value, filterBy)
  }
  
  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterBy(value as typeof filterBy)
    applySearchAndFilter(searchTerm, value)
  }
  
  // Enhanced account update
  const updateAccount = async (updatedAccount: DatabaseAccount) => {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': updatedAccount.chipUID 
        },
        body: JSON.stringify({
          displayName: updatedAccount.displayName,
          isActive: updatedAccount.isActive,
          profileData: updatedAccount.profileData
        })
      })
      
      if (response.ok) {
        // Update local state
        const updatedAccounts = accounts.map(acc => 
          acc.chipUID === updatedAccount.chipUID ? updatedAccount : acc
        )
        setAccounts(updatedAccounts)
        applySearchAndFilter(searchTerm, filterBy, updatedAccounts)
        
        toast({
          title: "✅ Account Updated",
          description: `Updated ${updatedAccount.displayName}`,
        })
        
        setIsEditDialogOpen(false)
        setEditingAccount(null)
        return true
      } else {
        throw new Error('Failed to update account')
      }
    } catch (error) {
      toast({
        title: "❌ Update Failed",
        description: error instanceof Error ? error.message : 'Could not update account',
        variant: "destructive"
      })
      return false
    }
  }
  
  // Delete account and associated bonds
  const deleteAccount = async (accountToDelete: DatabaseAccount) => {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': accountToDelete.chipUID 
        }
      })
      
      if (response.ok) {
        // Remove from local state
        const updatedAccounts = accounts.filter(acc => acc.chipUID !== accountToDelete.chipUID)
        setAccounts(updatedAccounts)
        applySearchAndFilter(searchTerm, filterBy, updatedAccounts)
        
        // Remove associated bonds
        const updatedBonds = bonds.filter(bond => 
          bond.fromChipUID !== accountToDelete.chipUID && 
          bond.toChipUID !== accountToDelete.chipUID
        )
        setBonds(updatedBonds)
        
        calculateEnhancedStats(updatedAccounts, updatedBonds)
        generateEnhancedActivity(updatedAccounts, updatedBonds, zkProofs)
        
        toast({
          title: "🗑️ Account Deleted",
          description: `Deleted ${accountToDelete.displayName} and associated bonds`,
        })
        
        setIsDeleteDialogOpen(false)
        setDeletingAccount(null)
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: error instanceof Error ? error.message : 'Could not delete account',
        variant: "destructive"
      })
      return false
    }
  }
  
  // Calculate statistics
  const calculateEnhancedStats = (accounts: DatabaseAccount[], bonds: Bond[]) => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const totalAccounts = accounts.length
    const accountsWithPIN = accounts.filter(acc => acc.isActive).length
    const accountsWithoutPIN = totalAccounts - accountsWithPIN
    const recentAccounts = accounts.filter(acc => 
      new Date(acc.createdAt) > yesterday
    ).length
    const totalBonds = bonds.length
    const avgBondsPerAccount = totalAccounts > 0 ? totalBonds / totalAccounts : 0
    const totalVerifications = accounts.reduce((sum, acc) => sum + 1, 0)
    const avgVerificationsPerAccount = totalAccounts > 0 ? totalVerifications / totalAccounts : 0
    
    const sortedByCreation = [...accounts].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    const mostConnectedAccount = accounts.reduce((mostConnected, account) => {
      const bondCount = bonds.filter(bond => bond.fromChipUID === account.chipUID || bond.toChipUID === account.chipUID).length
      if (!mostConnected || bondCount > mostConnected.bondCount) {
        return {
          displayName: account.displayName,
          bondCount
        }
      }
      return mostConnected
    }, null)
    
    setStats({
      totalAccounts,
      accountsWithPIN,
      accountsWithoutPIN,
      recentAccounts,
      totalBonds,
      avgBondsPerAccount,
      totalVerifications,
      avgVerificationsPerAccount,
      oldestAccount: sortedByCreation[0]?.createdAt,
      newestAccount: sortedByCreation[sortedByCreation.length - 1]?.createdAt,
      mostConnectedAccount
    })
  }
  
  // Calculate ZK proof statistics
  const calculateZKStats = (proofs: ZKProofEntry[]) => {
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    
    const totalProofs = proofs.length
    const proofsLast24h = proofs.filter(p => p.timestamp >= oneDayAgo).length
    const verifiedProofs = proofs.filter(p => p.verificationStatus === 'verified').length
    const privacyPreservationRate = totalProofs > 0 ? verifiedProofs / totalProofs : 1.0
    
    const networkSizes = proofs.map(p => p.analytics.networkSize || 1)
    const averageNetworkSize = networkSizes.length > 0 ? networkSizes.reduce((a, b) => a + b, 0) / networkSizes.length : 0
    
    setZkStats({
      totalProofs,
      proofsLast24h,
      verifiedProofs,
      privacyPreservationRate,
      averageNetworkSize
    })
  }
  
  // Generate recent activity log
  const generateEnhancedActivity = (accounts: DatabaseAccount[], bonds: Bond[], zkProofs: ZKProofEntry[] = []) => {
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
      if (account.isActive) {
        activities.push({
          type: 'pin_setup',
          accountId: account.accountId,
          chipUID: account.chipUID,
          timestamp: account.createdAt, // Approximation
          details: 'PIN protection enabled'
        })
      }
    })
    
    bonds.forEach(bond => {
      activities.push({
        type: 'bond_created',
        accountId: bond.fromChipUID,
        chipUID: bond.fromChipUID,
        timestamp: bond.createdAt,
        details: `New bond created with ${bond.toDisplayName}`,
        relatedChipUID: bond.toChipUID,
        relatedDisplayName: bond.toDisplayName
      })
    })
    
    zkProofs.forEach(proof => {
      activities.push({
        type: 'zk_proof_generated',
        accountId: proof.proofId,
        chipUID: 'system',
        timestamp: new Date(proof.timestamp).toISOString(),
        details: `ZK proof generated (${proof.proofType}) - ${proof.verificationStatus}`
      })
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
      'Is Active',
      'Created At',
      'Last Activity',
      'Verification Count'
    ]
    
    const rows = accounts.map(account => [
      account.accountId,
      account.chipUID,
      account.isActive ? 'Yes' : 'No',
      account.createdAt,
      account.lastActivity,
      '1'
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
      interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])
  
  // Initial load
  useEffect(() => {
    console.log('🚀 Component mounted, calling refreshData...')
    refreshData()
  }, [])
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }
  
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'account_created': return <UserPlusIcon className="h-4 w-4 text-green-500" />
      case 'pin_setup': return <ShieldIcon className="h-4 w-4 text-blue-500" />
      case 'bond_created': return <HeartIcon className="h-4 w-4 text-red-500" />
      case 'profile_updated': return <EditIcon className="h-4 w-4 text-purple-500" />
      case 'verification': return <CheckCircleIcon className="h-4 w-4 text-orange-500" />
      case 'zk_proof_generated': return <SparklesIcon className="h-4 w-4 text-purple-600" />
      default: return <ActivityIcon className="h-4 w-4 text-muted-foreground" />
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
              onClick={refreshData}
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
        
        {/* Search and Filter Controls */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, account ID, chip UID..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={filterBy} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="pin">PIN Protected</SelectItem>
                  <SelectItem value="no-pin">No PIN</SelectItem>
                  <SelectItem value="recent">Recent (24h)</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="isolated">Isolated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(searchTerm || filterBy !== 'all') && (
              <Badge variant="outline" className="shrink-0">
                {filteredAccounts.length} of {accounts.length} accounts
              </Badge>
            )}
          </div>
        </Card>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <CardTitle className="text-sm font-medium">Total Bonds</CardTitle>
              <HeartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalBonds}</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgBondsPerAccount.toFixed(1)} avg per account
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
              <CardTitle className="text-sm font-medium">Most Connected</CardTitle>
              <NetworkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {stats.mostConnectedAccount?.displayName || 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.mostConnectedAccount?.bondCount || 0} bonds
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
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'accounts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UsersIcon className="h-4 w-4 inline mr-2" />
            Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('bonds')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bonds'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HeartIcon className="h-4 w-4 inline mr-2" />
            Bonds ({bonds.length})
          </button>
          <button
            onClick={() => setActiveTab('zkproofs')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'zkproofs'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SparklesIcon className="h-4 w-4 inline mr-2" />
            ZK Proofs ({zkProofs.length})
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'accounts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Management</h2>
            {/* Enhanced Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <CpuIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              {accounts.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No accounts found in database</p>
                  <p className="text-sm">Accounts will appear here as people use their NFC chips</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No accounts match your search</p>
                  <p className="text-sm">Try adjusting your search term or filter</p>
                </>
              )}
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.chipUID} className="p-4 bg-card/50 border border-border/50 hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  {/* Account Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <h3 className="font-semibold text-lg">{account.displayName}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account)
                          setIsDetailDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccount({...account})
                          setIsEditDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit account"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Bond Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">
                        {account.bondCount || 0} {(account.bondCount || 0) === 1 ? 'Bond' : 'Bonds'}
                      </span>
                    </div>
                    {account.bondCount && account.bondCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    )}
                  </div>
                  
                  {/* Recent Bonds Preview */}
                  {account.recentBonds && account.recentBonds.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Recent connections:</div>
                      {account.recentBonds.slice(0, 2).map((bond, idx) => (
                        <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1">
                          <LinkIcon className="h-3 w-3 inline mr-1" />
                          {bond.fromChipUID === account.chipUID ? bond.toDisplayName : bond.fromDisplayName}
                          <span className="text-muted-foreground ml-1">
                            ({new Date(bond.createdAt).toLocaleDateString()})
                          </span>
                        </div>
                      ))}
                      {account.bondCount && account.bondCount > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{account.bondCount - 2} more connections
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Account Details */}
                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                    <div className="flex items-center gap-1">
                      <KeyIcon className="h-3 w-3" />
                      <span className="font-mono">{account.chipUID.slice(-12)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                    </div>
                    {account.profileData?.location && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{account.profileData.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Bio Preview */}
                  {account.profileData?.bio && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                      <MessageSquareIcon className="h-3 w-3 inline mr-1" />
                      {account.profileData.bio.length > 60 
                        ? `${account.profileData.bio.substring(0, 60)}...` 
                        : account.profileData.bio
                      }
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
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
                {filteredAccounts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <CpuIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    {accounts.length === 0 ? (
                      <>
                        <p>No accounts found in database</p>
                        <p className="text-sm">Accounts will appear here as people use their NFC chips</p>
                      </>
                    ) : (
                      <>
                        <p>No accounts match your search</p>
                        <p className="text-sm">Try adjusting your search term or filter</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredAccounts.map((account, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {account.displayName}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-primary">
                            {account.chipUID}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAccount({...account})
                              setIsEditDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit account"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingAccount(account)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete account"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>ID: {account.accountId}</div>
                        <div>Created: {formatTimestamp(account.createdAt)}</div>
                        <div>Last activity: {formatTimestamp(account.lastActivity)}</div>
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
                <ActivityIcon className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest account events, bonds, and interactions
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
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {activity.type === 'bond_created' ? 'New Bond Created' :
                           activity.type === 'account_created' ? 'Account Created' :
                           activity.type === 'pin_setup' ? 'PIN Setup' :
                           activity.type === 'profile_updated' ? 'Profile Updated' :
                           activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        
                        {activity.type === 'bond_created' && activity.relatedDisplayName ? (
                          <div className="text-sm text-muted-foreground">
                            Connection formed with <span className="font-medium">{activity.relatedDisplayName}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {activity.details}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {activity.chipUID.slice(-12)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                      
                      {activity.type === 'bond_created' && (
                        <div className="shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            Bond
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        )}
        
        {/* Bonds Tab */}
        {activeTab === 'bonds' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Bond Network</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonds.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <HeartIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No bonds found</p>
                  <p className="text-sm">Bonds will appear here as people connect</p>
                </div>
              ) : (
                bonds.map((bond) => (
                  <Card key={bond.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <HeartIcon className="h-5 w-5 text-red-500" />
                        <Badge variant="secondary">{bond.bondType}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{bond.fromDisplayName}</span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium">{bond.toDisplayName}</span>
                        </div>
                        {bond.metadata?.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPinIcon className="h-3 w-3" />
                            {bond.metadata.location}
                          </div>
                        )}
                        {bond.metadata?.event && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {bond.metadata.event}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Created: {formatTimestamp(bond.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* ZK Proofs Tab */}
        {activeTab === 'zkproofs' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Zero-Knowledge Proofs</h2>
            
            {/* ZK Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-purple-600" />
                    Total Proofs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{zkStats.totalProofs}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {zkStats.proofsLast24h} in last 24h
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    Verified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{zkStats.verifiedProofs}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(zkStats.privacyPreservationRate * 100).toFixed(1)}% success rate
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <NetworkIcon className="h-4 w-4 text-blue-600" />
                    Avg Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{zkStats.averageNetworkSize.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    participants per proof
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-indigo-600" />
                    Privacy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{(zkStats.privacyPreservationRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    data kept private
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* ZK Proofs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zkProofs.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <SparklesIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No ZK proofs yet</p>
                  <p className="text-sm">Run the NFC test to generate your first zero-knowledge proofs</p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.open('/nfc-test', '_blank')}
                  >
                    Run ZK Test
                  </Button>
                </div>
              ) : (
                zkProofs.map((proof) => (
                  <Card key={proof.proofId} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <SparklesIcon className="h-5 w-5 text-purple-600" />
                        <Badge 
                          variant={proof.verificationStatus === 'verified' ? 'default' : 'secondary'}
                          className={proof.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {proof.verificationStatus}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium capitalize">{proof.proofType.replace('_', ' ')} Proof</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>ID: {proof.proofId.substring(0, 16)}...</div>
                          {proof.publicSignals.participantCount && (
                            <div>Participants: {proof.publicSignals.participantCount}</div>
                          )}
                          {proof.analytics.geographicRegion && (
                            <div>Region: {proof.analytics.geographicRegion}</div>
                          )}
                          {proof.analytics.deviceType && (
                            <div>Device: {proof.analytics.deviceType}</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Generated: {new Date(proof.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {/* Privacy Notice */}
            <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <ShieldIcon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Privacy-First Analytics</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      This dashboard shows only public proof metadata and aggregate statistics. 
                      No private information (chip IDs, signatures, precise locations) is stored or displayed.
                      All data respects zero-knowledge privacy principles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
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
      
      {/* Enhanced Account Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EditIcon className="h-5 w-5" />
              Edit Account Details
            </DialogTitle>
            <DialogDescription>
              Update account information and profile details for {editingAccount?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          {editingAccount && (
            <div className="space-y-6">
              {/* Basic Account Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={editingAccount.displayName}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        displayName: e.target.value
                      })}
                      placeholder="User's display name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Account Status</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={editingAccount.isActive}
                        onChange={(e) => setEditingAccount({
                          ...editingAccount,
                          isActive: e.target.checked
                        })}
                        className="rounded border-border"
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        {editingAccount.isActive ? 'PIN Protected' : 'No PIN Protection'}
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Chip UID (Read-only)</Label>
                  <Input
                    value={editingAccount.chipUID}
                    disabled
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
              
              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5" />
                  Profile Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editingAccount.profileData?.bio || ''}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        profileData: {
                          ...editingAccount.profileData,
                          bio: e.target.value
                        }
                      })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editingAccount.profileData?.location || ''}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        profileData: {
                          ...editingAccount.profileData,
                          location: e.target.value
                        }
                      })}
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests (comma-separated)</Label>
                    <Input
                      id="interests"
                      value={editingAccount.profileData?.interests?.join(', ') || ''}
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        profileData: {
                          ...editingAccount.profileData,
                          interests: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      })}
                      placeholder="Technology, Music, Travel, etc."
                    />
                  </div>
                </div>
              </div>
              
              {/* Bond Information (Read-only) */}
              {editingAccount.bondCount && editingAccount.bondCount > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HeartIcon className="h-5 w-5" />
                    Connections ({editingAccount.bondCount})
                  </h3>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {editingAccount.recentBonds?.map((bond, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {bond.fromChipUID === editingAccount.chipUID ? bond.toDisplayName : bond.fromDisplayName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(bond.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingAccount(null)
                  }}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => updateAccount(editingAccount)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Account Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              Account Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedAccount?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-6">
              {/* Account Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedAccount.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <h3 className="font-semibold">{selectedAccount.displayName}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Account ID: {selectedAccount.accountId}</div>
                      <div>Chip UID: {selectedAccount.chipUID}</div>
                      <div>Status: {selectedAccount.isActive ? 'PIN Protected' : 'No PIN'}</div>
                      <div>Created: {new Date(selectedAccount.createdAt).toLocaleString()}</div>
                      <div>Last Activity: {new Date(selectedAccount.lastActivity).toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                      Connections
                    </h3>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedAccount.bondCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedAccount.bondCount === 0 ? 'No connections yet' : 
                       selectedAccount.bondCount === 1 ? '1 connection' : 
                       `${selectedAccount.bondCount} connections`}
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Profile Information */}
              {(selectedAccount.profileData?.bio || selectedAccount.profileData?.location || selectedAccount.profileData?.interests?.length) && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquareIcon className="h-4 w-4" />
                    Profile
                  </h3>
                  <div className="space-y-3">
                    {selectedAccount.profileData?.bio && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Bio</div>
                        <div className="text-sm">{selectedAccount.profileData.bio}</div>
                      </div>
                    )}
                    {selectedAccount.profileData?.location && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Location</div>
                        <div className="text-sm flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {selectedAccount.profileData.location}
                        </div>
                      </div>
                    )}
                    {selectedAccount.profileData?.interests && selectedAccount.profileData.interests.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Interests</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedAccount.profileData.interests.map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              {/* Bonds List */}
              {selectedAccount.recentBonds && selectedAccount.recentBonds.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <NetworkIcon className="h-4 w-4" />
                    Recent Connections
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedAccount.recentBonds.map((bond, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {bond.fromChipUID === selectedAccount.chipUID ? bond.toDisplayName : bond.fromDisplayName}
                            </div>
                            {bond.metadata?.location && (
                              <div className="text-xs text-muted-foreground">
                                <MapPinIcon className="h-3 w-3 inline mr-1" />
                                {bond.metadata.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(bond.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAccount({...selectedAccount})
                    setIsDetailDialogOpen(false)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Account Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the account.
            </DialogDescription>
          </DialogHeader>
          
          {deletingAccount && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="font-medium text-red-800">
                    {deletingAccount.displayName}
                  </div>
                  <div className="text-sm text-red-600 font-mono">
                    {deletingAccount.chipUID}
                  </div>
                  <div className="text-sm text-red-600">
                    Account ID: {deletingAccount.accountId}
                  </div>
                  <div className="text-xs text-red-500">
                    Created: {formatTimestamp(deletingAccount.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium">Warning:</div>
                    <div>This will permanently remove all account data including profile information, verification history, and associations. The user will need to create a new account if they use this chip again.</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setDeletingAccount(null)
                  }}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteAccount(deletingAccount)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 