/**
 * HAMMING CODE SIMULATOR - PRO EDITION
 * 64-bit Single-Bit Error Correction (SEC)
 * 71-bit Codeword
 */

// =====================================================
// GLOBAL STATE & WORKFLOW
// =====================================================
const STATE_INITIAL = 'INITIAL';
const STATE_ENCODED = 'ENCODED';
const STATE_INJECTED = 'ERROR_INJECTED';
const STATE_DETECTED = 'ERROR_DETECTED';
const STATE_CORRECTED = 'CORRECTED';
const STATE_VERIFIED = 'VERIFIED';

const AppState = {
  workflowState: STATE_INITIAL,
  
  // Data
  originalData: '',
  encodedCodeword: [],
  parityPositions: [1, 2, 4, 8, 16, 32, 64],
  
  // Transmission / Error Injection
  corruptedCodeword: [],
  injectedErrorPosition: 0,
  
  // Detection
  syndrome: 0,
  syndromeBits: [], // P64, P32, P16, P8, P4, P2, P1
  detectedErrorPosition: 0,
  
  // Correction
  correctedCodeword: [],
  extractedData: ''
};

// =====================================================
// ALGORITHM CORE (Strictly 71-bit SEC)
// =====================================================

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

function encodeHamming(data) {
  const m = 64;
  const r = 7;
  const n = 71;
  
  let encoded = new Array(n).fill(0);
  
  // 1. Place data bits
  let dataIdx = 0;
  for (let i = 1; i <= n; i++) {
    if (!isPowerOfTwo(i)) {
      encoded[i - 1] = parseInt(data[dataIdx++]);
    }
  }

  // 2. Calculate parity bits
  const parityPos = [1, 2, 4, 8, 16, 32, 64];
  for (const p of parityPos) {
    let parity = 0;
    for (let i = 1; i <= n; i++) {
      if ((i & p) !== 0 && i !== p) {
        parity ^= encoded[i - 1];
      }
    }
    encoded[p - 1] = parity;
  }
  
  return encoded;
}

function calculateSyndrome(data) {
  const parityPos = [1, 2, 4, 8, 16, 32, 64];
  let syndrome = 0;
  let pChecks = []; // order: P1, P2, P4, P8, P16, P32, P64
  
  for (const p of parityPos) {
    let check = 0;
    for (let i = 1; i <= data.length; i++) {
      if ((i & p) !== 0) {
        check ^= data[i - 1];
      }
    }
    pChecks.push(check);
    if (check !== 0) {
      syndrome += p;
    }
  }
  return { syndrome, pChecks };
}

function extractData(codeword) {
  let extracted = '';
  for (let i = 1; i <= codeword.length; i++) {
    if (!isPowerOfTwo(i)) {
      extracted += codeword[i - 1];
    }
  }
  return extracted;
}

// =====================================================
// UI LOGIC & NAVIGATION
// =====================================================

function updateWorkflowState(newState) {
  AppState.workflowState = newState;
  
  // Update state pill in topbar
  const stateText = document.getElementById('stateText');
  const statePill = document.getElementById('statePill');
  
  stateText.innerText = newState;
  statePill.className = 'state-pill ' + newState.toLowerCase();
  
  // Update Sidebar Workflow indicators
  const stages = [
    { id: 'input', activeStates: [STATE_INITIAL, STATE_ENCODED, STATE_INJECTED, STATE_DETECTED, STATE_CORRECTED, STATE_VERIFIED] },
    { id: 'encode', activeStates: [STATE_ENCODED, STATE_INJECTED, STATE_DETECTED, STATE_CORRECTED, STATE_VERIFIED] },
    { id: 'inject', activeStates: [STATE_INJECTED, STATE_DETECTED, STATE_CORRECTED, STATE_VERIFIED] },
    { id: 'detect', activeStates: [STATE_DETECTED, STATE_CORRECTED, STATE_VERIFIED] },
    { id: 'correct', activeStates: [STATE_CORRECTED, STATE_VERIFIED] },
    { id: 'verify', activeStates: [STATE_VERIFIED] }
  ];

  stages.forEach((stage, idx) => {
    const row = document.getElementById(`swf-${stage.id}`);
    const tag = document.getElementById(`swft-${stage.id}`);
    const dashNode = document.getElementById(`wfn-${idx + 1}`);
    const dashBdg = document.getElementById(`wfb-${idx + 1}`);
    
    if (stage.activeStates.includes(newState)) {
      if (row) row.className = 'swf-row completed';
      if (tag) { tag.innerText = 'COMPLETED'; tag.className = 'swf-tag completed'; }
      if (dashNode) dashNode.className = 'wfn completed';
      if (dashBdg) { dashBdg.innerText = 'COMPLETED'; dashBdg.className = 'wfn-bdg completed'; }
    } else {
      // Find the "ready" stage (the next logical one)
      const isReady = (
        (newState === STATE_INITIAL && stage.id === 'encode') ||
        (newState === STATE_ENCODED && stage.id === 'inject') ||
        (newState === STATE_INJECTED && stage.id === 'detect') ||
        (newState === STATE_DETECTED && stage.id === 'correct') ||
        (newState === STATE_CORRECTED && stage.id === 'verify')
      );
      
      if (isReady) {
        if (row) row.className = 'swf-row ready';
        if (tag) { tag.innerText = 'READY'; tag.className = 'swf-tag ready'; }
        if (dashNode) dashNode.className = 'wfn ready';
        if (dashBdg) { dashBdg.innerText = 'READY'; dashBdg.className = 'wfn-bdg ready'; }
      } else {
        if (row) row.className = 'swf-row locked';
        if (tag) { tag.innerText = 'LOCKED'; tag.className = 'swf-tag locked'; }
        if (dashNode) dashNode.className = 'wfn locked';
        if (dashBdg) { dashBdg.innerText = 'LOCKED'; dashBdg.className = 'wfn-bdg locked'; }
      }
    }
  });

  // Specifically handle the "Input" stage for initial
  if (newState === STATE_INITIAL) {
    const irow = document.getElementById('swf-input');
    const itag = document.getElementById('swft-input');
    const dnode = document.getElementById('wfn-1');
    const dbdg = document.getElementById('wfb-1');
    
    if (irow) irow.className = 'swf-row ready';
    if (itag) { itag.innerText = 'READY'; itag.className = 'swf-tag ready'; }
    if (dnode) dnode.className = 'wfn ready';
    if (dbdg) { dbdg.innerText = 'READY'; dbdg.className = 'wfn-bdg ready'; }
  }

  updateLocksAndBadges();
}

function updateLocksAndBadges() {
  const s = AppState.workflowState;
  
  const encBadge = document.getElementById('enc-badge');
  const injBadge = document.getElementById('inj-badge');
  const detBadge = document.getElementById('det-badge');
  const corBadge = document.getElementById('cor-badge');
  const vfyBadge = document.getElementById('vfy-badge');
  
  const setBadge = (el, text, cls) => { if(el) { el.innerText = text; el.className = `stage-bdg ${cls}`; } };
  
  if (s === STATE_INITIAL) {
    setBadge(encBadge, '● READY', 'ready');
    setBadge(injBadge, '○ WAITING', 'waiting');
    setBadge(detBadge, '○ WAITING', 'waiting');
    setBadge(corBadge, '○ WAITING', 'waiting');
    setBadge(vfyBadge, '○ WAITING', 'waiting');
  } else if (s === STATE_ENCODED) {
    setBadge(encBadge, '✓ COMPLETED', 'completed');
    setBadge(injBadge, '● READY', 'ready');
    setBadge(detBadge, '○ WAITING', 'waiting');
    setBadge(corBadge, '○ WAITING', 'waiting');
    setBadge(vfyBadge, '○ WAITING', 'waiting');
  } else if (s === STATE_INJECTED) {
    setBadge(encBadge, '✓ COMPLETED', 'completed');
    setBadge(injBadge, '✓ COMPLETED', 'completed');
    setBadge(detBadge, '● READY', 'ready');
    setBadge(corBadge, '○ WAITING', 'waiting');
    setBadge(vfyBadge, '○ WAITING', 'waiting');
  } else if (s === STATE_DETECTED) {
    setBadge(encBadge, '✓ COMPLETED', 'completed');
    setBadge(injBadge, '✓ COMPLETED', 'completed');
    setBadge(detBadge, '✓ COMPLETED', 'completed');
    setBadge(corBadge, '● READY', 'ready');
    setBadge(vfyBadge, '○ WAITING', 'waiting');
  } else if (s === STATE_CORRECTED) {
    setBadge(encBadge, '✓ COMPLETED', 'completed');
    setBadge(injBadge, '✓ COMPLETED', 'completed');
    setBadge(detBadge, '✓ COMPLETED', 'completed');
    setBadge(corBadge, '✓ COMPLETED', 'completed');
    setBadge(vfyBadge, '● READY', 'ready');
  } else if (s === STATE_VERIFIED) {
    setBadge(encBadge, '✓ COMPLETED', 'completed');
    setBadge(injBadge, '✓ COMPLETED', 'completed');
    setBadge(detBadge, '✓ COMPLETED', 'completed');
    setBadge(corBadge, '✓ COMPLETED', 'completed');
    setBadge(vfyBadge, '✓ COMPLETED', 'completed');
  }

  // Handle Workspace visibility
  const show = (elId) => { const el = document.getElementById(elId); if(el) el.classList.remove('hidden'); };
  const hide = (elId) => { const el = document.getElementById(elId); if(el) el.classList.add('hidden'); };
  
  if (s === STATE_INITIAL) {
    show('inj-lock'); hide('inj-workspace');
    show('det-lock'); hide('det-workspace');
    show('cor-lock'); hide('cor-workspace');
    show('vfy-lock'); hide('vfy-workspace');
  } else if (s === STATE_ENCODED) {
    hide('inj-lock'); show('inj-workspace');
    show('det-lock'); hide('det-workspace');
    show('cor-lock'); hide('cor-workspace');
    show('vfy-lock'); hide('vfy-workspace');
  } else if (s === STATE_INJECTED) {
    hide('inj-lock'); show('inj-workspace');
    hide('det-lock'); show('det-workspace');
    show('cor-lock'); hide('cor-workspace');
    show('vfy-lock'); hide('vfy-workspace');
  } else if (s === STATE_DETECTED) {
    hide('inj-lock'); show('inj-workspace');
    hide('det-lock'); show('det-workspace');
    hide('cor-lock'); show('cor-workspace');
    show('vfy-lock'); hide('vfy-workspace');
  } else { // CORRECTED or VERIFIED
    hide('inj-lock'); show('inj-workspace');
    hide('det-lock'); show('det-workspace');
    hide('cor-lock'); show('cor-workspace');
    hide('vfy-lock'); show('vfy-workspace');
  }
}

window.gotoPage = function(pageId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  
  const targetBtn = document.querySelector(`.nav-btn[data-target="${pageId}"]`);
  if(targetBtn) targetBtn.classList.add('active');
  
  const targetPage = document.getElementById(pageId);
  if(targetPage) targetPage.classList.remove('hidden');
  
  const crumb = document.getElementById('topbarCrumb');
  if(crumb && targetBtn) crumb.innerText = targetBtn.innerText.trim();

  // Special hooks for Mathematics tab
  if (pageId === 'pg-math') {
    populateMathTab();
  }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    gotoPage(e.currentTarget.dataset.target);
  });
});

// Setup Math Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    
    const target = e.currentTarget;
    target.classList.add('active');
    document.getElementById(target.dataset.tab).classList.remove('hidden');
  });
});

// =====================================================
// RENDERING UTILS
// =====================================================

function renderBits(bits, targetId, errorPos = 0, correctedPos = 0, highlightIndices = []) {
  const target = document.getElementById(targetId);
  if (!target) return;
  
  let html = '';
  const chunkSize = 10;
  for (let i = 0; i < bits.length; i += chunkSize) {
    const chunk = bits.slice(i, i + chunkSize);
    
    html += `<div class="bit-group">`;
    chunk.forEach((bit, idx) => {
      const pos = i + idx + 1;
      const isParity = AppState.parityPositions.includes(pos);
      let classes = ['bit-val'];
      
      if (isParity) classes.push('parity');
      else classes.push('data');
      
      if (pos === errorPos) classes.push('error');
      if (pos === correctedPos) classes.push('corrected');
      
      if (highlightIndices.length > 0) {
        if (highlightIndices.includes(pos)) classes.push('highlight');
        else classes.push('dimmed');
      }
      
      html += `
        <div class="bit-box" data-pos="${pos}">
          <span class="bit-pos">${pos.toString().padStart(2, '0')}</span>
          <div class="${classes.join(' ')}" title="Position ${pos}">${bit}</div>
        </div>
      `;
    });
    html += `</div>`;
  }
  target.innerHTML = html;
}

// =====================================================
// STEP 1 & 2: ENCODE
// =====================================================

const dataInput = document.getElementById('dataInput');
const inputCount = document.getElementById('inputCount');
const encodeBtn = document.getElementById('encodeBtn');
const progFill = document.getElementById('progFill');

dataInput.addEventListener('input', (e) => {
  let val = e.target.value.replace(/[^01]/g, '');
  e.target.value = val;
  
  inputCount.innerText = `${val.length} / 64 bits`;
  progFill.style.width = `${(val.length / 64) * 100}%`;
  
  if (val.length === 64) {
    progFill.style.backgroundColor = 'var(--c-grn)';
    encodeBtn.disabled = false;
  } else {
    progFill.style.backgroundColor = 'var(--c-pri)';
    encodeBtn.disabled = true;
  }
});

document.getElementById('randomDataBtn').addEventListener('click', () => {
  let str = "";
  for(let i=0; i<64; i++) str += Math.round(Math.random());
  dataInput.value = str;
  dataInput.dispatchEvent(new Event('input'));
});

encodeBtn.addEventListener('click', () => {
  const data = dataInput.value;
  if (data.length !== 64) return;
  
  AppState.originalData = data;
  AppState.encodedCodeword = encodeHamming(data);
  
  document.getElementById('encodingResultArea').classList.remove('hidden');
  document.getElementById('originalDataDisplay').innerText = data;
  renderBits(AppState.encodedCodeword, 'codewordVisualizer');
  
  // Parity Vals
  let phtml = '';
  AppState.parityPositions.forEach((p, idx) => {
    phtml += `<div class="pv-box"><div class="pv-lbl">P${p}</div><div class="pv-v">${AppState.encodedCodeword[p-1]}</div></div>`;
  });
  document.getElementById('parityValGrid').innerHTML = phtml;
  
  updateWorkflowState(STATE_ENCODED);
  
  // Setup Inject Area
  renderBits(AppState.encodedCodeword, 'injOrigViz');
  setupInteractiveInject();
});

// =====================================================
// STEP 3: INJECT ERROR
// =====================================================

const posInput = document.getElementById('errorPositionInput');
const selBitBefore = document.getElementById('selBitBefore');
const selBitAfter = document.getElementById('selBitAfter');
const posHint = document.getElementById('posHint');

function updateInjectPreview() {
  if (AppState.workflowState === STATE_INITIAL) return;
  const pos = parseInt(posInput.value) || 1;
  const isParity = AppState.parityPositions.includes(pos);
  posHint.innerText = `Position ${pos} · ${isParity ? 'Parity Bit' : 'Data Bit'}`;
  
  const before = AppState.encodedCodeword[pos - 1];
  selBitBefore.innerText = before !== undefined ? before : '-';
  selBitAfter.innerText = before !== undefined ? (before === 0 ? 1 : 0) : '-';
}

posInput.addEventListener('input', updateInjectPreview);
document.getElementById('posDecBtn').addEventListener('click', () => {
  if(posInput.value > 1) { posInput.value--; updateInjectPreview(); }
});
document.getElementById('posIncBtn').addEventListener('click', () => {
  if(posInput.value < 71) { posInput.value++; updateInjectPreview(); }
});

function setupInteractiveInject() {
  renderBits(AppState.encodedCodeword, 'injClickViz');
  const target = document.getElementById('injClickViz');
  target.querySelectorAll('.bit-box').forEach(box => {
    box.style.cursor = 'pointer';
    box.addEventListener('click', () => {
      posInput.value = box.dataset.pos;
      updateInjectPreview();
    });
  });
  updateInjectPreview();
}

document.getElementById('injectBtn').addEventListener('click', () => {
  if (AppState.workflowState === STATE_INITIAL) return;
  
  const pos = parseInt(posInput.value);
  if (pos < 1 || pos > 71) return;
  
  AppState.injectedErrorPosition = pos;
  AppState.corruptedCodeword = [...AppState.encodedCodeword];
  AppState.corruptedCodeword[pos - 1] = AppState.corruptedCodeword[pos - 1] === 0 ? 1 : 0;
  
  document.getElementById('injResultArea').classList.remove('hidden');
  document.getElementById('injPosDisp').innerText = pos;
  document.getElementById('injOrigBit').innerText = AppState.encodedCodeword[pos - 1];
  document.getElementById('injNewBit').innerText = AppState.corruptedCodeword[pos - 1];
  document.getElementById('injBannerPos').innerText = pos;
  
  renderBits(AppState.corruptedCodeword, 'corruptedVisualizer', pos);
  
  // Update Detection Workspace (Initial state)
  renderBits(AppState.corruptedCodeword, 'detCorruptedViz', pos);
  
  updateWorkflowState(STATE_INJECTED);
});

// =====================================================
// STEP 4: DETECT ERROR
// =====================================================

document.getElementById('detectBtn').addEventListener('click', () => {
  if (AppState.workflowState !== STATE_INJECTED && AppState.workflowState !== STATE_DETECTED && AppState.workflowState !== STATE_CORRECTED && AppState.workflowState !== STATE_VERIFIED) return;
  
  const { syndrome, pChecks } = calculateSyndrome(AppState.corruptedCodeword);
  AppState.syndrome = syndrome;
  AppState.syndromeBits = pChecks;
  AppState.detectedErrorPosition = syndrome;
  
  document.getElementById('detResultArea').classList.remove('hidden');
  
  document.getElementById('s1').innerText = pChecks[0];
  document.getElementById('s2').innerText = pChecks[1];
  document.getElementById('s4').innerText = pChecks[2];
  document.getElementById('s8').innerText = pChecks[3];
  document.getElementById('s16').innerText = pChecks[4];
  document.getElementById('s32').innerText = pChecks[5];
  document.getElementById('s64').innerText = pChecks[6];
  
  const synBin = pChecks.slice().reverse().join('');
  document.getElementById('synBin').innerText = synBin;
  document.getElementById('synDec').innerText = syndrome;
  document.getElementById('detPos').innerText = syndrome === 0 ? 'None' : syndrome;
  
  let detBit = '-';
  if (syndrome > 0 && syndrome <= 71) detBit = AppState.corruptedCodeword[syndrome - 1];
  document.getElementById('detBitVal').innerText = detBit;
  
  const banner = document.getElementById('detBanner');
  const bIco = document.getElementById('dbIco');
  const bTtl = document.getElementById('dbTtl');
  const bDsc = document.getElementById('dbDsc');
  
  if (syndrome === 0) {
    banner.className = 'det-banner suc';
    bIco.innerText = '✓';
    bTtl.innerText = 'NO ERROR DETECTED';
    bDsc.innerText = 'The syndrome is 0. No single-bit errors found.';
  } else if (syndrome > 71) {
    banner.className = 'det-banner err';
    bIco.innerText = '⚠';
    bTtl.innerText = 'INVALID ERROR DETECTED';
    bDsc.innerText = `Syndrome ${syndrome} exceeds codeword length 71.`;
  } else {
    banner.className = 'det-banner err';
    bIco.innerText = '⚠';
    bTtl.innerText = `ERROR DETECTED AT POSITION ${syndrome}`;
    bDsc.innerText = 'Single-bit error identified. Proceed to Correction.';
  }

  // Visual Breakdown
  let html = '';
  pChecks.slice().reverse().forEach((bit, i) => {
    let weight = Math.pow(2, 6 - i);
    html += `<div class="syn-ex-row"><span class="syn-ex-v">${bit}</span> × <span class="syn-ex-w">${weight}</span> = <span class="syn-ex-r">${bit * weight}</span></div>`;
  });
  html += `<div class="syn-ex-sum">Total = ${syndrome}</div>`;
  document.getElementById('synExplain').innerHTML = html;

  // Setup Correction Workspace (Initial state)
  document.getElementById('corDetPos').innerText = syndrome === 0 ? 'None' : syndrome;
  document.getElementById('corDetBit').innerText = detBit;
  document.getElementById('corPrePos').innerText = syndrome === 0 ? 'None' : syndrome;
  
  updateWorkflowState(STATE_DETECTED);
});

// =====================================================
// STEP 5 & 6: CORRECT & VERIFY
// =====================================================

document.getElementById('correctBtn').addEventListener('click', () => {
  if (AppState.workflowState !== STATE_DETECTED && AppState.workflowState !== STATE_CORRECTED && AppState.workflowState !== STATE_VERIFIED) return;
  
  const pos = AppState.detectedErrorPosition;
  AppState.correctedCodeword = [...AppState.corruptedCodeword];
  
  if (pos > 0 && pos <= 71) {
    AppState.correctedCodeword[pos - 1] = AppState.correctedCodeword[pos - 1] === 0 ? 1 : 0;
  }
  
  AppState.extractedData = extractData(AppState.correctedCodeword);
  
  document.getElementById('corResultArea').classList.remove('hidden');
  renderBits(AppState.corruptedCodeword, 'corBeforeViz', pos);
  renderBits(AppState.correctedCodeword, 'corAfterViz', 0, pos);
  
  const banner = document.getElementById('corBanner');
  const bTtl = document.getElementById('cbTtl');
  const bDsc = document.getElementById('cbDsc');
  
  if (pos === 0) {
    banner.className = 'cor-banner suc';
    bTtl.innerText = 'NO CORRECTION NEEDED';
    bDsc.innerText = 'Codeword was already intact.';
  } else if (pos > 71) {
    banner.className = 'cor-banner err';
    bTtl.innerText = 'CORRECTION FAILED';
    bDsc.innerText = 'Invalid syndrome position.';
  } else {
    banner.className = 'cor-banner suc';
    bTtl.innerText = `SUCCESSFULLY CORRECTED BIT AT POSITION ${pos}`;
    bDsc.innerText = 'Bit was flipped back to its original state.';
  }
  document.getElementById('corStatusMini').innerText = pos === 0 ? 'Not Needed' : 'Corrected';
  document.getElementById('corStatusMini').className = 'rc-val grn-val';
  
  document.getElementById('extractedDisp').innerText = AppState.extractedData;
  document.getElementById('verOrigDisp').innerText = AppState.originalData;
  document.getElementById('verExtDisp').innerText = AppState.extractedData;
  
  const vBanner = document.getElementById('verBanner');
  const vIco = document.getElementById('vbIco');
  const vTxt = document.getElementById('vbTxt');
  
  if (AppState.originalData === AppState.extractedData) {
    vBanner.className = 'ver-banner suc';
    vIco.innerText = '✓';
    vTxt.innerText = 'DATA MATCHES ORIGINAL INPUT PERFECTLY';
    document.getElementById('vfy-match').innerText = 'YES';
    document.getElementById('vfy-match').className = 'rc-val grn-val';
  } else {
    vBanner.className = 'ver-banner err';
    vIco.innerText = '✗';
    vTxt.innerText = 'DATA MISMATCH DETECTED';
    document.getElementById('vfy-match').innerText = 'NO';
    document.getElementById('vfy-match').className = 'rc-val err-val';
  }

  // Populate Verify Page
  document.getElementById('vfy-input').innerText = AppState.originalData.substring(0, 16) + '...';
  document.getElementById('vfy-errpos').innerText = AppState.injectedErrorPosition;
  document.getElementById('vfy-syndrome').innerText = AppState.syndrome;
  
  const trace = `
    1. Input: 64 bits generated
    2. Encoding: 71-bit codeword created
    3. Injection: Bit ${AppState.injectedErrorPosition} flipped manually
    4. Detection: Syndrome calculated as ${AppState.syndrome}
    5. Correction: Bit ${AppState.detectedErrorPosition} flipped back
    6. Extraction: 64 bits recovered
    7. Verification: ${AppState.originalData === AppState.extractedData ? 'Match' : 'Mismatch'}
  `;
  document.getElementById('simTrace').innerText = trace.trim();
  
  const fvb = document.getElementById('fvb');
  if (AppState.originalData === AppState.extractedData) {
    fvb.className = 'fvb suc';
    document.getElementById('fvbIco').innerText = '✓';
    document.getElementById('fvbTtl').innerText = 'SIMULATION SUCCESSFUL';
    document.getElementById('fvbDsc').innerText = 'The single-bit error was successfully corrected and data was restored.';
  } else {
    fvb.className = 'fvb err';
    document.getElementById('fvbIco').innerText = '✗';
    document.getElementById('fvbTtl').innerText = 'SIMULATION FAILED';
    document.getElementById('fvbDsc').innerText = 'The extracted data does not match the original input.';
  }

  updateWorkflowState(STATE_CORRECTED);
});

// Click verification step updates to VERIFIED
document.getElementById('nb-verify').addEventListener('click', () => {
  if (AppState.workflowState === STATE_CORRECTED) {
    updateWorkflowState(STATE_VERIFIED);
  }
});

// =====================================================
// RESET
// =====================================================

document.getElementById('resetBtn').addEventListener('click', () => {
  dataInput.value = '';
  dataInput.dispatchEvent(new Event('input'));
  
  AppState.originalData = '';
  AppState.encodedCodeword = [];
  AppState.corruptedCodeword = [];
  AppState.injectedErrorPosition = 0;
  AppState.syndrome = 0;
  AppState.syndromeBits = [];
  AppState.detectedErrorPosition = 0;
  AppState.correctedCodeword = [];
  AppState.extractedData = '';
  
  document.getElementById('encodingResultArea').classList.add('hidden');
  document.getElementById('injResultArea').classList.add('hidden');
  document.getElementById('detResultArea').classList.add('hidden');
  document.getElementById('corResultArea').classList.add('hidden');
  
  updateWorkflowState(STATE_INITIAL);
  gotoPage('pg-dashboard');
});

// =====================================================
// MATHEMATICS TAB
// =====================================================

function populateMathTab() {
  if (AppState.workflowState === STATE_INITIAL) {
    document.getElementById('structureMapViz').innerHTML = '<div class="dim">Encode data first to see structure map.</div>';
    document.getElementById('coverageViz').innerHTML = '<div class="dim">Encode data first to see coverage.</div>';
    return;
  }
  
  renderBits(AppState.encodedCodeword, 'structureMapViz');
  
  // Parity Coverage Tab
  document.querySelectorAll('.btn-par').forEach(btn => {
    // clean existing listeners to avoid duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-par').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      
      const p = parseInt(target.dataset.p);
      let covered = [];
      for (let i = 1; i <= 71; i++) {
        if ((i & p) !== 0) covered.push(i);
      }
      
      renderBits(AppState.encodedCodeword, 'coverageViz', 0, 0, covered);
      document.getElementById('covInfo').innerText = `P${p} checks all positions where bit ${Math.log2(p)} is 1. (${covered.length} positions)`;
      document.getElementById('covList').innerText = `Covered Positions: ${covered.join(', ')}`;
    });
  });
  // Trigger P1 click by default
  document.querySelector('.btn-par[data-p="1"]')?.click();
  
  // Encoding Logic Tab
  document.getElementById('lg-step1').innerText = `Data: ${AppState.originalData.substring(0, 20)}...`;
  document.getElementById('lg-step5').innerText = `Codeword: ${AppState.encodedCodeword.join('').substring(0, 20)}...`;
  
  let pcdHtml = '';
  AppState.parityPositions.forEach(p => {
    let covered = [];
    for (let i = 1; i <= 71; i++) {
      if ((i & p) !== 0 && i !== p) covered.push(i);
    }
    pcdHtml += `<div class="pcd-row"><strong>P${p}</strong> = XOR of data positions: ${covered.slice(0,10).join(',')}${covered.length>10?'...':''}</div>`;
  });
  document.getElementById('parityCalcDetail').innerHTML = pcdHtml;
  
  if (AppState.workflowState !== STATE_ENCODED && AppState.workflowState !== STATE_INJECTED) {
    document.getElementById('curSynDisplay').style.display = 'block';
    document.getElementById('csdVal').innerText = AppState.syndrome;
  }
  
  // Advanced Matrix Tab
  generateMatrixContent();
}

function generateMatrixContent() {
  const m = 64;
  const r = 7;
  const n = 71;
  
  let hLines = [];
  for (let row = 0; row < r; row++) {
    let line = "";
    for (let col = 1; col <= n; col++) {
      line += ((col >> row) & 1) + " ";
    }
    hLines.push(line.trim());
  }
  
  let gLines = [];
  let dataIndices = [];
  for(let i=1; i<=n; i++) if(!isPowerOfTwo(i)) dataIndices.push(i);
  
  for (let i = 0; i < m; i++) {
    let row = new Array(n).fill(0);
    row[dataIndices[i]-1] = 1;
    for (let j = 0; j < r; j++) {
      const p = Math.pow(2, j);
      if ((dataIndices[i] & p) !== 0) {
        row[p-1] = 1;
      }
    }
    gLines.push(row.join(" "));
  }
  
  document.getElementById('parityCheckMatrixContent').innerText = hLines.join("\n");
  document.getElementById('generatorMatrixContent').innerText = gLines.join("\n");
}

const toggleMatrixBtn = document.getElementById('toggleMatrixBtn');
if (toggleMatrixBtn) {
  toggleMatrixBtn.addEventListener('click', () => {
    const mda = document.getElementById('matrixDisplayArea');
    if (mda.classList.contains('hidden')) {
      mda.classList.remove('hidden');
      toggleMatrixBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>HIDE MATRIX';
    } else {
      mda.classList.add('hidden');
      toggleMatrixBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>SHOW MATRIX';
    }
  });
}

// Initial Boot
updateWorkflowState(STATE_INITIAL);
gotoPage('pg-dashboard');
