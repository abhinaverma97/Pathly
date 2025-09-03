# 🗺️ Pathly - AI-Powered Local Search

> Discover amazing places near you with intelligent AI-powered search and ranking

 ![Python](https://img.shields.io/badge/Python-3.8%2B-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black) ![React](https://img.shields.io/badge/React-19.1.0-61dafb)




## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **API Keys** (see [Configuration](#️-configuration))

### 1-Minute Setup

```bash
# Clone the repository
clone the repo
cd pathly

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Configuration section)

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start the backend server
python api_server.py

# In a new terminal, start the frontend
cd frontend
npm run dev
```

🎉 **That's it!** Open [http://localhost:3000](http://localhost:3000) to see Pathly in action.

## 📁 Project Structure

```
pathly/
├── 📁 frontend/                 # Next.js React application
│   ├── 📁 src/
│   │   ├── 📁 app/             # Next.js App Router
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Main page component
│   │   │   └── 📁 api/         # API routes
│   │   ├── 📁 components/      # React components
│   │   │   ├── Header.tsx      # Navigation header
│   │   │   ├── HeroSection.tsx # Landing/search section
│   │   │   ├── ChatInterface.tsx # Search interface
│   │   │   ├── ResultsSection.tsx # Results display
│   │   │   ├── StaticMap.tsx   # Google Maps integration
│   │   │   └── CitySelector.tsx # City selection
│   │   ├── 📁 utils/           # Utility functions
│   │   │   ├── cache.ts        # Search result caching
│   │   │   └── prefetch.ts     # Background prefetching
│   │   └── 📁 types/           # TypeScript definitions
│   ├── package.json            # Frontend dependencies
│   └── next.config.ts          # Next.js configuration
├── 📁 src/                     # Python backend modules
│   ├── fsgm.py                 # Foursquare + Google search
│   ├── ranking.py              # AI-powered ranking
│   ├── userLocation.py         # Location utilities
│   └── errors.py               # Error handling
├── 📁 data/                    # Data storage directory
├── api_server.py               # Flask API server
├── diagnose_api.py             # Diagnostic tool
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
└── README.md                   # This file
```

## ⚙️ Configuration

### Required API Keys

Create a `.env` file in the root directory:

```env
# API Keys and Configuration
GROQ_API_KEY=your_groq_api_key_here
FOURSQUARE_API_KEY=your_foursquare_api_key_here
SERPAPI_KEY=your_serpapi_key_here

# Default Configuration
DEFAULT_LATITUDE=26.9240
DEFAULT_LONGITUDE=75.8267
DEFAULT_TIMEZONE=UTC

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=5000

# AI Model Configuration
GROQ_MODEL=openai/gpt-oss-120b
```

### 🔑 **Getting API Keys**

#### **1. Groq API** (Required for AI ranking)
- Visit [Groq Console](https://console.groq.com/)
- Sign up for a free account
- Generate an API key
- Free tier includes generous usage limits

#### **2. Foursquare Places API** (Required for place data)
- Visit [Foursquare Developers](https://developer.foursquare.com/)
- Create a new app
- Get your API key from the app dashboard
- Free tier: 1,000 requests/day

#### **3. SerpAPI** (Required for Google Places data)
- Visit [SerpAPI](https://serpapi.com/)
- Sign up for an account
- Get your API key from dashboard
- Free tier: 100 searches/month

#### **4. Google Maps API** (Optional - for enhanced maps)
```env
# Add to .env for enhanced map features
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🔧 Installation

### Backend Setup

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python diagnose_api.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm run build
```

### Development Servers

```bash
# Terminal 1: Backend (Flask)
python api_server.py
# Server runs on http://localhost:5000

# Terminal 2: Frontend (Next.js)
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```


### **Debug Tools**

#### **Backend Diagnostics**
```bash
python diagnose_api.py
```
This tool checks:
- Server connectivity
- API key validity
- Search functionality
- AI ranking system

#### **Frontend Debug**
- Open browser dev tools
- Check Network tab for API calls
- Look for console errors
- Verify location permissions



## 🤝 Contributing

We welcome contributions! Here's how to get started:




## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Foursquare**: Place data and venue information
- **Google**: Maps and local search data
- **Groq**: AI model hosting and inference
- **Next.js Team**: Amazing React framework
- **Flask Team**: Lightweight Python web framework



<div align="center">

**⭐ Star this repository if you found it helpful!**

</div>

---

> **Built with ❤️ for explorers who want to discover amazing places with the power of AI**
