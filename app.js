// Photo Transformation App - JavaScript

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
    if (value < 33) {
        speedValue.textContent = 'Fast (Lower Quality)';
    } else if (value < 66) {
        speedValue.textContent = 'Balanced';
    } else {
        speedValue.textContent = 'Slow (Best Quality)';
    }
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
    link.download = 'transformed_image.png';
    link.href = outputCanvas.toDataURL();
    link.click();
});

// Load target image
function loadTargetImage() {
    const size = parseInt(sizeSelect.value);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Use the prepared target image
    img.onload = () => {
        targetImage = img;
        targetCanvas.width = size;
        targetCanvas.height = size;
        targetCtx.drawImage(img, 0, 0, size, size);
        status.textContent = '✓ Target image loaded. Now upload your photo!';
    };

    img.onerror = () => {
        // Fallback: create a simple gradient target
        targetCanvas.width = size;
        targetCanvas.height = size;
        const gradient = targetCtx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        targetCtx.fillStyle = gradient;
        targetCtx.fillRect(0, 0, size, size);
        status.textContent = '⚠️ Using default target. Upload your photo to continue.';
    };

    // Try to load the target image (you'll need to embed this as base64 or serve it)
    img.src = 'target_' + size + '.png';
}

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
            status.textContent = '✓ Image uploaded! Click "Transform Photo" to start.';
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// Size select change
sizeSelect.addEventListener('change', () => {
    loadTargetImage();
    if (inputImage) {
        const size = parseInt(sizeSelect.value);
        inputCanvas.width = size;
        inputCanvas.height = size;
        inputCtx.drawImage(inputImage, 0, 0, size, size);
    }
});

// Main transformation function
async function transformImage() {
    if (isProcessing) return;

    isProcessing = true;
    transformBtn.disabled = true;
    downloadBtn.style.display = 'none';
    progressContainer.style.display = 'block';

    const size = parseInt(sizeSelect.value);
    const speedFactor = parseInt(speedSlider.value);

    status.textContent = 'Processing... This may take a moment.';

    // Get pixel data
    const targetData = targetCtx.getImageData(0, 0, size, size);
    const inputData = inputCtx.getImageData(0, 0, size, size);

    // Prepare output canvas
    outputCanvas.width = size;
    outputCanvas.height = size;
    const outputData = outputCtx.createImageData(size, size);

    // Start transformation in chunks to avoid freezing
    await rearrangePixels(targetData, inputData, outputData, speedFactor);

    // Draw result
    outputCtx.putImageData(outputData, 0, 0);

    // Finish
    isProcessing = false;
    transformBtn.disabled = false;
    progressContainer.style.display = 'none';
    downloadBtn.style.display = 'inline-block';
    status.textContent = '✅ Transformation complete! Download your result.';
}

// Pixel rearrangement algorithm (Greedy approach)
async function rearrangePixels(targetData, inputData, outputData, speedFactor) {
    const size = Math.sqrt(targetData.data.length / 4);
    const totalPixels = size * size;

    // Extract pixels
    const targetPixels = [];
    const inputPixels = [];

    for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        targetPixels.push({
            r: targetData.data[idx],
            g: targetData.data[idx + 1],
            b: targetData.data[idx + 2],
            index: i
        });
        inputPixels.push({
            r: inputData.data[idx],
            g: inputData.data[idx + 1],
            b: inputData.data[idx + 2],
            used: false
        });
    }

    // Determine sampling rate based on speed factor
    const sampleRate = Math.max(1, Math.floor(speedFactor / 10));

    // Process in chunks to allow UI updates
    const chunkSize = 100;

    for (let i = 0; i < totalPixels; i++) {
        // Find best matching pixel
        const target = targetPixels[i];
        let bestDist = Infinity;
        let bestIdx = -1;

        // Sample pixels for matching (trade-off between speed and quality)
        for (let j = 0; j < inputPixels.length; j += sampleRate) {
            if (!inputPixels[j].used) {
                const dist = colorDistance(target, inputPixels[j]);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = j;
                }
            }
        }

        // If no pixel found (all used in sampling), find first unused
        if (bestIdx === -1) {
            bestIdx = inputPixels.findIndex(p => !p.used);
        }

        // Assign pixel
        const chosen = inputPixels[bestIdx];
        chosen.used = true;

        const outIdx = i * 4;
        outputData.data[outIdx] = chosen.r;
        outputData.data[outIdx + 1] = chosen.g;
        outputData.data[outIdx + 2] = chosen.b;
        outputData.data[outIdx + 3] = 255;

        // Update progress
        if (i % chunkSize === 0) {
            const progress = Math.floor((i / totalPixels) * 100);
            progressFill.style.width = progress + '%';
            progressFill.textContent = progress + '%';

            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    // Final progress update
    progressFill.style.width = '100%';
    progressFill.textContent = '100%';
}

// Calculate color distance (Euclidean distance in RGB space)
function colorDistance(p1, p2) {
    const dr = p1.r - p2.r;
    const dg = p1.g - p2.g;
    const db = p1.b - p2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Reset progress
function resetProgress() {
    progressFill.style.width = '0%';
    progressFill.textContent = '0%';
}
