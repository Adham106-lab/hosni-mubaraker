# Photo Transformation Web App - Obamify Style

A beautiful web-based photo transformation tool that rearranges pixels from any uploaded image to match a target style.

## 🌟 Features

- **Drag & Drop Upload**: Easy image upload interface
- **Real-time Processing**: See progress as pixels are rearranged
- **Adjustable Quality**: Choose between speed and quality
- **Multiple Sizes**: 64x64 (fast), 128x128 (balanced), or 256x256 (best quality)
- **Instant Download**: Save your transformed image with one click
- **Responsive Design**: Works on desktop and mobile
- **No Backend Required**: Runs entirely in the browser!

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone/Download this project**
   ```bash
   # Download all files to a folder
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Or using Python 2
   python -m SimpleHTTPServer 8000

   # Or using Node.js
   npx http-server
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Option 2: Deploy to GitHub Pages

1. **Create a new GitHub repository**

2. **Upload these files:**
   - index.html
   - app.js
   - target_64.png
   - target_128.png
   - target_256.png

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Select "main" branch
   - Save and wait for deployment

4. **Visit your site:**
   ```
   https://yourusername.github.io/your-repo-name
   ```

### Option 3: Deploy to Netlify

1. **Go to [Netlify](https://www.netlify.com/)**

2. **Drag and drop your folder** with all files

3. **Your site is live immediately!**

### Option 4: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com/)**

2. **Import your GitHub repository** or upload files

3. **Deploy with one click!**

## 📁 Project Structure

```
photo-transformation/
├── index.html          # Main HTML page
├── app.js              # JavaScript with pixel algorithm
├── target_64.png       # 64x64 target image
├── target_128.png      # 128x128 target image
├── target_256.png      # 256x256 target image
└── README.md           # This file
```

## 🎨 How to Use

1. **Visit the web app** (after deployment)
2. **Upload your photo** (drag & drop or click)
3. **Choose output size:**
   - 64x64 - Fast (~5 seconds)
   - 128x128 - Balanced (~20 seconds)
   - 256x256 - Best quality (~2 minutes)
4. **Adjust speed/quality slider** if needed
5. **Click "Transform Photo"**
6. **Wait for processing** (watch the progress bar!)
7. **Download your result**

## 🛠️ Technical Details

### Algorithm

The app uses a **greedy pixel assignment** algorithm:

1. Resizes both input and target to the same size
2. For each target pixel position:
   - Finds the closest unused input pixel by color distance
   - Uses Euclidean distance in RGB color space
   - Assigns that pixel to the position
3. Continues until all pixels are assigned

### Performance

- **64x64**: 4,096 pixels → ~5 seconds
- **128x128**: 16,384 pixels → ~20 seconds
- **256x256**: 65,536 pixels → ~2 minutes

Processing is done in chunks to keep the UI responsive.

### Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🎯 Customization

### Change Target Image

Replace the `target_*.png` files with your own images:

1. Prepare your target image (the style you want)
2. Resize to 64x64, 128x128, and 256x256
3. Name them: `target_64.png`, `target_128.png`, `target_256.png`
4. Replace the files
5. Refresh the page!

### Adjust Colors

Edit the CSS in `index.html` to change:
- Background gradients
- Button colors
- Border colors
- Hover effects

### Add Features

Some ideas for enhancements:
- Animation of pixel movement
- Batch processing multiple images
- Comparison slider (before/after)
- Different algorithms (optimal assignment)
- Social media sharing
- Gallery of results

## 🐛 Troubleshooting

**Problem: Target image not loading**
- Make sure `target_*.png` files are in the same folder
- Check browser console for errors
- Try using absolute URLs

**Problem: Processing is slow**
- Use smaller output size (64x64)
- Increase the speed slider (lower quality)
- Close other browser tabs
- Use a more powerful device

**Problem: Result doesn't look good**
- Try different output sizes
- Adjust the speed/quality slider
- Use input images with varied colors
- Ensure target image has good contrast

**Problem: Can't upload image**
- Check file size (< 10MB recommended)
- Ensure it's a valid image format (JPG, PNG, GIF)
- Try a different browser

## 📊 Comparison to Original Obamify

| Feature | This Version | Original Obamify |
|---------|-------------|------------------|
| Target Image | Custom (your choice) | Obama only |
| Platform | Web browser | Web browser |
| Algorithm | Greedy | Genetic + Optimal |
| Processing | Client-side | Server-side |
| Setup | Zero setup | Requires deployment |
| Animation | Static | Fluid dynamics |
| Customization | Easy (change images) | Harder |

## 🎓 Learning Resources

Want to understand the algorithm better?

- [Hungarian Algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm)
- [Pixel Rearrangement Paper](https://arxiv.org/abs/1512.08192)
- [Original Obamify](https://github.com/Spu7Nix/obamify)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 📝 License

MIT License - Free to use, modify, and distribute!

## 🙏 Credits

- Inspired by [Obamify](https://github.com/Spu7Nix/obamify) by Spu7Nix
- Custom target image provided by user
- Built with vanilla HTML, CSS, and JavaScript

## 🚀 Future Improvements

- [ ] WebGL acceleration for faster processing
- [ ] Web Workers for background processing
- [ ] Progressive rendering (show partial results)
- [ ] Multiple target images to choose from
- [ ] Save/load projects
- [ ] Social media sharing
- [ ] Mobile app version
- [ ] Animation generation
- [ ] Batch processing
- [ ] Advanced color matching

---

**Enjoy transforming your photos!** 🎨✨

For questions or issues, please open a GitHub issue or contact the developer.
