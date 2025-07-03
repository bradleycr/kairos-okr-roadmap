/**
 * OKR Data Manager - Handles data persistence, GitHub integration, and automated progress tracking
 * 
 * This module provides comprehensive data management for the KairOS OKR system, including:
 * - Local storage and IndexedDB persistence
 * - GitHub API integration for milestone tracking
 * - Automated progress calculation from various sources
 * - Real-time synchronization across multiple sources
 */

import { Octokit } from '@octokit/rest';

// Core OKR Types
export interface KeyResult {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track' | 'completed';
  lastUpdated: Date;
  dataSource?: 'manual' | 'github' | 'automated';
  githubMilestone?: string;
  automationRules?: AutomationRule[];
}

export interface Objective {
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
  githubProject?: string;
  automationEnabled?: boolean;
}

export interface AutomationRule {
  id: string;
  type: 'github-issues' | 'github-prs' | 'github-commits' | 'custom-api';
  query: string;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  mapping: {
    countField?: string;
    progressCalculation?: 'count' | 'percentage' | 'custom';
    customFormula?: string;
  };
}

export interface OKRHistory {
  id: string;
  objectiveId: string;
  keyResultId?: string;
  timestamp: Date;
  previousValue: number;
  newValue: number;
  changeType: 'manual' | 'automated' | 'github-sync';
  notes?: string;
}

/**
 * Main OKR Data Manager Class
 * Handles all data operations, persistence, and integrations
 */
export class OKRDataManager {
  private octokit: Octokit | null = null;
  private dbName = 'kairos-okr-data';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(githubToken?: string) {
    if (githubToken) {
      this.octokit = new Octokit({
        auth: githubToken,
      });
    }
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('objectives')) {
          const objectiveStore = db.createObjectStore('objectives', { keyPath: 'id' });
          objectiveStore.createIndex('category', 'category', { unique: false });
          objectiveStore.createIndex('status', 'status', { unique: false });
          objectiveStore.createIndex('quarter', 'quarter', { unique: false });
        }

        if (!db.objectStoreNames.contains('keyResults')) {
          const keyResultStore = db.createObjectStore('keyResults', { keyPath: 'id' });
          keyResultStore.createIndex('objectiveId', 'objectiveId', { unique: false });
          keyResultStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('objectiveId', 'objectiveId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('automationRules')) {
          const automationStore = db.createObjectStore('automationRules', { keyPath: 'id' });
          automationStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Save objectives to persistent storage
   */
  async saveObjectives(objectives: Objective[]): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['objectives'], 'readwrite');
    const store = transaction.objectStore('objectives');

    for (const objective of objectives) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(objective);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * Load objectives from persistent storage
   */
  async loadObjectives(): Promise<Objective[]> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['objectives'], 'readonly');
    const store = transaction.objectStore('objectives');

    return new Promise<Objective[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update key result progress with history tracking
   */
  async updateKeyResultProgress(
    keyResultId: string, 
    newValue: number, 
    changeType: 'manual' | 'automated' | 'github-sync' = 'manual',
    notes?: string
  ): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['keyResults', 'history'], 'readwrite');
    const keyResultStore = transaction.objectStore('keyResults');
    const historyStore = transaction.objectStore('history');

    // Get current key result
    const currentRequest = keyResultStore.get(keyResultId);
    currentRequest.onsuccess = () => {
      const currentKeyResult = currentRequest.result;
      if (!currentKeyResult) return;

      const previousValue = currentKeyResult.current;
      
      // Update key result
      currentKeyResult.current = newValue;
      currentKeyResult.progress = Math.round((newValue / currentKeyResult.target) * 100);
      currentKeyResult.lastUpdated = new Date();
      
      // Update status based on progress
      if (currentKeyResult.progress >= 100) {
        currentKeyResult.status = 'completed';
      } else if (currentKeyResult.progress >= 70) {
        currentKeyResult.status = 'on-track';
      } else if (currentKeyResult.progress >= 40) {
        currentKeyResult.status = 'at-risk';
      } else {
        currentKeyResult.status = 'off-track';
      }

      keyResultStore.put(currentKeyResult);

      // Add history record
      const historyRecord: OKRHistory = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        objectiveId: currentKeyResult.objectiveId || '',
        keyResultId: keyResultId,
        timestamp: new Date(),
        previousValue,
        newValue,
        changeType,
        notes
      };

      historyStore.put(historyRecord);
    };
  }

  /**
   * Sync with GitHub milestones and issues
   */
  async syncWithGitHub(repo: string, owner: string = 'your-org'): Promise<void> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      // Get milestones
      const { data: milestones } = await this.octokit.rest.issues.listMilestones({
        owner,
        repo,
        state: 'all'
      });

      // Get issues for each milestone
      for (const milestone of milestones) {
        const { data: issues } = await this.octokit.rest.issues.listForRepo({
          owner,
          repo,
          milestone: milestone.number.toString(),
          state: 'all'
        });

        // Calculate progress based on closed issues
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === 'closed').length;
        const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

        // Update corresponding key result
        await this.updateKeyResultByMilestone(milestone.title, progress, 'github-sync');
      }

      // Get commits for technical progress
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      });

      // Update development velocity metrics
      await this.updateDevelopmentVelocity(commits.length);

    } catch (error) {
      console.error('GitHub sync error:', error);
      throw error;
    }
  }

  /**
   * Update key result by GitHub milestone name
   */
  private async updateKeyResultByMilestone(milestoneName: string, progress: number, changeType: 'github-sync'): Promise<void> {
    const objectives = await this.loadObjectives();
    
    for (const objective of objectives) {
      for (const keyResult of objective.keyResults) {
        if (keyResult.githubMilestone === milestoneName) {
          await this.updateKeyResultProgress(keyResult.id, progress, changeType, `Auto-updated from GitHub milestone: ${milestoneName}`);
        }
      }
    }
  }

  /**
   * Update development velocity based on commit activity
   */
  private async updateDevelopmentVelocity(commitCount: number): Promise<void> {
    // Find development velocity key results and update them
    const objectives = await this.loadObjectives();
    
    for (const objective of objectives) {
      for (const keyResult of objective.keyResults) {
        if (keyResult.title.toLowerCase().includes('development velocity') || 
            keyResult.title.toLowerCase().includes('commit')) {
          await this.updateKeyResultProgress(keyResult.id, commitCount, 'github-sync', 'Auto-updated from commit activity');
        }
      }
    }
  }

  /**
   * Generate automated reports
   */
  async generateProgressReport(timeframe: 'weekly' | 'monthly' | 'quarterly' = 'weekly'): Promise<any> {
    const objectives = await this.loadObjectives();
    const history = await this.loadHistory();

    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
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

    const periodHistory = history.filter(h => h.timestamp >= startDate);

    return {
      timeframe,
      period: {
        start: startDate,
        end: now
      },
      objectives: objectives.map(obj => ({
        ...obj,
        progressChange: this.calculateProgressChange(obj.id, periodHistory),
        keyResultsOnTrack: obj.keyResults.filter(kr => kr.status === 'on-track').length,
        keyResultsAtRisk: obj.keyResults.filter(kr => kr.status === 'at-risk').length,
        keyResultsOffTrack: obj.keyResults.filter(kr => kr.status === 'off-track').length,
      })),
      summary: {
        totalObjectives: objectives.length,
        completedObjectives: objectives.filter(obj => obj.status === 'completed').length,
        overallProgress: objectives.reduce((sum, obj) => sum + obj.overallProgress, 0) / objectives.length,
        changesInPeriod: periodHistory.length,
        automatedUpdates: periodHistory.filter(h => h.changeType === 'github-sync').length,
      }
    };
  }

  /**
   * Calculate progress change for an objective over a period
   */
  private calculateProgressChange(objectiveId: string, history: OKRHistory[]): number {
    const objectiveHistory = history.filter(h => h.objectiveId === objectiveId);
    if (objectiveHistory.length === 0) return 0;

    const earliest = objectiveHistory.reduce((min, h) => h.timestamp < min.timestamp ? h : min);
    const latest = objectiveHistory.reduce((max, h) => h.timestamp > max.timestamp ? h : max);

    return latest.newValue - earliest.previousValue;
  }

  /**
   * Load history from storage
   */
  private async loadHistory(): Promise<OKRHistory[]> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');

    return new Promise<OKRHistory[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export OKR data for external use
   */
  async exportData(format: 'json' | 'csv' | 'markdown' = 'json'): Promise<string> {
    const objectives = await this.loadObjectives();
    const history = await this.loadHistory();

    const data = {
      objectives,
      history,
      exportDate: new Date(),
      version: '1.0'
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(objectives);
      
      case 'markdown':
        return this.convertToMarkdown(objectives);
      
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert objectives to CSV format
   */
  private convertToCSV(objectives: Objective[]): string {
    const headers = ['Objective', 'Category', 'Progress', 'Status', 'Quarter', 'Owner', 'Key Result', 'KR Progress', 'KR Status'];
    const rows = [headers.join(',')];

    for (const obj of objectives) {
      for (const kr of obj.keyResults) {
        const row = [
          `"${obj.title}"`,
          obj.category,
          obj.overallProgress,
          obj.status,
          obj.quarter,
          `"${obj.owner}"`,
          `"${kr.title}"`,
          kr.progress,
          kr.status
        ];
        rows.push(row.join(','));
      }
    }

    return rows.join('\n');
  }

  /**
   * Convert objectives to Markdown format
   */
  private convertToMarkdown(objectives: Objective[]): string {
    let markdown = '# KairOS OKR Report\n\n';
    markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    for (const obj of objectives) {
      markdown += `## ${obj.title}\n\n`;
      markdown += `**Category:** ${obj.category} | **Quarter:** ${obj.quarter} | **Progress:** ${obj.overallProgress}%\n\n`;
      markdown += `${obj.description}\n\n`;
      markdown += `**Owner:** ${obj.owner}\n\n`;
      markdown += `### Key Results\n\n`;

      for (const kr of obj.keyResults) {
        markdown += `- **${kr.title}** (${kr.progress}%) - ${kr.status}\n`;
        markdown += `  - ${kr.description}\n`;
        markdown += `  - Target: ${kr.target} ${kr.unit} | Current: ${kr.current} ${kr.unit}\n\n`;
      }

      markdown += '---\n\n';
    }

    return markdown;
  }
}

// Export singleton instance
export const okrDataManager = new OKRDataManager();

// Export utility functions
export const OKRUtils = {
  /**
   * Calculate overall progress for an objective
   */
  calculateObjectiveProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    return Math.round(totalProgress / keyResults.length);
  },

  /**
   * Determine objective status based on key results
   */
  determineObjectiveStatus(keyResults: KeyResult[]): 'active' | 'completed' | 'paused' {
    if (keyResults.every(kr => kr.status === 'completed')) return 'completed';
    if (keyResults.some(kr => kr.status === 'off-track')) return 'paused';
    return 'active';
  },

  /**
   * Generate unique IDs for OKR items
   */
  generateId(prefix: string = 'okr'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format progress percentage
   */
  formatProgress(current: number, target: number): string {
    const percentage = Math.round((current / target) * 100);
    return `${percentage}%`;
  },

  /**
   * Get color class for status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-50';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50';
      case 'off-track': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
}; 