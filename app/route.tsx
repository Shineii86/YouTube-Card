/**
 * YouTube Card
 * Repository: https://github.com/Shineii86/YouTube-Card
 *
 * Generates beautiful, theme-aware preview cards for YouTube channels.
 *
 * Usage:
 *   Channel: /?username=YourChannel&theme=light|dark
 *
 * Author: Shinei Nouzen
 * Copyright (c) 2026 Shinei Nouzen
 * Released under the MIT License.
 */

import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og';
import scrapeYouTube from "@/utils/scrapeYouTube";
import { YouTubeScrapeError, ChannelNotFoundError } from '@/utils/errors';
import { readFileSync } from 'fs';
import { join } from 'path';

function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_@.-]/g, ' ');
}

function getThemeColors(searchParams: URLSearchParams, isDark: boolean) {
  return {
    cardBgColor: searchParams.get('bgColor') || (isDark ? 'rgba(42, 42, 42, 1)' : 'rgba(255, 255, 255, 1)'),
    textColor: searchParams.get('textColor') || (isDark ? '#ffffff' : '#0f0f0f'),
    subtleTextColor: searchParams.get('subtleTextColor') || (isDark ? '#AAAAAA' : '#606060'),
    extraColor: searchParams.get('extraColor') || (isDark ? '#FF4E45' : '#FF0000'),
    shadowColor: searchParams.get('shadowColor') || (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'),
    fontFamily: searchParams.get('fontFamily') || 'Inter, sans-serif',
  };
}

function makeHeaders() {
  const headers = new Headers();
  headers.set('Content-Type', 'image/png');
  headers.set('Cache-Control', 'public, max-age=7200');
  headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'");
  return headers;
}

// ─── Channel Card ────────────────────────────────────────────────────

function renderChannelCard(result: Awaited<ReturnType<typeof scrapeYouTube>>, theme: ReturnType<typeof getThemeColors>, isDark: boolean) {
  const { cardBgColor, textColor, subtleTextColor, extraColor, shadowColor, fontFamily } = theme;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          backgroundColor: cardBgColor, padding: '32px 40px', borderRadius: '24px',
          width: '600px', height: '180px', boxShadow: `0 12px 28px ${shadowColor}`,
          color: textColor, fontFamily, position: 'relative', overflow: 'hidden',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', width: 110, height: 110, marginRight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={result.image} alt={`${result.username} channel`} width={120} height={120} style={{ borderRadius: 9999, objectFit: 'cover' }} />
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: '380px' }}>
              <span style={{ fontSize: 30, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'Arial', letterSpacing: '-0.5px' }}>
                {result.title}
              </span>
              {result.isVerified && (
                <svg width="30" height="30" viewBox="0 0 24 24" style={{ marginLeft: '8px', flexShrink: 0 }}>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z" fill={isDark ? '#AAAAAA' : '#606060'} />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 20, fontWeight: 400, color: subtleTextColor, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '380px' }}>
              @{result.username}
            </span>

            {/* Subscribers */}
            {result.subscriberCount && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="14" viewBox="0 0 20 14" style={{ marginRight: '8px', flexShrink: 0 }}>
                  <path d="M19.6 2.1c-.2-.8-.8-1.4-1.6-1.6C16.5 0 10 0 10 0S3.5 0 2 .5C1.2.7.6 1.3.4 2.1 0 3.6 0 7 0 7s0 3.4.4 4.9c.2.8.8 1.4 1.6 1.6C3.5 14 10 14 10 14s6.5 0 8-.5c.8-.2 1.4-.8 1.6-1.6.4-1.5.4-4.9.4-4.9s0-3.4-.4-4.9z" fill="#FF0000" />
                  <path d="M8 10l5-3-5-3v6z" fill="white" />
                </svg>
                <span style={{ fontSize: 22, fontWeight: 500, color: extraColor, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                  {result.subscriberCount}
                </span>
              </div>
            )}

            {/* Videos uploaded */}
            {result.videoCount && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', flexShrink: 0 }} fill={subtleTextColor}>
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
                </svg>
                <span style={{ fontSize: 18, fontWeight: 500, color: subtleTextColor, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                  {result.videoCount}
                </span>
              </div>
            )}
          </div>

          {/* Corner accent */}
          <div style={{
            position: 'absolute', right: 0, bottom: 0, width: '120px', height: '120px',
            borderRadius: '100% 0 0 0',
            background: isDark ? 'radial-gradient(circle at 100% 100%, rgba(255,0,0,0.1), transparent 70%)' : 'radial-gradient(circle at 100% 100%, rgba(255,0,0,0.05), transparent 70%)',
            zIndex: 0,
          }} />
        </div>
      </div>
    ),
    { width: 700, height: 250, emoji: 'fluent' }
  );
}

// ─── Error Card ──────────────────────────────────────────────────────

function renderErrorCard(errorMessage: string) {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)', padding: '32px 40px', borderRadius: '24px',
          width: '600px', boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
          fontFamily: 'Inter, sans-serif', color: '#0f0f0f', gap: '16px',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z" fill="#FF0000" />
            <path d="M9.5 15.5l6.5-3.5-6.5-3.5v7z" fill="white" />
          </svg>
          <span style={{ fontSize: 24, fontWeight: 600 }}>Unable to load YouTube channel</span>
          <span style={{ fontSize: 16, color: '#606060', textAlign: 'center' }}>{errorMessage}</span>
        </div>
      </div>
    ),
    { width: 700, height: 250, emoji: 'fluent' }
  );
}

// ─── Main Handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const theme = searchParams.get('theme') || 'light';
    const isDark = theme === 'dark';

    // No params → show homepage
    if (!username) {
      try {
        const htmlPath = join(process.cwd(), 'public', 'index.html');
        const htmlContent = readFileSync(htmlPath, 'utf8');
        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        headers.set('Cache-Control', 'public, max-age=3600');
        return new Response(htmlContent, { status: 200, headers });
      } catch {
        return new Response('Homepage not found', { status: 404 });
      }
    }

    const themeColors = getThemeColors(searchParams, isDark);
    const headers = makeHeaders();

    const sanitizedUsername = sanitizeUsername(username);
    const result = await scrapeYouTube(sanitizedUsername);
    const imageResponse = renderChannelCard(result, themeColors, isDark);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return new Response(Buffer.from(arrayBuffer), { status: 200, headers });

  } catch (error) {
    console.error('Error generating YouTube card:', error);

    let errorMessage = 'Please check the username and try again';

    if (error instanceof ChannelNotFoundError) errorMessage = error.message;
    else if (error instanceof YouTubeScrapeError) errorMessage = error.message;

    const headers = makeHeaders();
    const imageResponse = renderErrorCard(errorMessage);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return new Response(Buffer.from(arrayBuffer), { status: 200, headers });
  }
}
