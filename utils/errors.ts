/**
 * YouTube Card
 * Repository: https://github.com/Shineii86/YouTube-Card
 *
 * Custom error classes for YouTube scraping operations.
 *
 * Author: Shinei Nouzen
 * Copyright (c) 2026 Shinei Nouzen
 * Released under the MIT License.
 */

export class YouTubeScrapeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'YouTubeScrapeError';
    }
}

export class ChannelNotFoundError extends YouTubeScrapeError {
    constructor(username: string) {
        super(`YouTube channel "${username}" not found.`);
        this.name = 'ChannelNotFoundError';
    }
}

export class VideoNotFoundError extends YouTubeScrapeError {
    constructor(videoId: string) {
        super(`YouTube video "${videoId}" not found.`);
        this.name = 'VideoNotFoundError';
    }
}
