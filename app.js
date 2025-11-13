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
    const value = e.target.val
