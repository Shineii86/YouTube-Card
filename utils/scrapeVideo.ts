/**
 * YouTube Card
 * Repository: https://github.com/Shineii86/YouTube-Card
 *
 * Scrapes information from YouTube's public video pages to extract
 * video metadata including title, thumbnail, channel name, view count,
 * and like count.
 *
 * Author: Shinei Nouzen
 * Copyright (c) 2026 Shinei Nouzen
 * Released under the MIT License.
 */

import { YouTubeScrapeError, VideoNotFoundError } from './errors';
import { get, set } from './cache';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface VideoResult {
    videoId: string;
    title: string;
    channelName: string;
    channelId: string | null;
    thumbnail: string;
    viewCount: string | null;
    likeCount: string | null;
    publishDate: string | null;
    description: string | null;
}

function extractMetaContent(html: string, property: string): string | null {
    const propRegex = new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, 'i');
    let match = html.match(propRegex);
    if (match) return match[1];

    const nameRegex = new RegExp(`<meta[^>]*name="${property}"[^>]*content="([^"]*)"`, 'i');
    match = html.match(nameRegex);
    if (match) return match[1];

    const reverseRegex = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${property}"`, 'i');
    match = html.match(reverseRegex);
    if (match) return match[1];

    const reverseNameRegex = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name="${property}"`, 'i');
    match = html.match(reverseNameRegex);
    if (match) return match[1];

    return null;
}

function extractVideoTitle(html: string): string | null {
    const ogTitle = extractMetaContent(html, 'og:title');
    if (ogTitle) return ogTitle;

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
        return titleMatch[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
    }
    return null;
}

function extractChannelName(html: string): string | null {
    // Try from ytInitialData / ytInitialPlayerResponse
    const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (playerMatch) {
        try {
            const data = JSON.parse(playerMatch[1]);
            const author = data?.videoDetails?.author;
            if (author) return author;
        } catch { /* ignore */ }
    }

    // Try itemprop
    const itempropMatch = html.match(/itemprop="author"[^>]*content="([^"]+)"/);
    if (itempropMatch) return itempropMatch[1];

    // Try og:video:tag or link channel
    const channelMatch = html.match(/"ownerChannelName"\s*:\s*"([^"]+)"/);
    if (channelMatch) return channelMatch[1];

    // Try from structured data
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (ldMatch) {
        try {
            const data = JSON.parse(ldMatch[1]);
            if (data?.author?.name) return data.author.name;
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item?.author?.name) return item.author.name;
                }
            }
        } catch { /* ignore */ }
    }

    return null;
}

function extractChannelId(html: string): string | null {
    const match = html.match(/"channelId"\s*:\s*"([^"]+)"/);
    return match ? match[1] : null;
}

function extractViewCount(html: string): string | null {
    // Try from ytInitialPlayerResponse
    const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (playerMatch) {
        try {
            const data = JSON.parse(playerMatch[1]);
            const views = data?.videoDetails?.viewCount;
            if (views) {
                const num = parseInt(views);
                if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
                if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
                if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
                return `${num} views`;
            }
        } catch { /* ignore */ }
    }

    // Try from meta description ("X views")
    const desc = extractMetaContent(html, 'description');
    if (desc) {
        const viewMatch = desc.match(/([\d,.]+[KkMmBb]?)\s*views/i);
        if (viewMatch) return `${viewMatch[1]} views`;
    }

    // Try structured data
    const viewMatch = html.match(/"viewCount"\s*:\s*"(\d+)"/);
    if (viewMatch) {
        const num = parseInt(viewMatch[1]);
        if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
        return `${num} views`;
    }

    return null;
}

function extractLikeCount(html: string): string | null {
    // Try from ytInitialData - likes are in the video actions
    const dataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (dataMatch) {
        try {
            const data = JSON.parse(dataMatch[1]);
            // Navigate to like button text
            const contents = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
            if (contents) {
                for (const item of contents) {
                    const segmented = item?.videoPrimaryInfoRenderer?.videoActions?.menuRenderer?.topLevelButtons;
                    if (segmented) {
                        for (const btn of segmented) {
                            const toggleBtn = btn?.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel;
                            if (toggleBtn?.title) {
                                const likes = toggleBtn.title;
                                if (likes && likes !== 'Like') return `${likes} likes`;
                            }
                            // Alternative path
                            const likeBtn = btn?.toggleButtonRenderer;
                            if (likeBtn?.defaultText?.simpleText) {
                                const likes = likeBtn.defaultText.simpleText;
                                if (likes && likes !== 'Like') return `${likes} likes`;
                            }
                        }
                    }
                }
            }
        } catch { /* ignore */ }
    }

    return null;
}

function extractPublishDate(html: string): string | null {
    // Try from ytInitialPlayerResponse
    const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (playerMatch) {
        try {
            const data = JSON.parse(playerMatch[1]);
            const date = data?.microformat?.playerMicroformatRenderer?.publishDate ||
                        data?.microformat?.playerMicroformatRenderer?.uploadDate;
            if (date) return date;
        } catch { /* ignore */ }
    }

    // Try itemprop
    const dateMatch = html.match(/itemprop="datePublished"[^>]*content="([^"]+)"/);
    if (dateMatch) return dateMatch[1];

    // Try from meta
    const metaDate = extractMetaContent(html, 'publish_date') || extractMetaContent(html, 'video:release_date');
    if (metaDate) return metaDate;

    return null;
}

function extractDescription(html: string): string | null {
    const ogDesc = extractMetaContent(html, 'og:description');
    if (ogDesc) return ogDesc;

    const metaDesc = extractMetaContent(html, 'description');
    if (metaDesc) return metaDesc;

    return null;
}

function extractThumbnail(videoId: string, html: string): string {
    // Try og:image first
    const ogImage = extractMetaContent(html, 'og:image');
    if (ogImage) return ogImage;

    // Fallback to YouTube standard thumbnail
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

async function fetchVideoPage(videoId: string): Promise<string> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new VideoNotFoundError(videoId);
        }
        throw new YouTubeScrapeError(`Failed to fetch video ${videoId}. Status: ${response.status}`);
    }

    return response.text();
}

async function scrapeAndCache(videoId: string): Promise<VideoResult> {
    try {
        const html = await fetchVideoPage(videoId);

        const title = extractVideoTitle(html);
        const channelName = extractChannelName(html);
        const thumbnail = extractThumbnail(videoId, html);
        const viewCount = extractViewCount(html);
        const likeCount = extractLikeCount(html);
        const publishDate = extractPublishDate(html);
        const description = extractDescription(html);
        const channelId = extractChannelId(html);

        if (!title) {
            throw new YouTubeScrapeError('Could not parse essential data from the YouTube video page.');
        }

        const result: VideoResult = {
            videoId,
            title,
            channelName: channelName || 'Unknown Channel',
            channelId,
            thumbnail,
            viewCount,
            likeCount,
            publishDate,
            description,
        };

        set(`video:${videoId}`, result, CACHE_TTL);
        return result;
    } catch (error) {
        if (error instanceof YouTubeScrapeError) {
            throw error;
        }
        throw new YouTubeScrapeError(`An unexpected error occurred while scraping video ${videoId}.`);
    }
}

export default async function scrapeVideo(videoId: string): Promise<VideoResult> {
    const cachedResult = get<VideoResult>(`video:${videoId}`);
    if (cachedResult) {
        return cachedResult;
    }
    return scrapeAndCache(videoId);
}
