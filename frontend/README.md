# PlacesFinder Frontend

A beautiful, responsive Next.js frontend for the AI-powered local search application.

## Features

- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 📱 **Mobile-first**: Optimized for all device sizes
- 🔍 **Smart Search**: AI-powered place search with real-time results
- 📍 **Location-aware**: Browser geolocation integration
- ⚡ **Fast**: Server-side rendering with Next.js App Router
- 🎯 **Accessible**: Built with accessibility in mind

## Getting Started

### Prerequisites
- Node.js 18+
- Python API server running on `http://localhost:5000`

### Quick Start
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/search/        # API routes (proxy to Python server)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── HeroSection.tsx    # Landing page hero
│   ├── ChatInterface.tsx  # Search interface
│   ├── ResultsSection.tsx # Search results display
│   └── Footer.tsx         # Page footer
```

## Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **UI Components**: Headless UI

## Available Scripts

- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - Code linting

## Environment Variables

Create `.env.local`:
```bash
API_BASE_URL=http://localhost:5000
```
