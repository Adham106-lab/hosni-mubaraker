// FIXED Photo Transformation App - JavaScript

// Global variables
let inputImage = null;
let targetImage = null;
let isProcessing = false;

// Canvas references
const inputCanvas = document.getElementById('inputCanvas');
const targetCanvas = document.getElementById('targetCanvas');
const outputCanvas = document.getElementById('outputCanvas');
const inputCtx = inputCanvas.getContext('2d');
const targetCtx = targetCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

// UI elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const transformBtn = document.getElementById('transformBtn');
const sizeSelect = document.getElementById('sizeSelect');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const status = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');

// Load target image on page load
window.addEventListener('load', () => {
    loadTargetImage();
});

// Upload box interactions
uploadBox.addEventListener('click', () => fileInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// Speed slider update
speedSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    let label = 'Balanced';
    if (value < 33) label = 'Fast (Lower Quality)';
    else if (value > 66) label = 'Slow (Higher Quality)';
    speedValue.textContent = label;
});

// Transform button
transformBtn.addEventListener('click', () => {
    if (!isProcessing && inputImage && targetImage) {
        transformImage();
    }
});

// Download button
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'transformed-image.png';
    link.href = outputCanvas.toDataURL();
    link.click();
});

// Load target image
function loadTargetImage() {
    const size = parseInt(sizeSelect.value);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        targetImage = img;
        targetCanvas.width = size;
        targetCanvas.height = size;
        targetCtx.drawImage(img, 0, 0, size, size);
        status.textContent = 'Target image loaded. Upload your photo to begin!';
    };
    img.onerror = () => {
        status.textContent = 'Error loading target image. Please check the file exists.';
    };
    img.src = `target_${size}.png`;
}

// Change size
sizeSelect.addEventListener('change', () => {
    loadTargetImage();
    if (inputImage) {
        const size = parseInt(sizeSelect.value);
        inputCanvas.width = size;
        inputCanvas.height = size;
        inputCtx.drawImage(inputImage, 0, 0, size, size);
    }
});

// Handle image upload
function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            inputImage = img;
            const size = parseInt(sizeSelect.value);
            inputCanvas.width = size;
            inputCanvas.height = size;
            inputCtx.drawImage(img, 0, 0, size, size);
            transformBtn.disabled = false;
            status.textContent = 'Image loaded! Click "Transform Photo" to begin.';
            downloadBtn.style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Main transformation algorithm
async function transformImage() {
    if (isProcessing) return;
    
    isProcessing = true;
    transformBtn.disabled = true;
    downloadBtn.style.display = 'none';
    progressContainer.style.display = 'block';
    
    const size = parseInt(sizeSelect.value);
    const quality = parseInt(speedSlider.value);
    
    // Setup output canvas
    outputCanvas.width = size;
    outputCanvas.height = size;
    
    status.textContent = 'Processing... This may take a while.';
    
    try {
        // Get pixel data from both images
        const inputData = inputCtx.getImageData(0, 0, size, size);
        const targetData = targetCtx.getImageData(0, 0, size, size);
        const outputData = outputCtx.createImageData(size, size);
        
        // Extract pixels
        const inputPixels = [];
        const targetPixels = [];
        
        for (let i = 0; i < inputData.data.length; i += 4) {
            inputPixels.push({
                r: inputData.data[i],
                g: inputData.data[i + 1],
                b: inputData.data[i + 2],
                a: inputData.data[i + 3],
                used: false
            });
        }
        
        for (let i = 0; i < targetData.data.length; i += 4) {
            targetPixels.push({
                r: targetData.data[i],
                g: targetData.data[i + 1],
                b: targetData.data[i + 2],
                a: targetData.data[i + 3]
            });
        }
        
        // Process pixels with greedy algorithm
        const totalPixels = targetPixels.length;
        const searchRadius = Math.max(1, Math.floor(100 - quality));
        
        for (let i = 0; i < totalPixels; i++) {
            // Update progress
            if (i % 100 === 0) {
                const progress = Math.floor((i / totalPixels) * 100);
                progressFill.style.width = progress + '%';
                progressFill.textContent = progress + '%';
                await sleep(0); // Allow UI to update
            }
            
            const target = targetPixels[i];
            let bestMatch = null;
            let bestDistance = Infinity;
            
            // Find closest unused pixel
            const searchCount = Math.min(inputPixels.length, searchRadius * 10);
            for (let j = 0; j < inputPixels.length && searchCount > 0; j++) {
                const input = inputPixels[j];
                if (input.used) continue;
                
                const distance = colorDistance(target, input);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = j;
                }
            }
            
            // Assign best match
            if (bestMatch !== null) {
                const pixel = inputPixels[bestMatch];
                const idx = i * 4;
                outputData.data[idx] = pixel.r;
                outputData.data[idx + 1] = pixel.g;
                outputData.data[idx + 2] = pixel.b;
                outputData.data[idx + 3] = pixel.a;
                pixel.used = true;
            } else {
                // Fallback to target pixel if no match found
                const idx = i * 4;
                outputData.data[idx] = target.r;
                outputData.data[idx + 1] = target.g;
                outputData.data[idx + 2] = target.b;
                outputData.data[idx + 3] = target.a;
            }
        }
        
        // Draw result
        outputCtx.putImageData(outputData, 0, 0);
        
        progressFill.style.width = '100%';
        progressFill.textContent = '100%';
        status.textContent = 'Transformation complete! Click download to save.';
        downloadBtn.style.display = 'inline-block';
        
    } catch (error) {
        console.error('Transformation error:', error);
        status.textContent = 'Error during transformation. Please try again.';
    }
    
    isProcessing = false;
    transformBtn.disabled = false;
    
    // Hide progress after 2 seconds
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000);
}

// Calculate color distance (Euclidean distance in RGB space)
function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Sleep helper for UI updates
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}