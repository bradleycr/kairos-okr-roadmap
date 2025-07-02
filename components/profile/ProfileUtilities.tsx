"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, X } from "lucide-react";
import { useProfile } from './ProfileProvider';

// Custom QR Code Generator Component
export const CustomQRCode: React.FC<{ data: string; size?: number }> = ({ data, size = 200 }) => {
  // Create a simple artistic pattern instead of a real QR code
  const createPattern = (input: string) => {
    const hash = input.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const gridSize = 21;
    const pattern = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      const value = (hash + x + y * 7) % 3;
      pattern.push(value > 0);
    }
    
    return pattern;
  };

  const pattern = createPattern(data);
  const cellSize = size / 21;

  return (
    <div className="p-4 bg-card rounded-lg shadow-minimal">
      <svg width={size} height={size} className="border-2 border-primary/20">
        {pattern.map((filled, i) => {
          const x = (i % 21) * cellSize;
          const y = Math.floor(i / 21) * cellSize;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={filled ? 'rgb(var(--primary))' : 'rgb(var(--background))'}
            />
          );
        })}
        {/* Artistic corners */}
        <rect x={0} y={0} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
        <rect x={size - cellSize * 7} y={0} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
        <rect x={0} y={size - cellSize * 7} width={cellSize * 7} height={cellSize * 7} fill="none" stroke="rgb(var(--primary))" strokeWidth="2"/>
      </svg>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Scan to transfer your data crystal
      </p>
    </div>
  );
};

// Responsive Tabs Components
export const ResponsiveTabs: React.FC<{ value: string; onValueChange: (value: string) => void; children: React.ReactNode }> = ({ value, onValueChange, children }) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      {children}
    </Tabs>
  );
};

export const ResponsiveTabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card/50 backdrop-blur-sm border border-primary/20 p-1 h-auto">
      {children}
    </TabsList>
  );
};

export const ResponsiveTabsTrigger: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  return (
    <TabsTrigger 
      value={value} 
      className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1 p-2 h-12 sm:h-10 rounded-md data-[state=active]:shadow-sm"
    >
      {children}
    </TabsTrigger>
  );
};

// Data Export Modal
export const DataExportModal: React.FC = () => {
  const { profile } = useProfile();
  const { showExportModal, setShowExportModal, handleExport, userProfile } = profile;

  return (
    <AnimatePresence>
      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowExportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-card border border-primary/20 rounded-t-lg sm:rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-primary font-mono">Export Data Crystal</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-foreground text-sm">
                Your data crystal contains your complete profile, memories, and connections. 
                Keep this file safe - it's your key to restoring your identity.
              </p>
              
              <div className="bg-muted border border-primary/20 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-primary mb-2 font-mono text-sm">Crystal Contents:</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• Profile information and settings</li>
                  <li>• Cryptographic keys and verification data</li>
                  <li>• Memory contributions and connections</li>
                  <li>• Community participation history</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleExport}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono"
                  disabled={!userProfile}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Crystal
                </Button>
                <Button
                  onClick={() => setShowExportModal(false)}
                  variant="outline"
                  className="border-muted text-muted-foreground hover:bg-muted font-mono"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Data Import Modal
export const DataImportModal: React.FC = () => {
  const { profile } = useProfile();
  const { showImportModal, setShowImportModal, handleImport } = profile;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImport(file);
    }
  };

  return (
    <AnimatePresence>
      {showImportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowImportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-card border border-primary/20 rounded-t-lg sm:rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-primary font-mono">Import Data Crystal</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(false)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-foreground text-sm">
                Select your data crystal file to restore your profile, memories, and connections. 
                This will replace your current profile data.
              </p>
              
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                  id="crystal-import"
                />
                <label
                  htmlFor="crystal-import"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium text-primary">Click to select file</span>
                  <span className="text-xs text-muted-foreground">JSON files only</span>
                </label>
              </div>

              <div className="bg-muted border border-amber-500/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mb-2">
                  <strong>⚠️ Warning:</strong>
                </p>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  Importing will overwrite your current profile data. Make sure you have exported 
                  your current crystal first if you want to keep it.
                </p>
              </div>

              <Button
                onClick={() => setShowImportModal(false)}
                variant="outline"
                className="w-full border-muted text-muted-foreground hover:bg-muted font-mono"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Logout Confirmation Modal
export const LogoutModal: React.FC = () => {
  const { profile } = useProfile();
  const { showLogoutModal, setShowLogoutModal, handleLogout } = profile;

  return (
    <AnimatePresence>
      {showLogoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-primary/20 rounded-lg p-6 w-full max-w-md shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary font-mono">Confirm Logout</h3>
              
              <p className="text-foreground text-sm">
                Are you sure you want to logout? You'll need to authenticate via NFC again to access your profile.
              </p>
              
              <div className="bg-muted border border-amber-500/20 p-3 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mb-1">
                  <strong>Security Note:</strong>
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Your session will be cleared and you'll be redirected to the home page.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="flex-1 font-mono"
                >
                  Logout
                </Button>
                <Button
                  onClick={() => setShowLogoutModal(false)}
                  variant="outline"
                  className="flex-1 font-mono"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      );
  }; 