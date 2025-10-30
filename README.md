# Pockee - AI-Powered Finance Tracker

<p align="center">
  <img src="./logo.png" width="200" alt="Pockee Logo">
</p>

Pockee is a smart personal finance tracker that uses **Gemini 2.5 Flash AI** to automatically parse receipts and bank statements, making expense tracking effortless.

## Features

- **AI Receipt Scanning** - Snap a photo of your receipt, AI extracts all details
- **Bank Statement Import** - Upload CSV/PDF bank statements (Mandiri supported)
- **Smart Analytics** - Visual charts showing spending trends and categories
- **Balance Tracking** - Real-time balance with income/expense breakdown
- **Beautiful UI** - Warm orange theme with dark mode support
- **Privacy First** - All data stored locally on your device
- **In-App API Key Management** - Securely store your Gemini API key in the app settings

## Tech Stack

- **Frontend**: Expo (React Native + TypeScript)
- **AI/NLP**: Google Gemini 2.5 Flash API
- **Database**: AsyncStorage (local)
- **Charts**: react-native-chart-kit, react-native-gifted-charts
- **Navigation**: Expo Router
- **Icons**: Expo Vector Icons, Expo Symbols
- **PDF Processing**: @cantoo/pdf-lib, react-native-pdf
- **File Handling**: Expo Document Picker, Expo Image Picker, Expo File System
- **UI**: Linear Gradients, Haptics, Safe Area Context

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pockee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get your Gemini API Key (BYOK - Bring Your Own Key)**
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Sign in with your Google account
   - Click "Get API Key" and create a new API key (free tier available)
   - Copy your API key - you'll need it in the app

4. **Run the app**
   ```bash
   npm start
   ```

   Then press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web

## How to Use

### 1. Set Up Your API Key
- Open the app and go to **Settings**
- Scroll to **API Configuration** section
- Enter your Gemini API key (starts with "AIza")
- Tap **Save Key**
- Your key is stored locally and never shared

### 2. Add Transactions
- **Scan Receipt**: Open camera, snap receipt → AI extracts merchant, items, total
- **Upload Image**: Choose receipt from gallery → AI processes it
- **Upload File**: Import Bank Mandiri CSV/PDF statements → AI parses transactions
- **Manual Entry**: Manually input transaction details

### 3. View Analytics
- Monthly income vs expense trend (line chart)
- Category breakdown (pie chart)
- Detailed spending by category

### 4. Manage Settings
- Toggle dark mode
- Export transaction data
- Clear all data
- View app info

## Project Structure

```
pockee/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen
│   │   ├── add.tsx            # Add transaction
│   │   ├── analytics.tsx      # Analytics & charts
│   │   └── settings.tsx       # Settings
│   ├── transaction/
│   │   └── [id].tsx           # Transaction details
│   ├── _layout.tsx            # Root layout
│   └── (tabs)/_layout.tsx     # Tab layout
├── services/
│   ├── gemini.ts              # Gemini AI integration
│   └── storage.ts             # AsyncStorage wrapper
├── types/
│   └── index.ts               # TypeScript types
├── utils/
│   ├── helpers.ts             # Utility functions
│   └── pdfUtils.ts            # PDF processing utilities
├── constants/
│   └── theme.ts               # Design system
├── contexts/
│   └── (context files)        # React contexts
├── components/
│   └── PasswordInputModal.tsx # Reusable components
└── assets/
    └── images/
        ├── icon.png           # App icon
        └── splash-icon.png    # Splash screen
```

## Design System

- **Primary Color**: `#FF8C42` (Warm Orange)
- **Secondary Color**: `#6C63FF` (Calm Purple)
- **Background**: `#FFFDF9` (Light) / `#121212` (Dark)
- **Success**: `#4CAF50` (Green)
- **Error**: `#E63946` (Red)

## Environment Variables

```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key (optional)
```

**Note**: Environment variable is optional - you can now set your API key directly in the app settings! The app will first check for an API key set in Settings, then fall back to this environment variable if none is found.

### How to get your API key:
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key (free tier available)
5. Use the key in app Settings (recommended) or add to `.env` file for development

**Privacy**: Your API key is stored locally on your device and never sent to any server except Google's Gemini API for processing your requests.

## Supported Platforms

- ✅ iOS
- ✅ Android
- ✅ Web

## Roadmap

- ✅ Receipt scanning with Gemini AI
- ✅ Local transaction storage with AsyncStorage
- ✅ Analytics & charts (line charts, pie charts)
- ✅ Multiple input methods (camera, gallery, file upload, manual)
- ✅ PDF bank statement processing
- ✅ Transaction detail pages
- ✅ Settings & data management
- ⬜ AI-driven categorization
- ⬜ Budget alerts & insights
- ⬜ Cloud sync & backup
- ⬜ Multi-bank support
- ⬜ Export to different formats

## License

MIT License - feel free to use this project for learning or personal use.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
