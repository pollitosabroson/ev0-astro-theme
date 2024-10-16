const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const youtube = google.youtube('v3');

const outputPath = path.join(__dirname, '..', 'src', 'config', 'youtube.json');

const fetchVideos = async (duration) => {
  const params = {
    key: API_KEY,
    channelId: CHANNEL_ID,
    order: 'date',
    part: 'snippet',
    maxResults: 5,
    type: 'video', // Add the type of result as video
    videoDuration: duration, // Video duration: short, medium, long
  };

  return new Promise((resolve, reject) => {
    youtube.search.list(params, (err, res) => {
      if (err) {
        return reject(err);
      }
      
      const videos = res.data.items.filter((item) => item.id.kind === 'youtube#video');
      const videoData = videos.map((video) => ({
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        videoId: video.id.videoId,
        thumbnails: video.snippet.thumbnails,
        publishedAt: video.snippet.publishedAt,
      }));
      
      resolve(videoData);
    });
  });
};

const main = async () => {
  try {
    // Fetch medium duration videos
    const mediumVideos = await fetchVideos('medium');
    
    // Fetch long duration videos
    const longVideos = await fetchVideos('long');
    
    // Combine results
    const allVideos = [...mediumVideos, ...longVideos];

    // Sort videos by published date (publishedAt)
    allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Save to file
    fs.writeFile(outputPath, JSON.stringify(allVideos, null, 2), (err) => {
      if (err) {
        console.error('Error saving data to the file:', err);
      } else {
        console.log('Data has been saved to youtube.json');
      }
    });
    
  } catch (error) {
    console.error('Error making the request:', error);
  }
};

main();
