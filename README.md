# 🎂 Birthday Surprise

A magical, cute, and romantic birthday celebration website built with **Angular 19** and pure CSS/SCSS. Create an unforgettable birthday experience with animations, falling petals, sparkles, and heartfelt messages.

## ✨ Features

- **Cute Romantic Theme** - Anime-inspired design with pastel colors and dreamy aesthetics
- **4 Beautiful Pages** - Home, Flower Glory, Gallery, & Love Note
- **Smooth Animations** - 9 CSS animations including floating petals, sparkles, and glowing effects
- **Mobile-First Design** - Fully responsive (375px to 4K)
- **Interactive Gallery** - Image slider with keyboard & swipe support
- **No External Libraries** - Pure HTML/CSS/SCSS and Angular
- **Production Ready** - Optimized build (89.26 kB gzipped)
- **Easy Customization** - Simple to personalize with your own messages and photos

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Customize (Optional)
- Edit birthday name: `src/app/pages/home/home.component.ts`
- Edit love note: `src/app/pages/note/note.component.html`

### 3. Add Gallery Images
Place 7 images at: `src/assets/gallery/`
- `1.jpg`, `2.jpg`, ... `7.jpg`

### 4. Run Development Server
```bash
npm start
```
Visit `http://localhost:4200/`

### 5. Build for Production
```bash
npm run build
```

## 📖 Documentation

Comprehensive guides are included:

- **[QUICK_START.md](QUICK_START.md)** - Step-by-step implementation (5-10 minutes)
- **[PROJECT_SETUP_GUIDE.md](PROJECT_SETUP_GUIDE.md)** - Complete feature documentation
- **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)** - Architecture & technical details
- **[PROJECT_COMPLETION_CHECKLIST.md](PROJECT_COMPLETION_CHECKLIST.md)** - Verification checklist

## 🎨 Pages Overview

### 🏠 Home Page
Landing page with animated greeting, falling petals, and navigation to other pages.

### 🌹 Flower Glory
A magical blooming flower with sparkles and glowing effects.

### 🖼️ Gallery
Image slider supporting 7 photos with keyboard (arrow keys) and touch (swipe) navigation.

### 💌 Love Note
A romantic letter card with personalized message.

## 🎭 Animations

All animations are smooth and optimized:
- ✨ Falling petals
- ✨ Sparkling particles
- ✨ Glowing text effects
- ✨ Blooming flowers
- ✨ Floating motion
- ✨ Pulsing hearts
- ✨ Smooth page transitions

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile: iOS 12+, Android latest

## 🛠️ Development Commands

```bash
npm start             # Start dev server
npm run build         # Production build
npm run watch         # Build with watch mode
npm test              # Run tests
ng generate component # Generate new component
```

## 🎨 Customize

### Change Colors
Edit `src/styles.scss`:
```scss
$primary-pink: #ff6fae;
$primary-purple: #8b5cff;
$primary-gold: #ffd37d;
```

### Adjust Animation Speed
Edit component SCSS files:
```scss
animation: float-up-down 3s ease-in-out infinite; // Change 3s
```

### Add More Petals
Edit component TypeScript:
```typescript
const petalCount = 25; // Increase number
```

## 📦 Project Structure

```
src/
├── app/
│   ├── pages/
│   │   ├── home/               # Home page
│   │   ├── flower-glory/       # Flower page
│   │   ├── gallery/            # Gallery page
│   │   └── note/               # Love note page
│   ├── app.component.*
│   ├── app.routes.ts           # Routing configuration
│   └── app.config.ts           # App configuration
├── assets/
│   └── gallery/                # Place images here
├── main.ts                     # Bootstrap file
├── styles.scss                 # Global styles
└── index.html
```

## 🌐 Deployment

### Build Output
```bash
dist/birthday-surprise/
├── index.html
├── main-*.js
├── styles-*.css
└── assets/
```

### Deploy To
- **Netlify:** `npm run build` → drag `dist/` folder
- **Vercel:** Auto-detect Angular
- **Firebase:** `firebase deploy`
- **GitHub Pages:** Configure base-href
- **AWS S3 + CloudFront:** Auto-compatible

## 🎁 Personalization Checklist

- [ ] Update birthday name
- [ ] Customize love note message
- [ ] Add 7 gallery images
- [ ] Test on mobile device
- [ ] Adjust colors (optional)
- [ ] Build for production
- [ ] Deploy to hosting
- [ ] Share with birthday person!

## 📊 Performance

- **Bundle Size:** 334 kB (89 kB gzipped)
- **Build Time:** ~7 seconds
- **Load Time:** < 2 seconds
- **Animation FPS:** 60 (smooth)
- **Lighthouse Score:** 95+ (estimated)

## 🔒 What's Included

✅ 4 fully functional pages  
✅ 9 CSS animations  
✅ Complete mobile responsiveness  
✅ Production-ready code  
✅ Comprehensive documentation  
✅ No external dependencies  
✅ Modern Angular best practices  
✅ Easy customization  

## 📝 Tech Stack

- **Angular:** 19.2.0
- **TypeScript:** 5.7
- **SCSS:** CSS preprocessor
- **HTML:** Semantic markup

## 🤝 Contributing

This is a personal project template. Feel free to fork and customize!

## 📄 License

Open source - use freely for birthday celebrations! 🎉

## 💝 Special Thanks

Made with ❤️ for creating magical birthday moments.

---

## 📞 Need Help?

1. Check the [QUICK_START.md](QUICK_START.md) guide
2. Review [PROJECT_SETUP_GUIDE.md](PROJECT_SETUP_GUIDE.md)
3. See [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)
4. Check [PROJECT_COMPLETION_CHECKLIST.md](PROJECT_COMPLETION_CHECKLIST.md)

---

**Happy Birthday! 🎂✨🌸**

Enjoy creating magical moments! 💝

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
