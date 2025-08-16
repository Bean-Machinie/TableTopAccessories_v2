const dpi = 96 / 25.4; // pixels per mm

const workspace = document.getElementById('workspace');
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');
const bgImg = document.getElementById('background');

// UI elements
const toggleSettingsBtn = document.getElementById('toggle-settings');
const settingsPanel = document.getElementById('settings-panel');
const pageSizeSelect = document.getElementById('page-size');
const pageWidthInput = document.getElementById('page-width');
const pageHeightInput = document.getElementById('page-height');
const marginAllInput = document.getElementById('margin-all');
const marginTopInput = document.getElementById('margin-top');
const marginRightInput = document.getElementById('margin-right');
const marginBottomInput = document.getElementById('margin-bottom');
const marginLeftInput = document.getElementById('margin-left');
const toggleMarginAdvanced = document.getElementById('toggle-margin-advanced');
const marginAdvanced = document.getElementById('margin-advanced');
const gridTypeSelect = document.getElementById('grid-type');
const gridSizeInput = document.getElementById('grid-size');
const bgImageInput = document.getElementById('bg-image');

// Toggle settings panel
 toggleSettingsBtn.addEventListener('click', () => {
    const expanded = toggleSettingsBtn.getAttribute('aria-expanded') === 'true';
    toggleSettingsBtn.setAttribute('aria-expanded', String(!expanded));
    settingsPanel.hidden = expanded;
 });

// Page size options
const pageSizes = {
    a4: { w: 297, h: 210 },
    letter: { w: 279, h: 216 }
};

function updateFromPageSize() {
    const val = pageSizeSelect.value;
    if (pageSizes[val]) {
        pageWidthInput.value = pageSizes[val].w;
        pageHeightInput.value = pageSizes[val].h;
    }
    draw();
}
pageSizeSelect.addEventListener('change', updateFromPageSize);

function setCustomPage() {
    pageSizeSelect.value = 'custom';
    draw();
}
pageWidthInput.addEventListener('input', setCustomPage);
pageHeightInput.addEventListener('input', setCustomPage);

// Margin handling
function updateMarginsFromAll() {
    const val = marginAllInput.value;
    marginTopInput.value = val;
    marginRightInput.value = val;
    marginBottomInput.value = val;
    marginLeftInput.value = val;
    draw();
}
marginAllInput.addEventListener('input', updateMarginsFromAll);

[marginTopInput, marginRightInput, marginBottomInput, marginLeftInput].forEach(inp => {
    inp.addEventListener('input', draw);
});

toggleMarginAdvanced.addEventListener('click', () => {
    const expanded = toggleMarginAdvanced.getAttribute('aria-expanded') === 'true';
    toggleMarginAdvanced.setAttribute('aria-expanded', String(!expanded));
    marginAdvanced.hidden = expanded;
});

// Grid options
[gridTypeSelect, gridSizeInput].forEach(el => el.addEventListener('input', draw));

// Background image
bgImageInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        bgImg.src = evt.target.result;
        bgImg.style.left = '0px';
        bgImg.style.top = '0px';
    };
    reader.readAsDataURL(file);
});

// Drag background
let dragging = false;
let startX = 0, startY = 0;
bgImg.addEventListener('pointerdown', e => {
    dragging = true;
    startX = e.clientX - bgImg.offsetLeft;
    startY = e.clientY - bgImg.offsetTop;
    bgImg.setPointerCapture(e.pointerId);
});

bgImg.addEventListener('pointermove', e => {
    if (!dragging) return;
    bgImg.style.left = `${e.clientX - startX}px`;
    bgImg.style.top = `${e.clientY - startY}px`;
});

bgImg.addEventListener('pointerup', () => {
    dragging = false;
});

function draw() {
    const widthMm = parseFloat(pageWidthInput.value) || 0;
    const heightMm = parseFloat(pageHeightInput.value) || 0;
    const widthPx = widthMm * dpi;
    const heightPx = heightMm * dpi;

    workspace.style.width = `${widthPx}px`;
    workspace.style.height = `${heightPx}px`;

    const mTop = parseFloat(marginTopInput.value) * dpi || 0;
    const mRight = parseFloat(marginRightInput.value) * dpi || 0;
    const mBottom = parseFloat(marginBottomInput.value) * dpi || 0;
    const mLeft = parseFloat(marginLeftInput.value) * dpi || 0;

    const canvasWidth = widthPx - mLeft - mRight;
    const canvasHeight = heightPx - mTop - mBottom;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.left = `${mLeft}px`;
    canvas.style.top = `${mTop}px`;

    ctx.clearRect(0,0,canvasWidth, canvasHeight);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    const gridSizeMm = parseFloat(gridSizeInput.value) || 1;
    const spacing = gridSizeMm * dpi;
    const type = gridTypeSelect.value;

    if (type === 'square') {
        for (let x = 0; x <= canvasWidth; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x,0);
            ctx.lineTo(x,canvasHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= canvasHeight; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0,y);
            ctx.lineTo(canvasWidth,y);
            ctx.stroke();
        }
    } else {
        const hexHeight = spacing * Math.sqrt(3);
        const hexWidth = spacing * 2;
        const vert = hexHeight;
        const horiz = 3/2 * spacing;
        ctx.beginPath();
        for (let y = 0, row = 0; y < canvasHeight + hexHeight; y += vert, row++) {
            for (let x = (row % 2) * horiz; x < canvasWidth + hexWidth; x += hexWidth) {
                drawHex(x, y, spacing);
            }
        }
        ctx.stroke();
    }
}

function drawHex(x, y, r) {
    const h = Math.sqrt(3) * r;
    ctx.moveTo(x, y);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + 1.5*r, y + h/2);
    ctx.lineTo(x + r, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - 0.5*r, y + h/2);
    ctx.closePath();
}

updateFromPageSize();
updateMarginsFromAll();
draw();

