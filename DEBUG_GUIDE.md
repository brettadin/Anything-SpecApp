# VS Code Debugging Guide

## Quick Start

### Option 1: Debug in Chrome (Recommended)
1. Press **F5** or go to Run → "Debug App - Chrome (Launch Dev Server)"
2. VS Code will:
   - Start the dev server automatically
   - Open Chrome with debugger attached
   - Set breakpoints in your React code
3. Stop debugging with **Shift+F5**

### Option 2: Attach to Running Server
If the dev server is already running (`npm run dev` in terminal):
1. Press **F5** and select "Debug App - Chrome (Attach)"
2. Click around your app to trigger code
3. Set breakpoints and inspect variables

### Option 3: Debug Node Backend Only
For backend/API debugging:
1. Press **F5** and select "Debug Node (Backend Only)"
2. Set breakpoints in `/src/app/api/` files
3. Make requests to trigger breakpoints

## Debugging Features

### Setting Breakpoints
- Click on the line number in the editor
- Or press **Ctrl+Shift+B** and use conditional breakpoints
- Breakpoints in JavaScript files are automatically set

### Debug Console
- View logs from `console.log()`, `console.error()`, etc.
- Execute expressions in the current scope
- Type `$0`, `$1` for recently selected DOM elements

### Watch Variables
- Add expressions in the "Watch" panel
- Hover over variables to see their values
- Right-click to add conditional breakpoints

### Step Through Code
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out
- **Ctrl+Shift+F5** - Restart

## Tasks Available (Ctrl+Shift+B)

Run any task from the Command Palette:

- **npm: dev (apps/web)** - Start dev server in background
- **npm: test (apps/web)** - Run tests once
- **npm: test:watch (apps/web)** - Run tests in watch mode
- **npm: typecheck (apps/web)** - Check TypeScript types

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Debugging | F5 |
| Stop Debugging | Shift+F5 |
| Pause | F6 |
| Step Over | F10 |
| Step Into | F11 |
| Step Out | Shift+F11 |
| Continue | F5 |
| Toggle Breakpoint | Ctrl+K, Ctrl+B |
| Run Task | Ctrl+Shift+B |
| Open Debug Console | Ctrl+Shift+Y |

## Troubleshooting

### Dev server won't start
- Make sure ports 4000-4003 are free
- Check terminal for errors
- Try `npm install --legacy-peer-deps` in `apps/web`

### Breakpoints not working
- Source maps might be missing: run `npm run dev` first
- Try refreshing the browser (F5 in Chrome)
- Check that code matches source files

### Chrome DevTools opening instead
- Close Chrome DevTools manually
- VS Code debugger should work alongside it
- If debugging is slow, try closing DevTools

## Tips

✅ **Use Chrome DevTools AND VS Code debugger together**
- Chrome DevTools: DOM inspection, network tab, style editing
- VS Code: Code editing, variable watching, command execution

✅ **Logpoints instead of console.log**
- Right-click breakpoint → "Add Logpoint"
- Prints without stopping execution

✅ **Conditional breakpoints**
- Right-click breakpoint → "Edit Breakpoint"
- Only break when condition is true

✅ **Debug entire workflow**
- Upload a file
- Server processes it
- Frontend displays results
- Inspect variables at each stage
