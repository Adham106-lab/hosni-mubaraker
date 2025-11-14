// Photo Transformation: OPTIMIZED Greedy Algorithm Edition
// Efficient pixel rearrangement without massive memory usage
// (c) 2025, customized for hosni-mubaraker

let inputImage = null;
let targetImage = null;
let isProcessing = false;

const inputCanvas = document.getElementById('inputCanvas');
const targetCanvas = document.getElementById('targetCanvas');
const outputCanvas = document.getElementById('outputCanvas');
const inputCtx = inputCanvas.getContext('2d');
const targetCtx = targetCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

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

// Event Listeners
window.addEventListener('load', () => loadTargetImage());
uploadBox.addEventListener('click', () => fileInput.click());
uploadBox.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    uploadBox.classList.add('dragover'); 
});
uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
});
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
});
speedSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    let label = 'Balanced';
    if (value < 33) label = 'Fast (Lower Quality)';
    else if (value > 66) label = 'Slow (Higher Quality)';
    speedValue.textContent = label;
});
transformBtn.addEventListener('click', () => {
    if (!isProcessing && inputImage && targetImage) transformImageGreedy();
});
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'transformed-obamify.png';
    link.href = outputCanvas.toDataURL();
    link.click();
});
sizeSelect.addEventListener('change', () => {
    loadTargetImage();
    if (inputImage) {
        const size = parseInt(sizeSelect.value);
        inputCanvas.width = size;
        inputCanvas.height = size;
        inputCtx.drawImage(inputImage, 0, 0, size, size);
    }
});

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
        status.textContent = 'Error loading target image. Check that target_' + size + '.png exists.';
        console.error('Failed to load: target_' + size + '.png');
    };
    img.src = `target_${size}.png`;
}

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

// OPTIMIZED GREEDY ALGORITHM (Fast & Memory-Efficient)
// This uses a smart greedy approach: for each target pixel, find the best matching input pixel
// Much faster than Hungarian and uses minimal memory
async function transformImageGreedy() {
    if (isProcessing) return;

    isProcessing = true;
    transformBtn.disabled = true;
    downloadBtn.style.display = 'none';
    progressContainer.style.display = 'block';
    
    const size = parseInt(sizeSelect.value);
    const quality = parseInt(speedSlider.value);
    
    status.textContent = 'Processing image with greedy algorithm...';

    try {
        outputCanvas.width = size;
        outputCanvas.height = size;

        // Get pixel data
        const inputImageData = inputCtx.getImageData(0, 0, size, size);
        const targetImageData = targetCtx.getImageData(0, 0, size, size);
        const outputImageData = outputCtx.createImageData(size, size);

        const inputPixels = extractPixels(inputImageData);
        const targetPixels = extractPixels(targetImageData);
        const N = targetPixels.length;

        // Track which input pixels have been used
        const used = new Array(N).fill(false);

        status.textContent = 'Rearranging pixels using greedy optimization...';

        for (let i = 0; i < N; i++) {
            const targetPixel = targetPixels[i];
            let bestMatch = -1;
            let bestDistance = Infinity;

            // Find closest available pixel (with early exit for optimization)
            const searchLimit = Math.min(N, Math.max(100, Math.floor(N * (quality / 100))));
            let searchCount = 0;

            for (let j = 0; j < N && searchCount < searchLimit; j++) {
                if (used[j]) continue;

                const distance = colorDistanceSquared(targetPixel, inputPixels[j]);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = j;
                }
                searchCount++;
            }

            // Assign best match
            if (bestMatch !== -1) {
                setPixel(outputImageData, i, inputPixels[bestMatch]);
                used[bestMatch] = true;
            } else {
                // Fallback: use target pixel itself
                setPixel(outputImageData, i, targetPixel);
            }

            // Update progress
            if (i % Math.max(1, Math.floor(N / 100)) === 0) {
                updateProgressBar(i / N);
                await sleep(0);
            }
        }

        outputCtx.putImageData(outputImageData, 0, 0);
        updateProgressBar(1);
        status.textContent = 'Transformation complete! Download your result.';
        downloadBtn.style.display = 'inline-block';

    } catch (error) {
        status.textContent = 'Error: ' + error.message;
        console.error('Transformation error:', error);
    }

    isProcessing = false;
    transformBtn.disabled = false;
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000);
}

function extractPixels(imgData) {
    const arr = [];
    for (let i = 0; i < imgData.data.length; i += 4) {
        arr.push({
            r: imgData.data[i],
            g: imgData.data[i + 1],
            b: imgData.data[i + 2],
            a: imgData.data[i + 3]
        });
    }
    return arr;
}

function setPixel(imgData, idx, color) {
    const base = idx * 4;
    imgData.data[base] = color.r;
    imgData.data[base + 1] = color.g;
    imgData.data[base + 2] = color.b;
    imgData.data[base + 3] = color.a;
}

function colorDistanceSquared(p1, p2) {
    const dr = p1.r - p2.r;
    const dg = p1.g - p2.g;
    const db = p1.b - p2.b;
    return dr * dr + dg * dg + db * db;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateProgressBar(fraction) {
    const percentage = Math.floor(Math.min(Math.max(fraction, 0), 1) * 100);
    progressFill.style.width = percentage + '%';
    progressFill.textContent = percentage + '%';
}
