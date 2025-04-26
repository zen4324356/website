import React, { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  fallbackColor?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  fallbackColor = 'from-black to-gray-900'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Set up video playback when component mounts
    const videoElement = videoRef.current;
    if (videoElement) {
      // Directly set src to have more control
      videoElement.src = '/static/videos/default-bg.mp4';
      
      // Add event listeners for better debugging
      videoElement.addEventListener('error', (e) => {
        console.error('Video error:', e);
        // Show fallback background if video fails
        videoElement.style.display = 'none';
        document.querySelector('.fallback-bg')?.classList.remove('hidden');
      });
      
      // Force play when loaded
      videoElement.addEventListener('loadeddata', () => {
        videoElement.play().catch(err => {
          console.error('Failed to play video:', err);
          // Show fallback background if autoplay fails
          videoElement.style.display = 'none';
          document.querySelector('.fallback-bg')?.classList.remove('hidden');
        });
      });
    }
  }, []);

  return (
    <>
      {/* Fallback background that shows if video fails */}
      <div className={`absolute inset-0 bg-gradient-to-b ${fallbackColor} -z-10 hidden fallback-bg`}></div>
      
      {/* Video background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <video
          ref={videoRef}
          className="absolute h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </>
  );
};

export default VideoBackground; 