const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Default state
const defaultState = {
  pageSize: 'A4',
  orientation: 'landscape',
  hexSize: 20,
  color: '#000000'
};

let state = { ...defaultState };
let undoStack = [];
let redoStack = [];

function mmToPx(mm) {
  // 96 dpi => 1 inch = 25.4mm => 96/25.4 px per mm
  return (mm * 96) / 25.4;
}

const pageDimensions = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 216, height: 279 }
};

function loadState() {
  try {
    const saved = localStorage.getItem('tta_state');
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

function saveState() {
  localStorage.setItem('tta_state', JSON.stringify(state));
}

function pushUndo() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state));
  state = JSON.parse(undoStack.pop());
  updateUI();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  state = JSON.parse(redoStack.pop());
  updateUI();
}

function updateHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

function setupProperties() {
  const container = document.getElementById('propertiesContent');
  container.innerHTML = `
    <label for="pageSize">Page Size</label>
    <select id="pageSize">
      <option value="A4">A4</option>
      <option value="A3">A3</option>
      <option value="Letter">Letter</option>
    </select>
    <label for="orientation">Orientation</label>
    <select id="orientation">
      <option value="portrait">Portrait</option>
      <option value="landscape">Landscape</option>
    </select>
    <label for="hexSize">Hex Size (mm)</label>
    <input type="number" id="hexSize" min="5" max="100" step="1" />
    <label for="color">Line Color</label>
    <input type="color" id="color" />
  `;

  ['pageSize', 'orientation', 'hexSize', 'color'].forEach(id => {
    const el = document.getElementById(id);
    el.value = state[id];
    el.addEventListener('change', () => {
      pushUndo();
      state[id] = id === 'hexSize' ? parseFloat(el.value) : el.value;
      updateUI();
    });
  });
}

function resizeCanvas() {
  const dims = pageDimensions[state.pageSize];
  const width = state.orientation === 'landscape' ? dims.height : dims.width;
  const height = state.orientation === 'landscape' ? dims.width : dims.height;
  canvas.width = mmToPx(width);
  canvas.height = mmToPx(height);
}

function drawGrid() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = state.color;

  const size = mmToPx(state.hexSize);
  const w = canvas.width;
  const h = canvas.height;
  const hexHeight = Math.sin(Math.PI / 3) * size;
  const hexWidth = size * 3 / 2;

  for (let y = 0; y < h + hexHeight; y += hexHeight) {
    const offset = (Math.round(y / hexHeight) % 2) * (hexWidth / 2);
    for (let x = 0; x < w + hexWidth; x += hexWidth) {
      drawHex(x + offset, y, size);
    }
  }
}

function drawHex(x, y, size) {
  const h = Math.sin(Math.PI / 3) * size;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size / 2, y + h);
  ctx.lineTo(x + size / 2 + size, y + h);
  ctx.lineTo(x + size * 2, y);
  ctx.lineTo(x + size / 2 + size, y - h);
  ctx.lineTo(x + size / 2, y - h);
  ctx.closePath();
  ctx.stroke();
}

function updateUI() {
  ['pageSize', 'orientation', 'hexSize', 'color'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = state[id];
  });
  drawGrid();
  saveState();
  updateHistoryButtons();
}

function exportCanvas() {
  const format = prompt('Export format (png/pdf)?', 'png');
  if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(state.orientation === 'landscape' ? 'landscape' : 'portrait', 'mm', state.pageSize);
    const data = canvas.toDataURL('image/png');
    pdf.addImage(data, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save('grid.pdf');
  } else {
    const link = document.createElement('a');
    link.download = 'grid.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

function init() {
  loadState();
  setupProperties();
  updateUI();
  document.getElementById('exportBtn').addEventListener('click', exportCanvas);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
}

init();
