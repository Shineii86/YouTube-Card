/**
 * YouTube Card
 * A lightweight and efficient web scraping utility designed to generate
 * clean, dynamic preview cards for YouTube channels.
 *
 * Repository: https://github.com/Shineii86/YouTube-Card
 *
 * This server-side utility scrapes information from YouTube's public channel
 * pages to extract channel metadata including name, avatar, subscriber count,
 * description, and verification status.
 *
 * Author: Shinei Nouzen
 *
 * Copyright (c) 2026 Shinei Nouzen
 *
 * Released under the MIT License.
 * You are free to use, modify, and distribute this software in accordance
 * with the terms of the license.
 */

import { YouTubeScrapeError, ChannelNotFoundError } from './errors';
import { SourceType } from '@/types/enums';
import { get, set } from './cache';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface ScrapeResult {
    type: SourceType;
    title: string;
    username: string;
    description: string | null;
    image: string;
    extra: string | null;
    videoCount: string | null;
    isVerified: boolean;
}

function extractMetaContent(html: string, property: string): string | null {
    // Try property attribute first (og:tags)
    const propRegex = new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, 'i');
    let match = html.match(propRegex);
    if (match) return match[1];

    // Try name attribute
    const nameRegex = new RegExp(`<meta[^>]*name="${property}"[^>]*content="([^"]*)"`, 'i');
    match = html.match(nameRegex);
    if (match) return match[1];

    // Try reversed attribute order (content before property/name)
    const reverseRegex = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${property}"`, 'i');
    match = html.match(reverseRegex);
    if (match) return match[1];

    const reverseNameRegex = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name="${property}"`, 'i');
    match = html.match(reverseNameRegex);
    if (match) return match[1];

    return null;
}

function extractSubscriberCount(html: string): string | null {
    // Try to extract from ytInitialData JSON
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (ytDataMatch) {
        try {
            const data = JSON.parse(ytDataMatch[1]);
            // Navigate the nested structure to find subscriber count
            const header = data?.header?.c4TabbedHeaderRenderer ||
                          data?.header?.pageHeaderRenderer;

            if (header) {
                // c4TabbedHeaderRenderer path
                const subscriberText = header?.subscriberCountText?.simpleText ||
                                      header?.subscriberCountText?.runs?.[0]?.text;
                if (subscriberText) return subscriberText;

                // pageHeaderRenderer path (newer layout)
                const metadata = header?.content?.pageHeaderViewModel?.metadata?.channelMetadataViewModel;
                if (metadata?.subscriberCountTextWithRuns?.runs) {
                    return metadata.subscriberCountTextWithRuns.runs.map((r: { text: string }) => r.text).join('');
                }
            }

            // Alternative: search in metadata section
            const metadataObj = data?.metadata?.channelMetadataRenderer;
            if (metadataObj?.subscriberCount?.simpleText) {
                return metadataObj.subscriberCount.simpleText;
            }

            // Deep search for subscriber count text
            const headerText = data?.header?.c4TabbedHeaderRenderer?.subscriberCountText;
            if (headerText?.simpleText) return headerText.simpleText;
            if (headerText?.runs) return headerText.runs.map((r: { text: string }) => r.text).join('');
        } catch {
            // JSON parse failed, continue with other methods
        }
    }

    // Fallback: try to find subscriber count in raw HTML patterns
    const subPatterns = [
        /"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/,
        /"subscriberCountText":\s*\{[^}]*"runs":\s*\[\{[^}]*"text":\s*"([^"]+)"/,
        /(\d+[\d,.]*[KkMmBb]?)\s*subscribers/i,
    ];

    for (const pattern of subPatterns) {
        const match = html.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function extractVideoCount(html: string): string | null {
    // Try from ytInitialData JSON
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (ytDataMatch) {
        try {
            const data = JSON.parse(ytDataMatch[1]);

            // c4TabbedHeaderRenderer path - tabs contain video count
            const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
            if (tabs) {
                for (const tab of tabs) {
                    const tabRenderer = tab?.tabRenderer;
                    if (tabRenderer?.title === 'Videos' || tabRenderer?.selected) {
                        const content = tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.header?.gridHeaderRenderer?.title?.runs?.[0]?.text;
                        if (content && /\d/.test(content)) return content;
                    }
                }
            }

            // Try header metadata
            const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
            if (header) {
                // Look for video count in tabs
                const headerTabs = header?.tabs;
                if (headerTabs) {
                    for (const tab of headerTabs) {
                        const tabRenderer = tab?.tabRenderer;
                        if (tabRenderer?.title?.includes('Videos')) {
                            // Sometimes the tab itself has a count
                        }
                    }
                }
            }

            // Try metadata section
            const metadataObj = data?.metadata?.channelMetadataRenderer;
            if (metadataObj?.vanityChannelUrl) {
                // We have metadata but not video count directly
            }

        } catch {
            // JSON parse failed
        }
    }

    // Try from meta description - YouTube often has "X videos" in description
    const desc = extractMetaContent(html, 'description');
    if (desc) {
        const videoMatch = desc.match(/([\d,.]+[KkMmBb]?)\s*videos?\b/i);
        if (videoMatch) return `${videoMatch[1]} videos`;
    }

    // Try og:description
    const ogDesc = extractMetaContent(html, 'og:description');
    if (ogDesc) {
        const videoMatch = ogDesc.match(/([\d,.]+[KkMmBb]?)\s*videos?\b/i);
        if (videoMatch) return `${videoMatch[1]} videos`;
    }

    // Try raw HTML patterns
    const patterns = [
        /"videoCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/,
        /"videoCountText"\s*:\s*\{[^}]*"runs"\s*:\s*\[\{[^}]*"text"\s*:\s*"([^"]+)"/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function extractDescription(html: string): string | null {
    // Try og:description
    const ogDesc = extractMetaContent(html, 'og:description');
    if (ogDesc) return ogDesc;

    // Try from ytInitialData
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (ytDataMatch) {
        try {
            const data = JSON.parse(ytDataMatch[1]);
            const desc = data?.metadata?.channelMetadataRenderer?.description;
            if (desc) return desc;
        } catch {
            // Ignore parse errors
        }
    }

    return null;
}

function extractVerifiedStatus(html: string): boolean {
    // Check for verified badge indicators in the HTML
    // YouTube uses various indicators for verification
    return html.includes('"isVerified":true') ||
           html.includes('"badges":[{"metadataBadgeRenderer"') ||
           html.includes('verified') && html.includes('checkmark') ||
           html.includes('"style":"BADGE_STYLE_TYPE_VERIFIED"');
}

function extractChannelImage(html: string): string | null {
    // Try og:image first
    const ogImage = extractMetaContent(html, 'og:image');
    if (ogImage && ogImage.includes('yt')) return ogImage;

    // Try from ytInitialData
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (ytDataMatch) {
        try {
            const data = JSON.parse(ytDataMatch[1]);
            const avatar = data?.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url ||
                          data?.header?.c4TabbedHeaderRenderer?.avatar?.thumbnails?.[0]?.url ||
                          data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url;
            if (avatar) return avatar;
        } catch {
            // Ignore parse errors
        }
    }

    return ogImage || null;
}

async function fetchYouTubePage(username: string): Promise<string> {
    // Support both @username and plain username formats
    const channelUrl = username.startsWith('@')
        ? `https://www.youtube.com/${username}`
        : `https://www.youtube.com/@${username}`;

    const response = await fetch(channelUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new ChannelNotFoundError(username);
        }
        throw new YouTubeScrapeError(`Failed to fetch data for @${username}. Status: ${response.status}`);
    }

    return response.text();
}

function extractTitle(html: string): string | null {
    // Try og:title
    const ogTitle = extractMetaContent(html, 'og:title');
    if (ogTitle) return ogTitle;

    // Try from ytInitialData
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (ytDataMatch) {
        try {
            const data = JSON.parse(ytDataMatch[1]);
            const title = data?.metadata?.channelMetadataRenderer?.title ||
                         data?.header?.c4TabbedHeaderRenderer?.title ||
                         data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content;
            if (title) return title;
        } catch {
            // Ignore
        }
    }

    // Fallback to <title> tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
        return titleMatch[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
    }

    return null;
}

async function scrapeAndCache(username: string): Promise<ScrapeResult> {
    try {
        const cleanUsername = username.replace(/^@/, '');
        const html = await fetchYouTubePage(cleanUsername);

        const title = extractTitle(html);
        const image = extractChannelImage(html);
        const description = extractDescription(html);
        const subscriberCount = extractSubscriberCount(html);
        const videoCount = extractVideoCount(html);
        const isVerified = extractVerifiedStatus(html);

        if (!title) {
            throw new YouTubeScrapeError('Could not parse essential data from the YouTube page.');
        }

        // Build extra: "1.2M subscribers · 500 videos"
        const extraParts = [subscriberCount, videoCount].filter(Boolean);
        const extra = extraParts.length > 0 ? extraParts.join(' · ') : null;

        const result: ScrapeResult = {
            type: isVerified ? SourceType.VerifiedChannel : SourceType.Channel,
            title,
            username: cleanUsername,
            description,
            image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=FF0000&color=fff&size=256`,
            extra,
            videoCount: videoCount || null,
            isVerified,
        };

        set(username, result, CACHE_TTL);
        return result;
    } catch (error) {
        if (error instanceof YouTubeScrapeError) {
            throw error;
        }
        throw new YouTubeScrapeError(`An unexpected error occurred while scraping @${username}.`);
    }
}

export default async function scrapeYouTube(username: string): Promise<ScrapeResult> {
    const cachedResult = get<ScrapeResult>(username);
    if (cachedResult) {
        return cachedResult;
    }
    return scrapeAndCache(username);
}
