import React from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Database } from 'lucide-react';

const DailyStats = () => {
  const { dailyEmailCount, lastClearTime } = useData();

  return (
    <Card className="bg-netflix-darkgray border-netflix-gray">
      <CardHeader>
        <CardTitle className="text-netflix-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-netflix-red" />
          Today's Email Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-netflix-red" />
            <div>
              <p className="text-sm text-gray-400">Total Emails Today</p>
              <p className="text-lg font-semibold text-netflix-white">{dailyEmailCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-netflix-red" />
            <div>
              <p className="text-sm text-gray-400">Last Clear</p>
              <p className="text-lg font-semibold text-netflix-white">
                {lastClearTime 
                  ? lastClearTime.toLocaleTimeString() 
                  : "Never"}
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Emails are automatically cleared after 24 hours. New emails are continuously synced and stored in your browser.
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyStats; 