import React, { useState, useEffect } from 'react';
import { Email } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, Archive, Flag, MoreVertical, Reply, Forward, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailViewProps {
  emails: Email[];
  onClose: () => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkImportant: (id: string) => void;
}

export const EmailView: React.FC<EmailViewProps> = ({
  emails,
  onClose,
  onRefresh,
  onDelete,
  onArchive,
  onMarkImportant,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentEmail = emails[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : emails.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < emails.length - 1 ? prev + 1 : 0));
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const cleanBody = (body: string) => {
    if (!body) return '';
    
    // Remove HTML tags and scripts
    let cleaned = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove non-printable characters and special symbols
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u00AD\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000\uFEFF]/g, '');
    
    // Remove specific unwanted characters
    cleaned = cleaned.replace(/Â/g, '');
    
    // Remove extra whitespace and normalize line breaks
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    // Remove any remaining special characters but keep basic punctuation
    cleaned = cleaned.replace(/[^\w\s.,!?-]/g, '');
    
    return cleaned;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed right-0 top-0 h-screen w-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-l-lg overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between p-4 border-b dark:border-gray-700"
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">Email Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className={cn(
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  isLoading && "animate-spin"
                )}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(currentEmail.id)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onArchive(currentEmail.id)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Archive className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMarkImportant(currentEmail.id)}
                className={cn(
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  currentEmail.isImportant && "text-yellow-500"
                )}
              >
                <Flag className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Email Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <motion.div
              key={currentEmail.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Email Header */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">{currentEmail.subject}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={currentEmail.isRead ? "default" : "secondary"}>
                      {currentEmail.isRead ? "Read" : "Unread"}
                    </Badge>
                    {currentEmail.isImportant && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Important
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">From:</span>
                    <span className="text-gray-900 dark:text-gray-100">{currentEmail.from}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(currentEmail.date)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">To:</span>
                  <span className="text-gray-900 dark:text-gray-100">{currentEmail.to}</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center space-x-4 py-4 border-y dark:border-gray-700"
              >
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Forward className="h-4 w-4" />
                  <span>Forward</span>
                </Button>
              </motion.div>

              {/* Email Body */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="prose dark:prose-invert max-w-none"
              >
                <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                  {cleanBody(currentEmail.body)}
                </div>
              </motion.div>

              {/* Email Footer */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center justify-center space-y-4 pt-4 border-t dark:border-gray-700"
              >
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={emails.length <= 1}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentIndex + 1} of {emails.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={emails.length <= 1}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 