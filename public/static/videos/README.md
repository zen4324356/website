# Background Videos

This application supports multiple ways to add background videos to the login page. All videos automatically play in a continuous loop.

## Options for Adding Background Videos

### 1. Using the Admin Dashboard (Recommended)

The easiest way to manage background videos is through the Admin Dashboard:

1. Go to Admin Dashboard > Background Videos
2. You can:
   - Upload video files directly (limited to 100MB)
   - Add links to externally hosted videos
   - Preview videos before adding them
   - Activate/deactivate videos
   - Delete videos when no longer needed

### 2. Adding a Static Fallback Video

If the Supabase storage is unavailable or you prefer a local file:

1. Add an MP4 video file to this folder named `default-bg.mp4`
2. The video will be used automatically if no video is set active in the admin panel or if there are issues loading videos from the storage bucket

### 3. Using Direct Video Links

You can add videos hosted on other platforms without uploading them:

1. The video must be directly accessible via URL (direct link to MP4 file)
2. The video should be publicly accessible
3. Common sources include CDNs, cloud storage services, or media hosting platforms
4. Example URL format: `https://example.com/videos/my-video.mp4`

## Video Requirements

- Format: MP4 is recommended
- Size: Keep under 10MB for optimal performance
- Resolution: 1920x1080 or 1280x720 recommended
- Duration: 10-30 seconds looping video works best
- Aspect ratio: 16:9 is ideal

## Example Sources for Free Videos

- [Pexels](https://www.pexels.com/videos/)
- [Pixabay](https://pixabay.com/videos/)
- [Videvo](https://www.videvo.net/)
- [Coverr](https://coverr.co/) 