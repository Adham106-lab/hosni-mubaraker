// Photo Transformation: Hungarian (Munkres) Algorithm Edition
// Uses munkres-js for optimal pixel assignment
// (c) 2025, customized for hosni-mubaraker

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

// Hungarian/Munkres optimal image transformation
async function transformImageOptimal() {
    if (isProcessing) return;
    isProcessing = true;
    transformBtn.disabled = true;
    downloadBtn.style.display = 'none';
    progressContainer.style.display = 'block';
    status.textContent = 'Calculating optimal transformation (this may be slow for 128x128 & 256x256!)...';
    const size = parseInt(sizeSelect.value);
    try {
        outputCanvas.width = size;
        outputCanvas.height = size;
        // Get pixel arrays
        const inputImageData = inputCtx.getImageData(0, 0, size, size);
        const targetImageData = targetCtx.getImageData(0, 0, size, size);
        const outputImageData = outputCtx.createImageData(size, size);
        const inputPixels = extractPixels(inputImageData);
        const targetPixels = extractPixels(targetImageData);
        // Build cost matrix
        status.textContent = 'Building cost matrix...';
        const costMatrix = [];
        for (let i = 0; i < targetPixels.length; i++) {
            const t = targetPixels[i];
            let row = [];
            for (let j = 0; j < inputPixels.length; j++) {
                const s = inputPixels[j];
                row.push(colorDistance(t, s));
            }
            costMatrix.push(row);
            if (i % 100 === 0) updateProgressBar(i / targetPixels.length);
        }
        // Run munkres-js (Hungarian algorithm)
        status.textContent = 'Running optimal assignment (Hungarian algorithm)...';
        await sleep(100); // Allow UI update
        const assignments = Munkres(costMatrix); // munkres-js function
        // Rearrange pixels
        status.textContent = 'Applying transformation...';
        for (let i = 0; i < assignments.length; i++) {
            const [targetIdx, inputIdx] = assignments[i];
            setPixel(outputImageData, targetIdx, inputPixels[inputIdx]);
            if (i % 100 === 0) updateProgressBar(i / assignments.length);
        }
        outputCtx.putImageData(outputImageData, 0, 0);
        updateProgressBar(1);
        status.textContent = 'Done! (Optimal pixel assignment finished)';
        downloadBtn.style.display = 'inline-block';
    } catch (error) {
        status.textContent = 'Transformation error: ' + error;
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
            g: imgData.data[i+1],
            b: imgData.data[i+2],
            a: imgData.data[i+3]
        });
    }
    return arr;
}
function setPixel(imgData, idx, color) {
    imgData.data[idx * 4] = color.r;
    imgData.data[idx * 4 + 1] = color.g;
    imgData.data[idx * 4 + 2] = color.b;
    imgData.data[idx * 4 + 3] = color.a;
}
function colorDistance(p1, p2) { // Euclidean RGB distance
    return Math.sqrt(
        (p1.r - p2.r) ** 2 +
        (p1.g - p2.g) ** 2 +
        (p1.b - p2.b) ** 2
    );
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function updateProgressBar(fraction) {
    const percentage = Math.floor(fraction * 100);
    progressFill.style.width = percentage + '%';
    progressFill.textContent = percentage + '%';
}
