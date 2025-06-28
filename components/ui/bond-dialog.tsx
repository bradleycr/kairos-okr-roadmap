'use client'

/**
 * 🤝 Bond Dialog Component
 * 
 * Shows when a different NFC chip is tapped and PIN is verified
 * Allows users to create bonds/relationships
 */

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  HeartIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  HandshakeIcon,
  UserPlusIcon,
  X,
  CheckCircleIcon,
  LoaderIcon,
  ShieldIcon,
  ZapIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BondDialogProps {
  isOpen: boolean
  onClose: () => void
  currentUser: {
    chipUID: string
    displayName: string
  }
  newUser: {
    chipUID: string
    displayName: string
  }
  onBondCreate: (bondType: string, note?: string) => Promise<boolean>
}

export function BondDialog({ 
  isOpen, 
  onClose, 
  currentUser, 
  newUser, 
  onBondCreate 
}: BondDialogProps) {
  const [selectedBondType, setSelectedBondType] = useState<string>('friend')
  const [note, setNote] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const bondTypes = [
    {
      id: 'friend',
      label: 'Connection',
      description: 'Create a meaningful connection',
      icon: HandshakeIcon,
      emoji: '🤝'
    }
  ]

  const handleCreateBond = async () => {
    setIsCreating(true)
    
    try {
      const success = await onBondCreate(selectedBondType, note)
      
      if (success) {
        setShowSuccess(true)
        
        // Show success message for 2 seconds then close
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to create bond:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            {showSuccess ? (
              <Card className="bg-card border border-primary/20 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircleIcon className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-primary mb-2 font-mono">
                    Bond Created! 🎉
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    You're now connected with <span className="font-medium">{newUser.displayName}</span>. 
                    This bond will appear in both of your profiles.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary font-mono">
                      <UserPlusIcon className="w-5 h-5" />
                      Create Bond
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      disabled={isCreating}
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Connect with <span className="font-medium text-foreground">{newUser.displayName}</span> and 
                    create a meaningful bond that will be remembered by both of your profiles.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Bond Type Selection */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      What type of bond is this?
                    </Label>
                    <RadioGroup
                      value={selectedBondType}
                      onValueChange={setSelectedBondType}
                      className="space-y-3"
                    >
                      {bondTypes.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <div key={type.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={type.id} id={type.id} />
                            <Label
                              htmlFor={type.id}
                              className="flex items-center gap-3 cursor-pointer flex-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{type.emoji}</span>
                                <IconComponent className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <Label htmlFor="note" className="text-sm font-medium text-foreground mb-2 block">
                      Add a note (optional)
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="How did you meet? What makes this connection special?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={200}
                    />
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {note.length}/200
                    </div>
                  </div>

                  {/* Connection Preview */}
                  <div className="bg-muted/30 border border-muted rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">BOND PREVIEW</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {currentUser.displayName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {bondTypes.find(t => t.id === selectedBondType)?.emoji}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {newUser.displayName}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {bondTypes.find(t => t.id === selectedBondType)?.label}
                      </Badge>
                    </div>
                    {note && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{note}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={isCreating}
                      className="flex-1 font-mono"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBond}
                      disabled={isCreating}
                      className="flex-1 font-mono"
                    >
                      {isCreating ? (
                        <>
                          <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-4 h-4 mr-2" />
                          Create Bond
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 