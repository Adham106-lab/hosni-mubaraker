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
Request
{
  "branch": "main",
  "content": "// Photo Transformation: Hungarian (Munkres) Algorithm Edition\n// Uses munkres-js for optimal pixel assignment\n// (c) 2025, customized for hosni-mubaraker\n\n// Include munkres-js via CDN in HTML (add before this script):\n// <script src=\"https://cdn.jsdelivr.net/npm/munkres-js@1.2.2/munkres.min.js\"></script>\n\nlet inputImage = null;\nlet targetImage = null;\nlet isProcessing = false;\n\nconst inputCanvas = document.getElementById('inputCanvas');\nconst targetCanvas = document.getElementById('targetCanvas');\nconst outputCanvas = document.getElementById('outputCanvas');\nconst inputCtx = inputCanvas.getContext('2d');\nconst targetCtx = targetCanvas.getContext('2d');\nconst outputCtx = outputCanvas.getContext('2d');\n\nconst uploadBox = document.getElementById('uploadBox');\nconst fileInput = document.getElementById('fileInput');\nconst transformBtn = document.getElementById('transformBtn');\nconst sizeSelect = document.getElementById('sizeSelect');\nconst speedSlider = document.getElementById('speedSlider');\nconst speedValue = document.getElementById('speedValue');\nconst progressContainer = document.getElementById('progressContainer');\nconst progressFill = document.getElementById('progressFill');\nconst status = document.getElementById('status');\nconst downloadBtn = document.getElementById('downloadBtn');\n\nwindow.addEventListener('load', () => loadTargetImage());\nuploadBox.addEventListener('click', () => fileInput.click());\nuploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });\nuploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));\nuploadBox.addEventListener('drop', (e) => {\n    e.preventDefault();\n    uploadBox.classList.remove('dragover');\n    const file = e.dataTransfer.files[0];\n    if (file && file.type.startsWith('image/')) handleImageUpload(file);\n});\nfileInput.addEventListener('change', (e) => {\n    const file = e.target.files[0];\n    if (file) handleImageUpload(file);\n});\nspeedSlider.addEventListener('input', (e) => {\n    const value = e.target.value;\n    let label = 'Balanced';\n    if (value < 33) label = 'Fast (Lower Quality)';\n    else if (value > 66) label = 'Slow (Higher Quality)';\n    speedValue.textContent = label;\n});\ntransformBtn.addEventListener('click', () => {\n    if (!isProcessing && inputImage && targetImage) transformImageOptimal();\n});\ndownloadBtn.addEventListener('click', () => {\n    const link = document.createElement('a');\n    link.download = 'transformed-obamify.png';\n    link.href = outputCanvas.toDataURL();\n    link.click();\n});\nsizeSelect.addEventListener('change', () => {\n    loadTargetImage();\n    if (inputImage) {\n        const size = parseInt(sizeSelect.value);\n        inputCanvas.width = size;\n        inputCanvas.height = size;\n        inputCtx.drawImage(inputImage, 0, 0, size, size);\n    }\n});\nfunction loadTargetImage() {\n    const size = parseInt(sizeSelect.value);\n    const img = new Image();\n    img.crossOrigin = \"anonymous\";\n    img.onload = () => {\n        targetImage = img;\n        targetCanvas.width = size;\n        targetCanvas.height = size;\n        targetCtx.drawImage(img, 0, 0, size, size);\n        status.textContent = 'Target image loaded. Upload your photo to begin!';\n    };\n    img.onerror = () => {\n        status.textContent = 'Error loading target image. Please check the file exists.';\n    };\n    img.src = `target_${size}.png`;\n}\nfunction handleImageUpload(file) {\n    const reader = new FileReader();\n    reader.onload = (e) => {\n        const img = new Image();\n        img.onload = () => {\n            inputImage = img;\n            const size = parseInt(sizeSelect.value);\n            inputCanvas.width = size;\n            inputCanvas.height = size;\n            inputCtx.drawImage(img, 0, 0, size, size);\n            transformBtn.disabled = false;\n            status.textContent = 'Image loaded! Click \"Transform Photo\" to begin.';\n            downloadBtn.style.display = 'none';\n        };\n        img.src = e.target.result;\n    };\n    reader.readAsDataURL(file);\n}\n\n// Hungarian/Munkres optimal image transformation\nasync function transformImageOptimal() {\n    if (isProcessing) return;\n    isProcessing = true;\n    transformBtn.disabled = true;\n    downloadBtn.style.display = 'none';\n    progressContainer.style.display = 'block';\n    status.textContent = 'Calculating optimal transformation (this may be slow for 128x128 & 256x256!)...';\n    const size = parseInt(sizeSelect.value);\n    try {\n        outputCanvas.width = size;\n        outputCanvas.height = size;\n        // Get pixel arrays\n        const inputImageData = inputCtx.getImageData(0, 0, size, size);\n        const targetImageData = targetCtx.getImageData(0, 0, size, size);\n        const outputImageData = outputCtx.createImageData(size, size);\n        const inputPixels = extractPixels(inputImageData);\n        const targetPixels = extractPixels(targetImageData);\n        // Build cost matrix\n        status.textContent = 'Building cost matrix...';\n        const costMatrix = [];\n        for (let i = 0; i < targetPixels.length; i++) {\n            const t = targetPixels[i];\n            let row = [];\n            for (let j = 0; j < inputPixels.length; j++) {\n                const s = inputPixels[j];\n                row.push(colorDistance(t, s));\n            }\n            costMatrix.push(row);\n            if (i % 100 === 0) updateProgressBar(i / targetPixels.length);\n        }\n        // Run munkres-js (Hungarian algorithm)\n        status.textContent = 'Running optimal assignment (Hungarian algorithm)...';\n        await sleep(100); // Allow UI update\n        const assignments = Munkres(costMatrix); // munkres-js function\n        // Rearrange pixels\n        status.textContent = 'Applying transformation...';\n        for (let i = 0; i < assignments.length; i++) {\n            const [targetIdx, inputIdx] = assignments[i];\n            setPixel(outputImageData, targetIdx, inputPixels[inputIdx]);\n            if (i % 100 === 0) updateProgressBar(i / assignments.length);\n        }\n        outputCtx.putImageData(outputImageData, 0, 0);\n        updateProgressBar(1);\n        status.textContent = 'Done! (Optimal pixel assignment finished)';\n        downloadBtn.style.display = 'inline-block';\n    } catch (error) {\n        status.textContent = 'Transformation error: ' + error;\n        console.error(error);\n    }\n    isProcessing = false;\n    transformBtn.disabled = false;\n    setTimeout(() => {\n        progressContainer.style.display = 'none';\n    }, 2000);\n}\nfunction extractPixels(imgData) {\n    const arr = [];\n    for (let i = 0; i < imgData.data.length; i += 4) {\n        arr.push({\n            r: imgData.data[i],\n            g: imgData.data[i+1],\n            b: imgData.data[i+2],\n            a: imgData.data[i+3]\n        });\n    }\n    return arr;\n}\nfunction setPixel(imgData, idx, color) {\n    imgData.data[idx * 4] = color.r;\n    imgData.data[idx * 4 + 1] = color.g;\n    imgData.data[idx * 4 + 2] = color.b;\n    imgData.data[idx * 4 + 3] = color.a;\n}\nfunction colorDistance(p1, p2) { // Euclidean RGB distance\n    return Math.sqrt(\n        (p1.r - p2.r) ** 2 +\n        (p1.g - p2.g) ** 2 +\n        (p1.b - p2.b) ** 2\n    );\n}\nfunction sleep(ms) { return new Promise(r => setTimeout(r, ms)); }\nfunction updateProgressBar(fraction) {\n    const percentage = Math.floor(fraction * 100);\n    progressFill.style.width = percentage + '%';\n    progressFill.textContent = percentage + '%';\n}\n",
  "message": "feat: implement optimal pixel assignment(Hungarian algorithm) on images using munkres-js. See markdown report for details.",
  "owner": "Adham106-lab",
  "path": "app.js",
  "repo": "hosni-mubaraker",
  "sha": ""
}

Request
{
  "branch": "main",
  "content": "// Photo Transformation: Hungarian (Munkres) Algorithm Edition\n// Uses munkres-js for optimal pixel assignment\n// (c) 2025, customized for hosni-mubaraker\n\n// Include munkres-js via CDN in HTML (add before this script):\n// <script src=\"https://cdn.jsdelivr.net/npm/munkres-js@1.2.2/munkres.min.js\"></script>\n\nlet inputImage = null;\nlet targetImage = null;\nlet isProcessing = false;\n\nconst inputCanvas = document.getElementById('inputCanvas');\nconst targetCanvas = document.getElementById('targetCanvas');\nconst outputCanvas = document.getElementById('outputCanvas');\nconst inputCtx = inputCanvas.getContext('2d');\nconst targetCtx = targetCanvas.getContext('2d');\nconst outputCtx = outputCanvas.getContext('2d');\n\nconst uploadBox = document.getElementById('uploadBox');\nconst fileInput = document.getElementById('fileInput');\nconst transformBtn = document.getElementById('transformBtn');\nconst sizeSelect = document.getElementById('sizeSelect');\nconst speedSlider = document.getElementById('speedSlider');\nconst speedValue = document.getElementById('speedValue');\nconst progressContainer = document.getElementById('progressContainer');\nconst progressFill = document.getElementById('progressFill');\nconst status = document.getElementById('status');\nconst downloadBtn = document.getElementById('downloadBtn');\n\nwindow.addEventListener('load', () => loadTargetImage());\nuploadBox.addEventListener('click', () => fileInput.click());\nuploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });\nuploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));\nuploadBox.addEventListener('drop', (e) => {\n    e.preventDefault();\n    uploadBox.classList.remove('dragover');\n    const file = e.dataTransfer.files[0];\n    if (file && file.type.startsWith('image/')) handleImageUpload(file);\n});\nfileInput.addEventListener('change', (e) => {\n    const file = e.target.files[0];\n    if (file) handleImageUpload(file);\n});\nspeedSlider.addEventListener('input', (e) => {\n    const value = e.target.value;\n    let label = 'Balanced';\n    if (value < 33) label = 'Fast (Lower Quality)';\n    else if (value > 66) label = 'Slow (Higher Quality)';\n    speedValue.textContent = label;\n});\ntransformBtn.addEventListener('click', () => {\n    if (!isProcessing && inputImage && targetImage) transformImageOptimal();\n});\ndownloadBtn.addEventListener('click', () => {\n    const link = document.createElement('a');\n    link.download = 'transformed-obamify.png';\n    link.href = outputCanvas.toDataURL();\n    link.click();\n});\nsizeSelect.addEventListener('change', () => {\n    loadTargetImage();\n    if (inputImage) {\n        const size = parseInt(sizeSelect.value);\n        inputCanvas.width = size;\n        inputCanvas.height = size;\n        inputCtx.drawImage(inputImage, 0, 0, size, size);\n    }\n});\nfunction loadTargetImage() {\n    const size = parseInt(sizeSelect.value);\n    const img = new Image();\n    img.crossOrigin = \"anonymous\";\n    img.onload = () => {\n        targetImage = img;\n        targetCanvas.width = size;\n        targetCanvas.height = size;\n        targetCtx.drawImage(img, 0, 0, size, size);\n        status.textContent = 'Target image loaded. Upload your photo to begin!';\n    };\n    img.onerror = () => {\n        status.textContent = 'Error loading target image. Please check the file exists.';\n    };\n    img.src = `target_${size}.png`;\n}\nfunction handleImageUpload(file) {\n    const reader = new FileReader();\n    reader.onload = (e) => {\n        const img = new Image();\n        img.onload = () => {\n            inputImage = img;\n            const size = parseInt(sizeSelect.value);\n            inputCanvas.width = size;\n            inputCanvas.height = size;\n            inputCtx.drawImage(img, 0, 0, size, size);\n            transformBtn.disabled = false;\n            status.textContent = 'Image loaded! Click \"Transform Photo\" to begin.';\n            downloadBtn.style.display = 'none';\n        };\n        img.src = e.target.result;\n    };\n    reader.readAsDataURL(file);\n}\n\n// Hungarian/Munkres optimal image transformation\nasync function transformImageOptimal() {\n    if (isProcessing) return;\n    isProcessing = true;\n    transformBtn.disabled = true;\n    downloadBtn.style.display = 'none';\n    progressContainer.style.display = 'block';\n    status.textContent = 'Calculating optimal transformation (this may be slow for 128x128 & 256x256!)...';\n    const size = parseInt(sizeSelect.value);\n    try {\n        outputCanvas.width = size;\n        outputCanvas.height = size;\n        // Get pixel arrays\n        const inputImageData = inputCtx.getImageData(0, 0, size, size);\n        const targetImageData = targetCtx.getImageData(0, 0, size, size);\n        const outputImageData = outputCtx.createImageData(size, size);\n        const inputPixels = extractPixels(inputImageData);\n        const targetPixels = extractPixels(targetImageData);\n        // Build cost matrix\n        status.textContent = 'Building cost matrix...';\n        const costMatrix = [];\n        for (let i = 0; i < targetPixels.length; i++) {\n            const t = targetPixels[i];\n            let row = [];\n            for (let j = 0; j < inputPixels.length; j++) {\n                const s = inputPixels[j];\n                row.push(colorDistance(t, s));\n            }\n            costMatrix.push(row);\n            if (i % 100 === 0) updateProgressBar(i / targetPixels.length);\n        }\n        // Run munkres-js (Hungarian algorithm)\n        status.textContent = 'Running optimal assignment (Hungarian algorithm)...';\n        await sleep(100); // Allow UI update\n        const assignments = Munkres(costMatrix); // munkres-js function\n        // Rearrange pixels\n        status.textContent = 'Applying transformation...';\n        for (let i = 0; i < assignments.length; i++) {\n            const [targetIdx, inputIdx] = assignments[i];\n            setPixel(outputImageData, targetIdx, inputPixels[inputIdx]);\n            if (i % 100 === 0) updateProgressBar(i / assignments.length);\n        }\n        outputCtx.putImageData(outputImageData, 0, 0);\n        updateProgressBar(1);\n        status.textContent = 'Done! (Optimal pixel assignment finished)';\n        downloadBtn.style.display = 'inline-block';\n    } catch (error) {\n        status.textContent = 'Transformation error: ' + error;\n        console.error(error);\n    }\n    isProcessing = false;\n    transformBtn.disabled = false;\n    setTimeout(() => {\n        progressContainer.style.display = 'none';\n    }, 2000);\n}\nfunction extractPixels(imgData) {\n    const arr = [];\n    for (let i = 0; i < imgData.data.length; i += 4) {\n        arr.push({\n            r: imgData.data[i],\n            g: imgData.data[i+1],\n            b: imgData.data[i+2],\n            a: imgData.data[i+3]\n        });\n    }\n    return arr;\n}\nfunction setPixel(imgData, idx, color) {\n    imgData.data[idx * 4] = color.r;\n    imgData.data[idx * 4 + 1] = color.g;\n    imgData.data[idx * 4 + 2] = color.b;\n    imgData.data[idx * 4 + 3] = color.a;\n}\nfunction colorDistance(p1, p2) { // Euclidean RGB distance\n    return Math.sqrt(\n        (p1.r - p2.r) ** 2 +\n        (p1.g - p2.g) ** 2 +\n        (p1.b - p2.b) ** 2\n    );\n}\nfunction sleep(ms) { return new Promise(r => setTimeout(r, ms)); }\nfunction updateProgressBar(fraction) {\n    const percentage = Math.floor(fraction * 100);\n    progressFill.style.width = percentage + '%';\n    progressFill.textContent = percentage + '%';\n}\n",
  "message": "feat: implement optimal pixel assignment(Hungarian algorithm) on images using munkres-js. See markdown report for details.",
  "owner": "Adham106-lab",
  "path": "app.js",
  "repo": "hosni-mubaraker",
  "sha": ""
}
