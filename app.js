// Photo Transformation: Hungarian (Munkres) Algorithm Edition (FIXED)
// Uses munkres-js for optimal pixel assignment
// (c) 2025, customized for hosni-mubaraker
//
// Include munkres-js via CDN in HTML (add before this script):
// <script src="https://cdn.jsdelivr.net/npm/munkres-js@1.2.2/munkres.min.js"></script>

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

window.addEventListener('load', () => loadTargetImage());
uploadBox.addEventListener('click', () => fileInput.click());
uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });
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
    if (!isProcessing && inputImage && targetImage) transformImageOptimal();
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
        status.textContent = 'Error loading target image. Please check the file exists.';
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

// Hungarian/Munkres optimal image transformation (fixed)
async function transformImageOptimal() {
    if (isProcessing) return;
    if (typeof Munkres === 'undefined') {
        status.textContent = 'munkres-js not found. Make sure you included the CDN before this script.';
        return;
    }

    isProcessing = true;
    transformBtn.disabled = true;
    downloadBtn.style.display = 'none';
    progressContainer.style.display = 'block';
    status.textContent = 'Calculating optimal transformation (this may be slow for large sizes)...';
    const size = parseInt(sizeSelect.value);

    try {
        outputCanvas.width = size;
        outputCanvas.height = size;

        // Get pixel arrays
        const inputImageData = inputCtx.getImageData(0, 0, size, size);
        const targetImageData = targetCtx.getImageData(0, 0, size, size);
        const outputImageData = outputCtx.createImageData(size, size);

        const inputPixels = extractPixels(inputImageData);   // length = N
        const targetPixels = extractPixels(targetImageData); // length = N

        if (inputPixels.length !== targetPixels.length) {
            throw new Error('Input and target have different pixel counts.');
        }

        const N = targetPixels.length;

        // Warn for very large N (optional)
        if (N > 256 * 256) {
            console.warn('Large assignment: this may be slow and memory-heavy.');
        }

        // Build cost matrix (use squared distance to avoid repeated sqrt)
        status.textContent = 'Building cost matrix...';
        const costMatrix = new Array(N);
        for (let i = 0; i < N; i++) {
            const t = targetPixels[i];
            // build row
            const row = new Array(N);
            for (let j = 0; j < N; j++) {
                const s = inputPixels[j];
                row[j] = colorDistanceSquared(t, s);
            }
            costMatrix[i] = row;

            // progress update every 64 rows (tweakable)
            if ((i & 63) === 0) updateProgressBar(i / N);
            // allow UI breathing room occasionally
            if ((i & 511) === 0) await sleep(0);
        }

        // Run munkres-js (Hungarian algorithm)
        status.textContent = 'Running Hungarian algorithm (optimal assignment)...';
        await sleep(50); // let UI update

        const munkres = new Munkres(); // correct usage
        const assignments = munkres.compute(costMatrix); // returns [[rowIndex, colIndex], ...]
        if (!Array.isArray(assignments) || assignments.length !== N) {
            // some implementations may return fewer assignments if tie/issue - but usually returns N
            console.warn('Unexpected assignment length:', assignments.length, 'expected:', N);
        }

        // Apply assignment to outputImageData
        status.textContent = 'Applying assignment to output image...';
        for (let k = 0; k < assignments.length; k++) {
            const pair = assignments[k];
            if (!pair || pair.length < 2) continue;
            const targetIdx = pair[0];
            const inputIdx = pair[1];

            // bounds safety
            if (targetIdx < 0 || targetIdx >= N || inputIdx < 0 || inputIdx >= N) continue;
            setPixel(outputImageData, targetIdx, inputPixels[inputIdx]);

            if ((k & 63) === 0) updateProgressBar(k / assignments.length);
            if ((k & 511) === 0) await sleep(0); // allow UI update
        }

        outputCtx.putImageData(outputImageData, 0, 0);
        updateProgressBar(1);
        status.textContent = 'Done! (Optimal pixel assignment finished)';
        downloadBtn.style.display = 'inline-block';
    } catch (error) {
        status.textContent = 'Transformation error: ' + (error && error.message ? error.message : error);
        console.error(error);
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
    // safety check (should never be out of bounds if idx valid)
    if (base + 3 >= imgData.data.length || base < 0) return;
    imgData.data[base] = color.r;
    imgData.data[base + 1] = color.g;
    imgData.data[base + 2] = color.b;
    imgData.data[base + 3] = color.a;
}

// squared Euclidean distance in RGB (faster than computing sqrt repeatedly)
function colorDistanceSquared(p1, p2) {
    const dr = p1.r - p2.r;
    const dg = p1.g - p2.g;
    const db = p1.b - p2.b;
    return dr * dr + dg * dg + db * db;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateProgressBar(fraction) {
    const percentage = Math.floor(Math.min(Math.max(fraction, 0), 1) * 100);
    progressFill.style.width = percentage + '%';
    progressFill.textContent = percentage + '%';
}
