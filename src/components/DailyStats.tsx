import React, { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Database, RotateCw } from 'lucide-react';

const DailyStats = () => {
  const { dailyEmailCount, lastClearTime, emails } = useData();
  const [lastEmailTime, setLastEmailTime] = useState<string>("Never");

  useEffect(() => {
    if (emails.length > 0) {
      const latestEmail = emails[0]; // Emails are already sorted by date
      setLastEmailTime(new Date(latestEmail.date).toLocaleTimeString());
    }
  }, [emails]);

  return (
    <Card className="bg-netflix-darkgray border-netflix-gray mb-4">
      <CardHeader>
        <CardTitle className="text-netflix-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-netflix-red" />
          Email Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
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
          <div className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-netflix-red" />
            <div>
              <p className="text-sm text-gray-400">Latest Email</p>
              <p className="text-lg font-semibold text-netflix-white">
                {lastEmailTime}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-400">
            • Emails are automatically cleared after 24 hours
          </p>
          <p className="text-sm text-gray-400">
            • New emails replace old ones from the same sender
          </p>
          <p className="text-sm text-gray-400">
            • Search shows the most recent emails first
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyStats; 