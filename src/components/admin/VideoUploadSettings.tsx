import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const VideoUploadSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Background Video Settings
          </CardTitle>
          <CardDescription>
            This system is now using the default static video file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-md mb-4">
              <h4 className="font-medium text-blue-400 mb-1">Current Configuration:</h4>
              <p className="text-sm mb-3">
                The system is currently configured to use a static video file from the public folder.
              </p>
              <div className="bg-gray-900 p-3 rounded text-sm font-mono">
                <span className="text-green-400">Path: </span>
                <span className="text-white">./static/videos/default-bg.mp4</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-md mb-4">
              <h4 className="font-medium text-yellow-400 mb-2">Instructions:</h4>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>
                  <span className="font-medium">To change the video:</span> Replace the file at <code className="bg-black/50 px-1 py-0.5 rounded text-yellow-400">public/static/videos/default-bg.mp4</code> with your desired video.
                </li>
                <li>
                  <span className="font-medium">Format requirements:</span> MP4 format, optimized for web (recommended: under 10MB), 16:9 aspect ratio.
                </li>
                <li>
                  <span className="font-medium">To disable the video:</span> Remove or rename the file and refresh the page to fall back to the gradient background.
                </li>
              </ul>
            </div>

            <div className="p-4 bg-green-900/20 border border-green-900/30 rounded-md">
              <h4 className="font-medium text-green-400 mb-2">Benefits of Static Video:</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Faster loading - no database queries or API calls</li>
                <li>More reliable - works even if database connection is lost</li>
                <li>Simpler management - just replace the file to update</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Background Video Preview</CardTitle>
          <CardDescription>
            Preview of the default static video that plays on the login page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden bg-gray-900">
            <video 
              src="./static/videos/default-bg.mp4" 
              controls
              className="w-full max-h-[300px]"
              loop
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                target.parentElement!.innerHTML = `
                  <div class="flex items-center justify-center h-[200px] text-red-400">
                    <div class="text-center">
                      <div class="text-xl">⚠️</div>
                      <div>Video not found or cannot be played</div>
                      <div class="text-sm mt-2">Check that the file exists at public/static/videos/default-bg.mp4</div>
                    </div>
                  </div>
                `;
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoUploadSettings; 