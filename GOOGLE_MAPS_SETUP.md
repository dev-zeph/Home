# Google Maps API Setup for Address Autocomplete

## 🗺️ Getting Your Google Maps API Key

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Create a New Project (or select existing)
- Click "Select a project" dropdown
- Click "New Project"
- Name it "NG Rentals" or similar
- Click "Create"

### 3. Enable Required APIs
- Go to "APIs & Services" > "Library"
- Search for and enable these APIs:
  - **Maps JavaScript API**
  - **Places API**
  - **Geocoding API** (optional, for additional features)

### 4. Create API Key
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "API Key"
- Copy the generated API key

### 5. Restrict the API Key (Recommended)
- Click on your new API key to edit it
- Under "API restrictions":
  - Select "Restrict key"
  - Choose: Maps JavaScript API, Places API
- Under "Website restrictions":
  - Add your domains:
    - `localhost:3000` (for development)
    - `your-vercel-domain.vercel.app` (for production)
- Click "Save"

### 6. Add to Environment Variables

**Local Development (.env):**
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyB...your-api-key-here
```

**Vercel Production:**
- Go to your Vercel project dashboard
- Settings > Environment Variables
- Add: `REACT_APP_GOOGLE_MAPS_API_KEY` = `your-api-key`

## 🎯 Features Enabled

With Google Places Autocomplete, users can:
- ✅ **Type address** and get real-time suggestions
- ✅ **Auto-fill** city, state, and area fields
- ✅ **Ensure accuracy** - only real addresses allowed
- ✅ **Nigeria-focused** - restricted to Nigerian addresses
- ✅ **Better UX** - faster property posting

## 🔒 Security Notes

- API key is restricted to your domains only
- Client-side usage is normal for Places Autocomplete
- Monitor usage in Google Cloud Console
- Set billing alerts to avoid unexpected charges

## 💰 Pricing

Google Places API pricing (as of 2024):
- **Autocomplete**: $2.83 per 1,000 requests
- **Free tier**: $200 credit monthly
- For most small to medium apps, this stays within free limits

## 🚨 Important

Without the API key, the address autocomplete will fall back to regular text input with a warning message. The app will still work, but users won't get address suggestions.
