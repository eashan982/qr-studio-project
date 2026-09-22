# QR Studio — Club Project

A polished browser-only QR Code Generator & Designer using React + Vite.

## Features
- URL, Plain Text, Email, Phone and Wi-Fi QR types
- Live generation and preview
- Size, foreground/background, margin and error correction controls
- Presets
- Input validation
- Contrast/readability warning
- PNG download
- Recent QR configuration persistence with localStorage
- Responsive mobile/desktop UI
- No backend required

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Interview points
- QR generation is fully client-side, so data is not sent to a server.
- localStorage satisfies the recent-history requirement without a backend.
- Contrast checking helps prevent customization from hurting scan readability.
- The same generation configuration drives preview and PNG download.
