# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini-Cover is a Vue 3-based cover image generator for blogs, short videos, and social media. It provides a canvas-based interface for creating custom cover images with text, icons, watermarks, and customizable styling.

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production (output to dist/)
npm run build

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Framework**: Vue 3.4+ with Composition API (Options API in components)
- **Build Tool**: Vite 5.1+
- **Styling**: Tailwind CSS 3.4+ with custom PostCSS configuration
- **Icons**: Iconify Vue for dynamic icons

### Project Structure

```
src/
├── App.vue                    # Root component with layout (Header/CoverGenerator/Footer)
├── main.js                    # App entry point, font initialization
├── config.js                  # Default fonts, text, and watermark configuration
├── assets/
│   ├── index.css              # Global styles and Tailwind directives
│   └── script.js              # Core canvas rendering logic and state management
└── components/
    ├── CoverGenerator.vue     # Main interface with controls and canvas
    ├── HeaderComponent.vue    # Title and GitHub link
    ├── FooterComponent.vue    # ICP info, tips popup, socialist values
    ├── ImageUploader.vue      # Image upload to PixPro API
    └── SettingsModal.vue      # Settings modal (placeholder)
```

### Key Architectural Patterns

**State Management**: Uses a reactive global state object in `assets/script.js`:
```javascript
export const state = reactive({
    bgImageUrl: null,      // Background image
    squareImageUrl: null,  // Icon/image
    bgColor: '#ffffff',
    textColor: '#eeeeee',
    watermarkColor: '#dddddd',
    // ... many more properties
});
```

**Canvas Layering System**: Uses multiple offscreen canvases composed together:
- `bgCanvas` - Background (color or image with blur)
- `textCanvas` - Main title text
- `watermarkCanvas` - Watermark text
- `squareCanvas` - Icon/image with rotation/shadows
- Main canvas - Composited result

**Font System**: Dynamic font loading via CSS URLs in `config.js`. Supports both system fonts and CDN-hosted Chinese fonts (HarmonyOS, Douyin Sans, etc.).

### Environment Configuration

The `.env` file controls:
- `VITE_APP_TITLE` - Site title
- `VITE_APP_ICP_NUMBER` - ICP registration for footer
- `VITE_APP_UPLOAD_API_URL` - PixPro image hosting API (optional)
- `VITE_APP_FONT_FAMILY` - Global default font
- `VITE_APP_FONT_CSS_URL` - External font CSS URL

### External Integrations

- **Iconify**: Dynamic icons via `https://api.iconify.design/{icon-name}.svg`
- **YesIcon**: Icon search at `https://yesicon.app/`
- **PixPro**: Optional image hosting API
- **Umami**: Analytics (configured in `index.html`)

## Important Implementation Details

**Canvas Rendering**: All canvas operations are async image loading with `onload` callbacks. The `composeCanvases()` function merges all layer canvases to the main display canvas.

**Drag & Drop**: The canvas supports drag-and-drop for both background images (drop anywhere) and icons (drop in center 200px radius).

**Image Upload**: The `ImageUploader` component can upload the generated cover to a PixPro instance (if configured) and copies the URL to clipboard.

**3D Text Effect**: Uses canvas shadow properties (shadowBlur, shadowOffsetX/Y) to create a 3D extrusion effect on text.

**Multi-line Text**: Supports newline characters in title text, with automatic line height calculation and vertical centering.

## Notes for Development

- The project uses Options API in components but could be migrated to Composition API
- No test framework is currently configured
- The SettingsModal is currently a placeholder with no actual settings
- Canvas operations could benefit from requestAnimationFrame for smoother updates
- The font loading approach (creating `<link>` elements) could be improved with FontFace API
