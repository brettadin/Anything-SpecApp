# Current Project Status

**Last Updated:** December 12, 2025

## What Works ✅

### Core Functionality
- **App Launch**: Server starts successfully on localhost:4000
- **File Upload**: Accepts CSV/TSV files up to 10MB
- **File Parsing**: Detects delimiters, headers, and data structure
- **Routing**: React Router 7 with file-based routing
- **Safety Limits**: Prevents crashes from large files

### Tech Stack (Simplified)
- **Frontend**: React 18.2, TypeScript, TailwindCSS
- **Router**: React Router 7.6 (native, no Hono)
- **Parsing**: papaparse for CSV, jcamp for spectroscopy formats
- **Charts**: Recharts 2.12 (installed but not integrated)

## What Doesn't Work ❌

### Critical Issues
1. **No Data Visualization**: Spectral page loads but displays no data
   - Upload redirects to `/spectral/:fileId` but page doesn't receive parsed data
   - Need to implement loader to pass data from upload action to page

2. **No Authentication**: Completely disabled
   - Login UI exists but shows "Auth not configured" message
   - All auth functions mocked to return empty/error states
   - No user accounts or sessions

3. **No Persistence**: No database configured
   - All uploads are temporary (only in memory)
   - File IDs generated but not stored
   - History page won't work

4. **UI/UX Issues**: Basic functionality only
   - Very minimal styling
   - No loading states
   - No error boundaries
   - No user feedback

## Architecture Details

### Removed Components
- ❌ Hono web framework (was causing connection issues)
- ❌ @hono/auth-js (incompatible with route-builder)
- ❌ Database integration (not configured for dev)
- ❌ External file storage (using data URLs instead)

### Current Flow
```
User uploads file
  → useUpload reads as data URL
  → POST to /api/upload
  → action() in route.js receives fileUrl + metadata
  → Fetches from data URL and parses
  → Generates temp fileId
  → Redirects to /spectral/:fileId
  → Page loads but has no data ⚠️
```

### The Problem
The upload action has the parsed data but redirects without passing it.
The spectral page has no way to retrieve the parsed data (no database, no state management).

**Possible Solutions:**
1. Store parsed data in session/localStorage before redirect
2. Set up simple in-memory cache with file IDs
3. Configure database for persistence
4. Pass data via URL query params (limited by size)

## Files Modified in Last Session

```
apps/web/
├── vite.config.ts              # Removed Hono
├── react-router.config.ts      # Simplified
├── src/
│   ├── auth.js                 # Stubbed (mock functions)
│   ├── utils/
│   │   ├── useUser.js         # Mocked
│   │   ├── useAuth.js         # Mocked  
│   │   └── useUpload.js       # Simplified
│   └── app/
│       ├── routes.ts          # Added .tsx + route.js support
│       └── api/upload/
│           └── route.js       # React Router action + safety limits
```

## Immediate Next Steps

### To Get Data Displaying (Priority 1)
1. Add in-memory cache to store parsed data by fileId
2. Create loader in spectral/[fileId]/page.tsx to fetch from cache
3. Pass parsed data to chart component

### UI Improvements (Priority 2)
1. Add loading spinners during upload
2. Show file size/format info
3. Better error messages
4. Improve spectral page layout

### Long-term (Priority 3)
1. Decide on auth approach
2. Configure database (Neon or PostgreSQL)
3. Add user accounts if needed
4. Implement data persistence

## Development Commands

```bash
# Start dev server
cd apps/web
npm run dev
# → http://localhost:4000

# Kill stuck processes
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force
```

## Notes
- Auth was intentionally disabled to simplify - was causing more problems than it solved
- Hono removal was correct decision - React Router native is simpler and works
- File size limits in place to prevent crashes (10MB data URL, 50MB decoded)
- All changes aligned with user's request to "keep it simple"
