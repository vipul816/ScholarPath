import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Transcode video to HLS format with multiple quality levels
 * Generates .m3u8 playlist and .ts segments
 * @param {string} inputPath - Path to input video file
 * @param {string} outputDir - Directory to store HLS output
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} - Returns HLS metadata
 */
export const transcodeToHLS = async (inputPath, outputDir, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');

      // Quality levels for HLS transcoding
      const qualities = [
        { name: '360p', width: 640, height: 360, bitrate: '800k', maxrate: '856k', bufsize: '1200k' },
        { name: '480p', width: 854, height: 480, bitrate: '1500k', maxrate: '1610k', bufsize: '2400k' },
        { name: '720p', width: 1280, height: 720, bitrate: '2500k', maxrate: '2687k', bufsize: '4000k' },
        { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', maxrate: '5350k', bufsize: '8000k' }
      ];

      // Step 1: Generate thumbnail
      ffmpeg(inputPath)
        .screenshot({
          timestamps: ['5%'],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '320x180'
        })
        .on('error', (err) => {
          console.warn('Thumbnail generation warning:', err.message);
          // Don't fail if thumbnail generation fails
        });

      // Step 2: Get video duration first
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          return reject(new Error(`FFprobe error: ${err.message}`));
        }

        const duration = metadata.format.duration;
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        let completedQualities = 0;
        const qualityPaths = {};

        // Step 3: Transcode to each quality level
        qualities.forEach((quality) => {
          const qualityDir = path.join(outputDir, quality.name);
          if (!fs.existsSync(qualityDir)) {
            fs.mkdirSync(qualityDir, { recursive: true });
          }

          const outputPath = path.join(qualityDir, 'segment_%03d.ts');

          ffmpeg(inputPath)
            .size(quality.width + 'x' + quality.height)
            .videoBitrate(quality.bitrate)
            .maxrate(quality.maxrate)
            .bufsize(quality.bufsize)
            .audioCodec('aac')
            .audioBitrate('128k')
            .audioChannels(2)
            .audioFrequency(48000)
            .outputOptions([
              '-hls_time 10',
              '-hls_segment_type mpegts',
              '-hls_playlist_type vod',
              '-hls_list_size 0',
              `-f hls`
            ])
            .output(path.join(qualityDir, 'index.m3u8'))
            .on('progress', (progress) => {
              const percent = (progress.timemark.split(':').reduce((acc, time) => (60 * acc) + +time) / duration) * 100;
              if (onProgress) {
                onProgress({
                  quality: quality.name,
                  percent: Math.min(percent, 100),
                  overall: Math.floor((completedQualities + percent / 100) / qualities.length * 100)
                });
              }
            })
            .on('end', () => {
              console.log(`✅ Transcoding completed for ${quality.name}`);
              qualityPaths[quality.name] = path.join(quality.name, 'index.m3u8');
              completedQualities++;

              // When all qualities are done, create master playlist
              if (completedQualities === qualities.length) {
                createMasterPlaylist(outputDir, qualityPaths, duration, duration);
                resolve({
                  success: true,
                  playlistUrl: 'playlist.m3u8',
                  masterPlaylistPath: playlistPath,
                  qualities: Object.keys(qualityPaths),
                  duration: duration,
                  thumbnail: 'thumbnail.jpg'
                });
              }
            })
            .on('error', (err) => {
              reject(new Error(`Transcoding error for ${quality.name}: ${err.message}`));
            })
            .run();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Create HLS master playlist that references all quality levels
 * @param {string} outputDir - Output directory
 * @param {Object} qualityPaths - Object with quality -> path mapping
 * @param {number} duration - Video duration
 */
const createMasterPlaylist = (outputDir, qualityPaths, duration) => {
  const bandwidths = {
    '360p': 856000,
    '480p': 1610000,
    '720p': 2687000,
    '1080p': 5350000
  };

  const resolutions = {
    '360p': '640x360',
    '480p': '854x480',
    '720p': '1280x720',
    '1080p': '1920x1080'
  };

  const qualities = ['360p', '480p', '720p', '1080p'];
  let playlistContent = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:11\n\n';

  // Sort by bandwidth and add quality variants
  qualities.forEach((quality) => {
    if (qualityPaths[quality]) {
      playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidths[quality]},RESOLUTION=${resolutions[quality]}\n`;
      playlistContent += `${qualityPaths[quality]}\n`;
    }
  });

  const playlistPath = path.join(outputDir, 'playlist.m3u8');
  fs.writeFileSync(playlistPath, playlistContent);
  console.log(`✅ Master playlist created: ${playlistPath}`);
};

/**
 * Extract video metadata (duration, resolution, etc.)
 * @param {string} filePath - Path to video file
 * @returns {Promise<Object>}
 */
export const getVideoMetadata = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        videoCodec: videoStream?.codec_name,
        videoWidth: videoStream?.width,
        videoHeight: videoStream?.height,
        audioCodec: audioStream?.codec_name,
        audioSampleRate: audioStream?.sample_rate
      });
    });
  });
};

/**
 * Generate video thumbnail at specific time
 * @param {string} inputPath - Path to video file
 * @param {string} outputPath - Where to save thumbnail
 * @param {string} timeOffset - Time offset (e.g., '5%' or '00:00:05')
 * @returns {Promise<void>}
 */
export const generateThumbnail = async (inputPath, outputPath, timeOffset = '5%') => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshot({
        timestamps: [timeOffset],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '320x180'
      })
      .on('end', () => resolve())
      .on('error', reject);
  });
};

export default {
  transcodeToHLS,
  getVideoMetadata,
  generateThumbnail
};
