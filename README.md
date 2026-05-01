<div align="center">

![YouTube Card](https://youtubecard.vercel.app/og.png)

# YouTube Card Widget

**Beautiful, dynamic Open Graph cards for YouTube channels & videos**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green)

[🚀 Live Demo](https://youtubecard.vercel.app/?username=MrBeast) •
[Quick Start](#-quick-start) •
[API Reference](#-api-reference) •
[Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Deployment](#-deployment)
- [Local Development](#-local-development)
- [Contributing](#-contributing)
- [Credits](#-credits)
- [License](#-license)

## 🌟 Overview

YouTube Card Widget is a high-performance, serverless solution for generating dynamic Open Graph images for YouTube channels and videos. Built with modern web technologies and deployed on the edge, it provides real-time card generation with sub-second response times.

The widget scrapes YouTube's public pages to fetch metadata and generates optimized PNG cards using Vercel's Edge Functions and the Satori rendering engine.

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ Edge-Powered | Sub-100ms response times via Vercel Edge Network |
| 🎨 Theming | Native dark/light modes + full CSS custom properties support |
| 📱 Responsive | Optimized rendering for GitHub, Twitter, LinkedIn, and web embeds |
| 🔍 Auto-Detection | Automatically fetches channel/video name, avatar, thumbnail, and stats |
| 📊 Real-time Metrics | Displays subscriber counts, view counts, like counts, and verification |
| 🖼️ OG Image Ready | Perfect Open Graph metadata for social sharing |
| 🔒 Privacy First | No data persistence; ephemeral request processing |
| 🌍 Global CDN | 100+ edge locations worldwide |

## 🛠 Technology Stack

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) - Serverless compute at the edge
- [Satori](https://github.com/vercel/satori) - SVG-based OG image generation
- [@vercel/og](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation) - Open Graph image generation library
- Vercel Edge Network - Global CDN and edge compute

## 🚀 Quick Start

Generate a card by providing a YouTube channel username:

```
https://youtubecard.vercel.app/?username=MrBeast
```

Generate a video card with a video ID:

```
https://youtubecard.vercel.app/?video=dQw4w9WgXcQ
```

Append the theme parameter for predefined styles:

```
https://youtubecard.vercel.app/?username=MrBeast&theme=dark
```

![YouTube](https://youtubecard.vercel.app/?username=MrBeast&theme=dark)

### Embed in Markdown

```markdown
![YouTube](https://youtubecard.vercel.app/?username=MrBeast&theme=dark)
```

### Embed in HTML

```html
<a href="https://youtube.com/@MrBeast">
  <img src="https://youtubecard.vercel.app/?username=MrBeast" alt="YouTube @MrBeast" width="400"/>
</a>
```

## 📡 API Reference

### Endpoint

```
GET /
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `username` | string | ✅* | - | YouTube channel username (for channel cards) |
| `video` | string | ✅* | - | YouTube video ID or URL (for video cards) |
| `theme` | string | ❌ | `light` | Predefined theme: `light`, `dark` |
| `bgColor` | string | ❌ | Theme-based | Background color (CSS color value) |
| `textColor` | string | ❌ | Theme-based | Primary text color |
| `subtleTextColor` | string | ❌ | Theme-based | Secondary/muted text color |
| `extraColor` | string | ❌ | Theme-based | Accent/highlight color |
| `shadowColor` | string | ❌ | Theme-based | Card shadow color |
| `fontFamily` | string | ❌ | `system-ui` | Font stack (CSS font-family) |

*Use either `username` or `video` — not both.

### Color Formats

Supports all CSS color formats:

- **Hex:** `%23FF0000` (URL-encoded `#FF0000`)
- **RGB:** `rgb(255,0,0)`
- **RGBA:** `rgba(255,0,0,1)`
- **HSL:** `hsl(0,100%,50%)`

### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `image/png` | Image format |
| `Cache-Control` | `public, max-age=3600, stale-while-revalidate=86400` | Caching strategy |

### Error Codes

| Status Code | Description | Resolution |
|-------------|-------------|------------|
| 400 | Missing username | Provide `?username=` parameter |
| 404 | Channel not found | Verify username exists and is public |
| 500 | Generation error | Retry request or check service status |
| 429 | Rate limited | Implement client-side caching |

## 🎨 Examples

### Light Theme
![Light Theme](https://youtubecard.vercel.app/?username=MrBeast&theme=light)

### Dark Theme
![Dark Theme](https://youtubecard.vercel.app/?username=MrBeast&theme=dark)

### Channel Examples

| Type | Example | Preview |
|------|---------|---------|
| Entertainment | `?username=MrBeast` | ![](https://youtubecard.vercel.app/?username=MrBeast&theme=light) |
| Tech Reviews | `?username=MKBHD` | ![](https://youtubecard.vercel.app/?username=MKBHD&theme=light) |
| Gaming | `?username=PewDiePie` | ![](https://youtubecard.vercel.app/?username=PewDiePie&theme=light) |
| Science | `?username=veritasium` | ![](https://youtubecard.vercel.app/?username=veritasium&theme=light) |

### Custom Color Scheme

![Custom](https://youtubecard.vercel.app/?username=Google&bgColor=rgba(15,15,15,1)&textColor=%23FFFFFF&subtleTextColor=%23AAAAAA&extraColor=%23FF0000&shadowColor=rgba(255,0,0,0.2)&fontFamily=system-ui)

## 🚀 Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shineii86/YouTube-Card)

### Other Platforms

| Platform | Notes |
|----------|-------|
| Cloudflare Workers | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Shineii86/YouTube-Card) |
| Netlify | Edge functions support required |
| Railway | Containerized deployment |
| Render | Web service configuration |

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `CACHE_TTL` | ❌ | Cache duration in seconds | `3600` |
| `NODE_ENV` | ✅ | Environment mode | `production` |

## 💻 Local Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 1.22.0
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/Shineii86/YouTube-Card.git
cd YouTube-Card

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build with static optimization |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code analysis |
| `npm run type-check` | Run TypeScript compiler check |

## 🤝 Contributing

We welcome contributions from the community! Please review our contribution guidelines before submitting PRs.

1. Check existing [Issues](https://github.com/Shineii86/YouTube-Card/issues) and [PRs](https://github.com/Shineii86/YouTube-Card/pulls)
2. Fork the repository and create your branch
3. Ensure code follows existing style conventions
4. Add tests for new functionality
5. Update documentation as needed
6. Submit Pull Request with detailed description

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## 🙏 Acknowledgements

- [Vercel](https://vercel.com/) - Edge infrastructure and OG image generation
- [Next.js Team](https://nextjs.org/) - React framework and Satori renderer
- [YouTube](https://youtube.com/) - Public channel data
- [Satori](https://github.com/vercel/satori) - Enlightened library for converting HTML/CSS to SVG
- [Quinx Network](https://github.com/QuinxNetwork) - Initial concept and development

## 👤 Credits

**Original Author & Maintainer**
- [Shinei Nouzen](https://github.com/Shineii86) - Core architecture and development

**Design & UI**
- [Quinx Network Design Team](https://github.com/QuinxNetwork) - Visual identity and card layouts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

🚨 [Follow me on GitHub](https://github.com/Shineii86) •
⭐ [Star this project](https://github.com/Shineii86/YouTube-Card/)

Copyright © 2026 [Shinei Nouzen](https://github.com/Shineii86) — All Rights Reserved

</div>
