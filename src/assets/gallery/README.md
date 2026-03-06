# Gallery Images Setup

This directory is where you should place your birthday celebration photos.

## Required Files

Add **7 images** named exactly as follows:
- `1.jpg`
- `2.jpg`
- `3.jpg`
- `4.jpg`
- `5.jpg`
- `6.jpg`
- `7.jpg`

## Image Guidelines

- **Format:** JPG, PNG, or WebP
- **Recommended Size:** 800×600px or larger (landscape format recommended)
- **File Size:** Keep under 500KB each for optimal loading
- **Content:** Birthday photos, memories, celebration moments

## How to Add Images

1. Prepare 7 images of the birthday person or celebration moments
2. Rename them to `1.jpg`, `2.jpg`, ... `7.jpg`
3. Place them in this directory: `src/assets/gallery/`
4. The gallery will automatically display them in order

## Image Optimization Tips

- Use online tools like TinyPNG or ImageOptim to compress without quality loss
- Crop images to 4:3 or 16:9 aspect ratio for best display
- Use consistent dimensions across all images
- Convert to WebP format for better compression

## Example Flow

Once images are added:
1. Start the development server: `npm start`
2. Navigate to the Gallery page from the Home button
3. Use arrow keys, swipe, or buttons to navigate through images
4. Each image will display with smooth transitions

## Troubleshooting

If images don't appear:
- Check file names match exactly (case-sensitive on some systems)
- Ensure files are in `src/assets/gallery/` directory
- Verify file format is supported (JPG, PNG, WebP)
- Clear browser cache and reload
- Check browser console for error messages

---

**Note:** The application will work with placeholder behavior even without images, but add them for the complete experience!
