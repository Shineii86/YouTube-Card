/**
 * YouTube Card
 * A lightweight and efficient web scraping utility designed to generate
 * clean, dynamic preview cards for YouTube channels.
 *
 * Repository: https://github.com/Shineii86/YouTube-Card
 *
 * Generates beautiful, theme-aware preview cards for YouTube channels.
 * Perfect for embedding in GitHub READMEs, websites, and social media.
 *
 * Usage: /?username=YourYouTubeUsername&theme=light|dark
 *
 * This project is built to help developers seamlessly showcase YouTube
 * channels with visually structured metadata, making it ideal
 * for integration into GitHub profiles, portfolio websites, and personal projects.
 *
 * Author: Shinei Nouzen
 *
 * Copyright (c) 2026 Shinei Nouzen
 *
 * Released under the MIT License.
 * You are free to use, modify, and distribute this software in accordance
 * with the terms of the license.
 */

'use server';

import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og';
import scrapeYouTube from "@/utils/scrapeYouTube";
import { YouTubeScrapeError, ChannelNotFoundError } from '@/utils/errors';
import { readFileSync } from 'fs';
import { join } from 'path';

function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_@.-]/g, ' ');
}

export async function GET(request: NextRequest) {
  let errorMessage = 'Please check the channel username and try again';
  try {
    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || null;
    const theme = searchParams.get('theme') || 'light';
    const isDark = theme === 'dark';

    // If username is not provided, show homepage
    if (!username) {
      try {
        const htmlPath = join(process.cwd(), 'public', 'index.html');
        const htmlContent = readFileSync(htmlPath, 'utf8');

        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        headers.set('Cache-Control', 'public, max-age=3600');

        return new Response(htmlContent, {
          status: 200,
          headers: headers,
        });
      } catch {
        return new Response('Homepage not found', { status: 404 });
      }
    }

    const sanitizedUsername = sanitizeUsername(username);

    // Fetch YouTube data
    const result = await scrapeYouTube(sanitizedUsername);

    // Theme-specific colors (YouTube red accent)
    const cardBgColor = searchParams.get('bgColor') || (isDark ? 'rgba(42, 42, 42, 1)' : 'rgba(255, 255, 255, 1)');
    const textColor = searchParams.get('textColor') || (isDark ? '#ffffff' : '#0f0f0f');
    const subtleTextColor = searchParams.get('subtleTextColor') || (isDark ? '#AAAAAA' : '#606060');
    const extraColor = searchParams.get('extraColor') || (isDark ? '#FF4E45' : '#FF0000');
    const shadowColor = searchParams.get('shadowColor') || (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)');
    const fontFamily = searchParams.get('fontFamily') || 'Inter, sans-serif';

    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Cache-Control', 'public, max-age=7200');
    headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'");

    // Generate the image response
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: cardBgColor,
              padding: '32px 40px',
              borderRadius: '24px',
              width: '600px',
              height: '180px',
              boxShadow: `0 12px 28px ${shadowColor}`,
              color: textColor,
              fontFamily: fontFamily,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Avatar section */}
            <div
              style={{
                position: 'relative',
                width: 110,
                height: 110,
                marginRight: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={result.image}
                alt={`${result.username} channel picture`}
                width={120}
                height={120}
                style={{
                  borderRadius: 9999,
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* Content section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '100%',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: '380px' }}>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Arial',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {result.title}
                  </span>
                  {result.isVerified && (
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      style={{
                        marginLeft: '8px',
                        verticalAlign: '-4px',
                        flexShrink: 0,
                      }}
                    >
                      <path
                        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z"
                        fill={isDark ? '#AAAAAA' : '#606060'}
                      />
                    </svg>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: 20,
                  fontWeight: 400,
                  color: subtleTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '380px',
                }}
              >
                @{result.username}
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* YouTube Play Button Icon */}
                <svg
                  width="20"
                  height="14"
                  viewBox="0 0 20 14"
                  style={{
                    marginRight: '8px',
                    flexShrink: 0,
                  }}
                >
                  <path
                    d="M19.6 2.1c-.2-.8-.8-1.4-1.6-1.6C16.5 0 10 0 10 0S3.5 0 2 .5C1.2.7.6 1.3.4 2.1 0 3.6 0 7 0 7s0 3.4.4 4.9c.2.8.8 1.4 1.6 1.6C3.5 14 10 14 10 14s6.5 0 8-.5c.8-.2 1.4-.8 1.6-1.6.4-1.5.4-4.9.4-4.9s0-3.4-.4-4.9z"
                    fill="#FF0000"
                  />
                  <path d="M8 10l5-3-5-3v6z" fill="white" />
                </svg>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: extraColor,
                    display: 'flex',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '340px',
                  }}
                >
                  {result.extra || 'YouTube Channel'}
                </span>
              </div>
            </div>

            {/* Subtle corner gradient for depth - YouTube red accent */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '120px',
                height: '120px',
                borderRadius: '100% 0 0 0',
                background: isDark ? 'radial-gradient(circle at 100% 100%, rgba(255,0,0,0.1), transparent 70%)' : 'radial-gradient(circle at 100% 100%, rgba(255,0,0,0.05), transparent 70%)',
                zIndex: 0,
              }}
            />
          </div>
        </div>
      ),
      {
        width: 700,
        height: 250,
        emoji: 'fluent',
        headers: headers,
      },
    );
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return new Response(buffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error generating YouTube card:', error);
    if (error instanceof ChannelNotFoundError) {
      errorMessage = error.message;
    } else if (error instanceof YouTubeScrapeError) {
      errorMessage = error.message;
    }

    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Cache-Control', 'public, max-age=7200');
    headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'");

    // Return a fallback image response
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '32px 40px',
              borderRadius: '24px',
              width: '600px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              fontFamily: 'Inter, sans-serif',
              color: '#0f0f0f',
              gap: '16px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"
                fill="#FF0000"
              />
              <path d="M9.5 15.5l6.5-3.5-6.5-3.5v7z" fill="white" />
            </svg>
            <span style={{ fontSize: 24, fontWeight: 600 }}>
              Unable to load YouTube channel
            </span>
            <span style={{ fontSize: 16, color: '#606060', textAlign: 'center' }}>
              {errorMessage}
            </span>
          </div>
        </div>
      ),
      {
        width: 700,
        height: 250,
        emoji: 'fluent',
        headers: headers,
      }
    );
  }
}
