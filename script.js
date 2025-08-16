const mmToPx = 3.7795275591; // approximate conversion

const pageSizes = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 }
};

const pageSizeEl = document.getElementById('pageSize');
const orientationEl = document.getElementById('orientation');
const pageWidthEl = document.getElementById('pageWidth');
const pageHeightEl = document.getElementById('pageHeight');
const gridTypeEl = document.getElementById('gridType');
const gridSizeEl = document.getElementById('gridSize');
const marginAllEl = document.getElementById('marginAll');
const toggleMarginsBtn = document.getElementById('toggleMargins');
const advancedMargins = document.getElementById('advancedMargins');
const marginTopEl = document.getElementById('marginTop');
const marginRightEl = document.getElementById('marginRight');
const marginBottomEl = document.getElementById('marginBottom');
const marginLeftEl = document.getElementById('marginLeft');
const bgImageInput = document.getElementById('bgImage');
const bgImg = document.getElementById('bg');
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

function updatePageSizeFields() {
  const size = pageSizes[pageSizeEl.value];
  if (size) {
    const orientation = orientationEl.value;
    pageWidthEl.value = orientation === 'portrait' ? size.width : size.height;
    pageHeightEl.value = orientation === 'portrait' ? size.height : size.width;
  }
  render();
}

pageSizeEl.addEventListener('change', updatePageSizeFields);
orientationEl.addEventListener('change', updatePageSizeFields);

[pageWidthEl, pageHeightEl, gridTypeEl, gridSizeEl].forEach(el => el.addEventListener('change', render));

marginAllEl.addEventListener('change', () => {
  const v = Number(marginAllEl.value);
  ['Top', 'Right', 'Bottom', 'Left'].forEach(dir => {
    const el = document.getElementById('margin' + dir);
    el.value = v;
  });
  render();
});

[marginTopEl, marginRightEl, marginBottomEl, marginLeftEl].forEach(el => {
  el.addEventListener('change', render);
});

toggleMarginsBtn.addEventListener('click', () => {
  advancedMargins.classList.toggle('hidden');
});

function getMargins() {
  return {
    top: Number(marginTopEl.value),
    right: Number(marginRightEl.value),
    bottom: Number(marginBottomEl.value),
    left: Number(marginLeftEl.value)
  };
}

function setCanvasSize() {
  const width = Number(pageWidthEl.value) * mmToPx;
  const height = Number(pageHeightEl.value) * mmToPx;
  canvas.width = width;
  canvas.height = height;
}

function drawSquareGrid(width, height, gridSize, margins) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  const startX = margins.left * mmToPx;
  const startY = margins.top * mmToPx;
  const endX = width - margins.right * mmToPx;
  const endY = height - margins.bottom * mmToPx;

  // vertical lines
  for (let x = startX; x <= endX; x += gridSize * mmToPx) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  // horizontal lines
  for (let y = startY; y <= endY; y += gridSize * mmToPx) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}

function drawHexGrid(width, height, gridSize, margins) {
  const side = gridSize * mmToPx;
  const hexHeight = Math.sin(Math.PI / 3) * side;
  const hexWidth = side * 1.5;
  const startX = margins.left * mmToPx;
  const startY = margins.top * mmToPx;
  const endX = width - margins.right * mmToPx;
  const endY = height - margins.bottom * mmToPx;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;

  for (let y = startY; y <= endY + hexHeight; y += hexHeight) {
    const row = Math.round((y - startY) / hexHeight);
    for (let x = startX + (row % 2 ? hexWidth / 2 : 0); x <= endX + hexWidth; x += hexWidth) {
      drawHexagon(x, y, side);
    }
  }
}

function drawHexagon(x, y, side) {
  const h = Math.sin(Math.PI / 3) * side;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + side / 2, y + h);
  ctx.lineTo(x + side / 2, y + h + side);
  ctx.lineTo(x, y + 2 * h + side);
  ctx.lineTo(x - side / 2, y + h + side);
  ctx.lineTo(x - side / 2, y + h);
  ctx.closePath();
  ctx.stroke();
}

function render() {
  setCanvasSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const margins = getMargins();
  const gridSize = Number(gridSizeEl.value);
  if (gridTypeEl.value === 'square') {
    drawSquareGrid(canvas.width, canvas.height, gridSize, margins);
  } else {
    drawHexGrid(canvas.width, canvas.height, gridSize, margins);
  }
}

bgImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    bgImg.src = evt.target.result;
    bgImg.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

let isDragging = false;
let dragStart = { x: 0, y: 0 };
let imgPos = { x: 0, y: 0 };
let scale = 1;

bgImg.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX - imgPos.x, y: e.clientY - imgPos.y };
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  imgPos = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
  updateImageTransform();
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

bgImg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.max(0.1, scale + delta);
  updateImageTransform();
});

function updateImageTransform() {
  bgImg.style.transform = `translate(${imgPos.x}px, ${imgPos.y}px) scale(${scale})`;
}

updatePageSizeFields();
render();
