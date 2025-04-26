import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Database, RefreshCw, Clock } from 'lucide-react';

const AdminSettings = () => {
  const { 
    autoRefreshInterval, 
    updateAutoRefreshInterval,
    autoRefreshEnabled,
    toggleAutoRefresh
  } = useData();
  
  const [intervalInput, setIntervalInput] = useState(autoRefreshInterval.toString());
  const [todayStats, setTodayStats] = useState({
    totalEmails: 0,
    lastFetchTime: null as Date | null
  });

  useEffect(() => {
    // Load today's email statistics from localStorage
    const loadTodayStats = () => {
      const stats = localStorage.getItem('emailStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        const today = new Date().toDateString();
        if (parsedStats.date === today) {
          setTodayStats({
            totalEmails: parsedStats.totalEmails,
            lastFetchTime: parsedStats.lastFetchTime ? new Date(parsedStats.lastFetchTime) : null
          });
        }
      }
    };

    loadTodayStats();
  }, []);

  const handleIntervalUpdate = async () => {
    const newInterval = parseInt(intervalInput);
    if (isNaN(newInterval) || newInterval < 5) {
      toast({
        title: "Invalid interval",
        description: "Please enter a number greater than or equal to 5 seconds.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateAutoRefreshInterval(newInterval);
      toast({
        title: "Interval updated",
        description: `Auto-fetch interval set to ${newInterval} seconds.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update auto-fetch interval.",
        variant: "destructive"
      });
    }
  };

  const handleToggleAutoFetch = async () => {
    try {
      await toggleAutoRefresh(!autoRefreshEnabled);
      toast({
        title: autoRefreshEnabled ? "Auto-fetch disabled" : "Auto-fetch enabled",
        description: autoRefreshEnabled 
          ? "Emails will no longer be fetched automatically." 
          : "Emails will be fetched automatically.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle auto-fetch.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-netflix-darkgray p-6 rounded-lg mb-8">
      <h2 className="text-xl font-semibold mb-4 text-netflix-white">Admin Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auto-fetch Interval (seconds)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
                min="5"
                className="max-w-[200px]"
              />
              <Button onClick={handleIntervalUpdate}>
                Update
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleToggleAutoFetch}
            variant={autoRefreshEnabled ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {autoRefreshEnabled ? "Disable Auto-fetch" : "Enable Auto-fetch"}
          </Button>
        </div>

        <div className="bg-netflix-gray p-4 rounded-lg">
          <h3 className="text-lg font-medium text-netflix-white mb-3">Today's Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-netflix-red" />
              <div>
                <p className="text-sm text-gray-400">Total Emails Today</p>
                <p className="text-lg font-semibold text-netflix-white">{todayStats.totalEmails}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-netflix-red" />
              <div>
                <p className="text-sm text-gray-400">Last Fetch</p>
                <p className="text-lg font-semibold text-netflix-white">
                  {todayStats.lastFetchTime 
                    ? todayStats.lastFetchTime.toLocaleTimeString() 
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 