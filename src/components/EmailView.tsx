import React, { useState } from 'react';
import { Email } from '@/types';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Star, Reply, Forward, Archive, Trash2, MoreVertical } from 'lucide-react';

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
  const currentEmail = emails[currentIndex];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Clean the email body: remove <a> tags, all HTML, Â, and extra spaces
  const cleanBody = (body: string) => {
    if (!body) return '';
    let cleaned = body
      // Remove script/style tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove all <a> tags and their content
      .replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove non-printable characters and Â
      .replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u00AD\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000\uFEFFÂ]/g, '')
      // Remove extra spaces and line breaks
      .replace(/\s+/g, ' ').trim();
    return cleaned;
  };

  // Avatar letter (first letter of sender or N)
  const avatarLetter = currentEmail.from?.charAt(0)?.toUpperCase() || 'N';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed right-0 top-0 h-screen w-full md:w-1/2 bg-white shadow-lg rounded-l-lg overflow-y-auto z-50"
        style={{ maxWidth: 700 }}
      >
        <div className="flex flex-col min-h-screen bg-white">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100"><Archive className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100"><Trash2 className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100"><MoreVertical className="h-5 w-5" /></Button>
            </div>
          </div>

          {/* Email Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center py-8 px-4 bg-white"
          >
            <div className="w-full max-w-2xl bg-white rounded-xl p-4 md:p-8">
              {/* Sender and subject */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-2xl font-bold">
                    {avatarLetter}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg md:text-xl text-black">{currentEmail.from}</span>
                      <span className="text-gray-500 text-sm">{'<' + (currentEmail.from || 'unknown') + '>'}</span>
                      <Star className="h-4 w-4 text-yellow-400 ml-2" />
                    </div>
                    <div className="text-gray-500 text-sm">to {currentEmail.to}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end mt-4 md:mt-0">
                  <span className="text-xs text-gray-500">{formatDate(currentEmail.date)}</span>
                  <div className="flex space-x-2 mt-2">
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100"><Reply className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100"><Forward className="h-5 w-5" /></Button>
                  </div>
                </div>
              </div>
              {/* Subject */}
              <div className="py-4">
                <h1 className="text-2xl font-bold text-black">{currentEmail.subject}</h1>
              </div>
              {/* Email body */}
              <div className="pb-6">
                <pre className="whitespace-pre-wrap text-black text-base font-sans bg-white" style={{fontFamily: 'inherit'}}>
                  {cleanBody(currentEmail.body)}
                </pre>
              </div>
              {/* Centered action buttons */}
              <div className="flex justify-center space-x-4 border-t pt-4 pb-2">
                <Button variant="outline" size="sm" className="flex items-center space-x-2"><Reply className="h-4 w-4" /><span>Reply</span></Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2"><Forward className="h-4 w-4" /><span>Forward</span></Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2"><Archive className="h-4 w-4" /><span>Archive</span></Button>
              </div>
            </div>
            {/* Navigation */}
            <div className="flex justify-center items-center space-x-4 mt-6">
              <Button variant="outline" size="icon" onClick={() => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : emails.length - 1)} disabled={emails.length <= 1}><ChevronLeft className="h-5 w-5" /></Button>
              <span className="text-gray-500 text-sm">{currentIndex + 1} of {emails.length}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentIndex(currentIndex < emails.length - 1 ? currentIndex + 1 : 0)} disabled={emails.length <= 1}><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 