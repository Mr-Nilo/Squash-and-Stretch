// ═══════════════════════════════════════════════════════════════
//  STATE & NAVIGATION
// ═══════════════════════════════════════════════════════════════
const SECTIONS = ['Intro','Principle','Playground','Rules','Examples','Code','Challenge','Quiz','Done'];
let currentSec = 0;
let completedSecs = new Set();
let pgRAF = null;

function buildNav() {
  const dotsEl = document.getElementById('step-dots');
  const sideEl = document.getElementById('side-nav');
  SECTIONS.forEach((name, i) => {
    const d = document.createElement('button');
    d.className = 'step-dot' + (i===0 ? ' active' : '');
    d.textContent = i+1;
    d.title = name;
    d.onclick = () => goTo(i);
    dotsEl.appendChild(d);

    const s = document.createElement('div');
    s.className = 'side-dot' + (i===0 ? ' active' : '');
    s.title = name;
    s.onclick = () => goTo(i);
    sideEl.appendChild(s);
  });
}
buildNav();

function goTo(i) {
  completedSecs.add(currentSec);
  currentSec = i;
  document.querySelectorAll('.section').forEach(s => {
    s.style.display = (parseInt(s.dataset.sec) === i) ? 'flex' : 'none';
  });
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(triggerReveal, 50);
  if (i === 2) startPlayground();
  if (i === 4) startExamples();
  if (i === 6) startChallenge();
  if (i === 8) setTimeout(launchConfetti, 700);
}

function updateProgress() {
  const dots = document.querySelectorAll('.step-dot');
  const sdots = document.querySelectorAll('.side-dot');
  dots.forEach((d, i) => {
    d.className = 'step-dot' + (completedSecs.has(i) ? ' done' : '') + (i===currentSec ? ' active' : '');
  });
  sdots.forEach((d, i) => {
    d.className = 'side-dot' + (completedSecs.has(i) ? ' done' : '') + (i===currentSec ? ' active' : '');
  });
  const pct = Math.round(((currentSec+1) / SECTIONS.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  const cur = String(currentSec+1).padStart(2,'0');
  const tot = String(SECTIONS.length).padStart(2,'0');
  document.getElementById('step-label').textContent = `${cur} / ${tot}`;
}

function triggerReveal() {
  document.querySelectorAll('.section').forEach(s => {
    if (s.style.display !== 'none') {
      s.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
    }
  });
}

document.querySelectorAll('.section').forEach(s => {
  if (parseInt(s.dataset.sec) !== 0) s.style.display = 'none';
});
setTimeout(triggerReveal, 100);

// ═══════════════════════════════════════════════════════════════
//  HERO CANVAS — multiple balls bouncing
// ═══════════════════════════════════════════════════════════════
(function heroAnim() {
  const c = document.getElementById('hero-canvas');
  if (!c) return;
  const w = c.width, h = c.height;
  const ctx = c.getContext('2d');
  const GROUND = h - 30;
  const GRAV = 0.5;
  const SQUASH_ZONE = 14;
  const PRE_EASE = 22;
  const DT = 0.85;

  function eoc(t) { return 1 - Math.pow(1 - t, 3); }

  // Five balls with varied colors, sizes, bounce heights, and phase offsets
  const balls = [
    { x: 100, r: 18, light: '#3e8cbf', mid: '#155581', dark: '#0a3a5c', bounceH: 110, advance: 0  },
    { x: 230, r: 22, light: '#2d72a3', mid: '#044B7B', dark: '#03345a', bounceH: 140, advance: 18 },
    { x: 360, r: 20, light: '#f25559', mid: '#DA1C27', dark: '#a01018', bounceH: 95,  advance: 32 },
    { x: 490, r: 16, light: '#3e8cbf', mid: '#155581', dark: '#0a3a5c', bounceH: 130, advance: 10 },
    { x: 620, r: 22, light: '#2d72a3', mid: '#044B7B', dark: '#03345a', bounceH: 105, advance: 40 },
  ];

  // Initialize + advance physics to phase-shift each ball
  balls.forEach(b => {
    b.y = GROUND - b.r;
    b.vy = -Math.sqrt(2 * GRAV * b.bounceH);
    b.currentSy = 1;
    for (let i = 0; i < b.advance; i++) {
      b.vy += GRAV * DT;
      b.y += b.vy * DT;
      if (b.y + b.r >= GROUND) {
        b.y = GROUND - b.r;
        b.vy = -Math.sqrt(2 * GRAV * b.bounceH);
      }
    }
  });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#DCE5ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 1);
    ctx.lineTo(w, GROUND + 1);
    ctx.stroke();

    balls.forEach(b => {
      // Stable physics — energy preserved
      b.vy += GRAV * DT;
      b.y += b.vy * DT;
      if (b.y + b.r >= GROUND) {
        b.y = GROUND - b.r;
        b.vy = -Math.sqrt(2 * GRAV * b.bounceH);
      }

      const absVy = Math.abs(b.vy);
      const distG = GROUND - (b.y + b.r);
      const R = b.r;

      // Target scale with smooth pre-impact ease + squash override
      let targetSy = 1;
      const sT = eoc(Math.min(1, Math.max(0, (absVy - 3) / 7)));
      let stretchSy = 1 + 0.55 * sT;
      if (b.vy > 0 && distG < PRE_EASE) {
        stretchSy = 1 + (stretchSy - 1) * (distG / PRE_EASE);
      }
      if (distG < SQUASH_ZONE && b.vy > 0) {
        targetSy = 1 - 0.4 * eoc(1 - distG / SQUASH_ZONE);
      } else {
        targetSy = stretchSy;
      }

      // Temporal smoothing
      b.currentSy += (targetSy - b.currentSy) * 0.5;
      const sy = b.currentSy, sx = 1 / sy;
      let renderY = b.y;
      if (sy < 1) renderY = b.y + R * (1 - sy);

      // Neutral shadow (no ghost-ball look)
      const prox = Math.max(0, 1 - distG / 100);
      const sw = R * (0.55 + prox * 0.7 + Math.max(0, 1 - sy) * 0.55);
      ctx.beginPath();
      ctx.ellipse(b.x, GROUND + 1, sw, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10, 22, 38, ${0.05 + prox * 0.14})`;
      ctx.fill();

      // Ball with radial gradient (single coherent sphere)
      ctx.save();
      ctx.translate(b.x, renderY);
      ctx.scale(sx, sy);

      const bg = ctx.createRadialGradient(-R*0.28, -R*0.32, R*0.05, 0, 0, R*1.05);
      bg.addColorStop(0, b.light);
      bg.addColorStop(0.55, b.mid);
      bg.addColorStop(1, b.dark);
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      const hg = ctx.createRadialGradient(-R*0.38, -R*0.42, 0, -R*0.38, -R*0.42, R*0.6);
      hg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      hg.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
      hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();

      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ═══════════════════════════════════════════════════════════════
//  PLAYGROUND
// ═══════════════════════════════════════════════════════════════
function startPlayground() {
  if (pgRAF) cancelAnimationFrame(pgRAF);
  const c = document.getElementById('pg-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const GROUND_Y = H - 32;
  const R = 24;
  const GRAV = 0.55;
  const SQUASH_ZONE = 22;       // pixels above ground where squash builds
  const PRE_IMPACT_EASE = 36;   // pixels before ground where stretch eases out
  const STRETCH_THRESHOLD = 4;

  let enabled = true;
  let squash = 0.55, stretch = 1.70, bounceH = 180, speed = 1.0;
  let y = GROUND_Y - R;
  let vy = 0;
  let currentSy = 1; // smoothed scale for natural motion

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  const sqS = document.getElementById('squash-slider');
  const stS = document.getElementById('stretch-slider');
  const bhS = document.getElementById('height-slider');
  const spS = document.getElementById('speed-slider');
  const ssT = document.getElementById('ss-toggle');
  const tag = document.getElementById('status-tag');

  const rPhase = document.getElementById('r-phase');
  const rVel = document.getElementById('r-velocity');
  const rSx = document.getElementById('r-sx');
  const rSy = document.getElementById('r-sy');

  function launch() {
    // v² = 2·g·h  ➜  guarantees ball reaches exactly bounceH pixels
    vy = -Math.sqrt(2 * GRAV * bounceH);
  }

  function updateCtrls() {
    squash = +sqS.value;
    stretch = +stS.value;
    bounceH = +bhS.value;
    speed = +spS.value;
    document.getElementById('sq-val').textContent = squash.toFixed(2);
    document.getElementById('st-val').textContent = stretch.toFixed(2);
    document.getElementById('bh-val').textContent = bounceH + ' px';
    document.getElementById('sp-val').textContent = speed.toFixed(1) + '×';
  }

  [sqS, stS, bhS, spS].forEach(s => s && s.addEventListener('input', updateCtrls));
  ssT && ssT.addEventListener('change', () => {
    enabled = ssT.checked;
    tag.className = 'status-tag ' + (enabled ? 'status-on' : 'status-off');
    tag.innerHTML = `<span class="dot"></span>Squash & stretch ${enabled ? 'on' : 'off'}`;
  });
  document.getElementById('reset-pg').addEventListener('click', () => {
    sqS.value = 0.55; stS.value = 1.70; bhS.value = 180; spS.value = 1.0;
    ssT.checked = true; enabled = true;
    tag.className = 'status-tag status-on';
    tag.innerHTML = '<span class="dot"></span>Squash & stretch on';
    updateCtrls();
    y = GROUND_Y - R;
    launch();
  });

  updateCtrls();
  launch();

  function drawGuide(label, value, yPos, color) {
    ctx.strokeStyle = color + '55';
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, yPos);
    ctx.lineTo(W - 40, yPos);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 12, yPos);
    ctx.textAlign = 'right';
    ctx.fillText(value, W - 12, yPos);
  }

  function drawLabel(text, cx, cy, fg, bg) {
    ctx.font = '700 9.5px Inter, sans-serif';
    const metrics = ctx.measureText(text);
    const pad = 7, h = 18;
    const w = metrics.width + pad * 2;
    ctx.fillStyle = bg;
    ctx.strokeStyle = fg + '33';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, cx - w/2, cy - h/2, w, h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 0.5);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // background gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(21, 85, 129, 0.025)');
    grd.addColorStop(1, 'rgba(21, 85, 129, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // peak guide (driven by bounce height slider)
    const peakY = GROUND_Y - bounceH - R * 2;
    drawGuide('PEAK', bounceH + ' px', peakY, '#DA1C27');

    // ground
    ctx.strokeStyle = '#C8D4DF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(21, 85, 129, 0.04)';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A7BC';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GROUND', 12, GROUND_Y + 8);

    // physics (stable — energy preserved)
    const dt = speed;
    vy += GRAV * dt;
    y += vy * dt;
    if (y + R >= GROUND_Y) {
      y = GROUND_Y - R;
      launch();
    }

    const absVy = Math.abs(vy);
    const distG = GROUND_Y - (y + R);

    // ─── Compute TARGET scale ───
    let targetSy = 1;
    let phase = vy > 0 ? 'Falling' : 'Rising';
    if (distG > bounceH * 0.85) phase = 'At peak';

    if (enabled) {
      // 1) Stretch from velocity (egg shape along motion)
      const stretchT = easeOutCubic(Math.min(1, Math.max(0, (absVy - STRETCH_THRESHOLD) / 8)));
      let stretchSy = 1 + (stretch - 1) * stretchT;

      // 2) As ball approaches ground while falling, ease stretch back toward 1
      if (vy > 0 && distG < PRE_IMPACT_EASE) {
        const ease = distG / PRE_IMPACT_EASE;
        stretchSy = 1 + (stretchSy - 1) * ease;
      }

      // 3) Squash zone overrides stretch (proximity to ground + falling)
      if (distG < SQUASH_ZONE && vy > 0) {
        const squashT = easeOutCubic(1 - (distG / SQUASH_ZONE));
        targetSy = 1 - (1 - squash) * squashT;
        phase = 'Squashing';
      } else {
        targetSy = stretchSy;
        if (stretchT > 0.2) phase = 'Stretching';
      }
    }

    // ─── Temporal smoothing (prevents visual popping) ───
    const blendRate = Math.min(1, 0.45 * speed);
    currentSy += (targetSy - currentSy) * blendRate;
    if (Math.abs(currentSy - targetSy) < 0.003) currentSy = targetSy;

    const sy = currentSy;
    const sx = 1 / sy;

    // ─── Render position: anchor squash to ground (no center-pivot smushing) ───
    let renderY = y;
    if (sy < 1) renderY = y + R * (1 - sy);

    // ─── Shadow: neutral dark, not blue (avoids ghost-ball look) ───
    const groundProx = Math.max(0, 1 - distG / 120);
    const shadowW = R * (0.55 + groundProx * 0.75 + Math.max(0, 1 - sy) * 0.7);
    const shadowOp = 0.05 + groundProx * 0.16;
    ctx.beginPath();
    ctx.ellipse(W/2, GROUND_Y + 1.5, shadowW, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10, 22, 38, ${shadowOp})`;
    ctx.fill();

    // ─── Ball: single coherent sphere with radial gradient ───
    ctx.save();
    ctx.translate(W/2, renderY);
    ctx.scale(sx, sy);

    // Body shading (depth)
    const bodyGrd = ctx.createRadialGradient(-R*0.28, -R*0.32, R*0.05, 0, 0, R*1.05);
    bodyGrd.addColorStop(0, '#3e8cbf');
    bodyGrd.addColorStop(0.55, '#155581');
    bodyGrd.addColorStop(1, '#0a3a5c');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrd;
    ctx.fill();

    // Soft highlight (no hard edge)
    const hlGrd = ctx.createRadialGradient(-R*0.38, -R*0.42, 0, -R*0.38, -R*0.42, R*0.65);
    hlGrd.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    hlGrd.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
    hlGrd.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = hlGrd;
    ctx.fill();

    // Subtle rim darkening
    const rimGrd = ctx.createRadialGradient(0, 0, R*0.88, 0, 0, R);
    rimGrd.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rimGrd.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = rimGrd;
    ctx.fill();

    ctx.restore();

    // ─── Phase labels above the ball ───
    if (enabled) {
      if (phase === 'Squashing' && sy < 0.95) {
        drawLabel('SQUASH', W/2, GROUND_Y - 30, '#DA1C27', 'rgba(255,255,255,0.96)');
      } else if (phase === 'Stretching' && sy > 1.1) {
        const lblY = renderY - (R * sy) - 16;
        if (lblY > 18) drawLabel('STRETCH', W/2, lblY, '#044B7B', 'rgba(255,255,255,0.96)');
      }
    }

    // live readout
    rPhase.textContent = phase;
    rVel.textContent = absVy.toFixed(1);
    rSx.textContent = sx.toFixed(2);
    rSy.textContent = sy.toFixed(2);
    rSx.className = 'readout-value' + (Math.abs(sx - 1) > 0.005 ? (sx > 1 ? ' is-squash' : ' is-stretch') : '');
    rSy.className = 'readout-value' + (Math.abs(sy - 1) > 0.005 ? (sy < 1 ? ' is-squash' : ' is-stretch') : '');

    pgRAF = requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════════
//  EXAMPLES
// ═══════════════════════════════════════════════════════════════
let exRAFs = { ball: null, char: null, ui: null };

function startExamples() {
  startExBall();
  startExChar();
  startExUI();
}

function startExBall() {
  const c = document.getElementById('ex-ball');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = 200, H = 160, GROUND = 145, R = 16;
  const GRAV = 0.45;
  const BOUNCE_H = 100;
  const DT = 0.55;
  const SQUASH_ZONE = 16;
  const PRE_EASE = 26;
  let vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
  let y = GROUND - R;
  let currentSy = 1;
  if (exRAFs.ball) cancelAnimationFrame(exRAFs.ball);

  function eoc(t) { return 1 - Math.pow(1 - t, 3); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#DCE5ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, GROUND);
    ctx.lineTo(W - 20, GROUND);
    ctx.stroke();

    vy += GRAV * DT;
    y += vy * DT;
    if (y + R >= GROUND) {
      y = GROUND - R;
      vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
    }
    const absVy = Math.abs(vy), distG = GROUND - (y + R);

    // target scale with smooth transitions
    let targetSy = 1;
    const sT = eoc(Math.min(1, Math.max(0, (absVy - 3) / 6)));
    let stretchSy = 1 + 0.55 * sT;
    if (vy > 0 && distG < PRE_EASE) stretchSy = 1 + (stretchSy - 1) * (distG / PRE_EASE);
    if (distG < SQUASH_ZONE && vy > 0) {
      targetSy = 1 - 0.4 * eoc(1 - distG / SQUASH_ZONE);
    } else {
      targetSy = stretchSy;
    }
    currentSy += (targetSy - currentSy) * 0.5;
    const sy = currentSy, sx = 1 / sy;
    let renderY = y;
    if (sy < 1) renderY = y + R * (1 - sy);

    // shadow (neutral dark)
    const prox = Math.max(0, 1 - distG / 80);
    const sw = R * (0.5 + prox * 0.65 + Math.max(0, 1 - sy) * 0.5);
    ctx.beginPath();
    ctx.ellipse(W/2, GROUND + 1, sw, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10, 22, 38, ${0.05 + prox * 0.13})`;
    ctx.fill();

    // ball with radial shading
    ctx.save();
    ctx.translate(W/2, renderY);
    ctx.scale(sx, sy);
    const bg = ctx.createRadialGradient(-R*0.28, -R*0.32, R*0.05, 0, 0, R*1.05);
    bg.addColorStop(0, '#3e8cbf');
    bg.addColorStop(0.55, '#155581');
    bg.addColorStop(1, '#0a3a5c');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    const hg = ctx.createRadialGradient(-R*0.38, -R*0.42, 0, -R*0.38, -R*0.42, R*0.6);
    hg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore();

    exRAFs.ball = requestAnimationFrame(draw);
  }
  draw();
}

function startExChar() {
  const c = document.getElementById('ex-char');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = 200, H = 160, GROUND = 130;
  let t = 0;
  if (exRAFs.char) cancelAnimationFrame(exRAFs.char);
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.035;
    const cycle = t % (Math.PI * 2);
    const air = Math.sin(cycle);
    const y = GROUND - (Math.max(0, air) * 50);
    const squashing = cycle > Math.PI * 1.75 || cycle < 0.2;
    let sx = 1, sy = 1;
    if (squashing) { sy = 0.7; sx = 1.3; }
    else if (air > 0.7) { sy = 1.25; sx = 0.82; }

    ctx.strokeStyle = '#DCE5ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, GROUND + 1);
    ctx.lineTo(W - 20, GROUND + 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(W/2, GROUND - 1, 22 * (squashing ? 1.3 : 1 - air * 0.4), 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(21, 85, 129, ${squashing ? 0.2 : 0.1 - air * 0.05})`;
    ctx.fill();

    ctx.save();
    ctx.translate(W/2, y - 22);
    ctx.scale(sx, sy);
    ctx.fillStyle = '#155581';
    ctx.beginPath();
    roundRect(ctx, -16, -22, 32, 38, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -34, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#044B7B';
    ctx.fill();
    ctx.restore();
    exRAFs.char = requestAnimationFrame(draw);
  }
  draw();
}

function startExUI() {
  const c = document.getElementById('ex-ui');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = 200, H = 160;
  let t = 0, pressed = false;
  if (exRAFs.ui) cancelAnimationFrame(exRAFs.ui);
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.03;
    const cycle = t % 4;
    if (cycle > 2.8) pressed = true;
    else if (cycle < 0.15) pressed = false;
    const sx = pressed ? 1.16 : 1, sy = pressed ? 0.84 : 1;

    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.scale(sx, sy);
    const bw = 92, bh = 38;
    ctx.beginPath();
    roundRect(ctx, -bw/2, -bh/2, bw, bh, 8);
    ctx.fillStyle = pressed ? '#044B7B' : '#155581';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLICK ME', 0, 0);
    ctx.restore();
    exRAFs.ui = requestAnimationFrame(draw);
  }
  draw();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

// ═══════════════════════════════════════════════════════════════
//  CHALLENGE
// ═══════════════════════════════════════════════════════════════
let chRAFs = { a: null, b: null };

function startChallenge() {
  runChA();
  runChB();
}

function runChA() {
  const c = document.getElementById('ch-a');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = 180, H = 180, GROUND = 155, R = 18;
  const GRAV = 0.5;
  const BOUNCE_H = 110;
  const DT = 0.6;
  const SQUASH_ZONE = 18;
  const PRE_EASE = 28;
  let vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
  let y = GROUND - R;
  let currentSy = 1;
  if (chRAFs.a) cancelAnimationFrame(chRAFs.a);

  function eoc(t) { return 1 - Math.pow(1 - t, 3); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#DCE5ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, GROUND);
    ctx.lineTo(W - 15, GROUND);
    ctx.stroke();

    vy += GRAV * DT;
    y += vy * DT;
    if (y + R >= GROUND) {
      y = GROUND - R;
      vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
    }
    const absVy = Math.abs(vy), distG = GROUND - (y + R);

    let targetSy = 1;
    const sT = eoc(Math.min(1, Math.max(0, (absVy - 3) / 7)));
    let stretchSy = 1 + 0.6 * sT;
    if (vy > 0 && distG < PRE_EASE) stretchSy = 1 + (stretchSy - 1) * (distG / PRE_EASE);
    if (distG < SQUASH_ZONE && vy > 0) {
      targetSy = 1 - 0.42 * eoc(1 - distG / SQUASH_ZONE);
    } else {
      targetSy = stretchSy;
    }
    currentSy += (targetSy - currentSy) * 0.5;
    const sy = currentSy, sx = 1 / sy;
    let renderY = y;
    if (sy < 1) renderY = y + R * (1 - sy);

    const prox = Math.max(0, 1 - distG / 90);
    const sw = R * (0.55 + prox * 0.7 + Math.max(0, 1 - sy) * 0.55);
    ctx.beginPath();
    ctx.ellipse(W/2, GROUND + 1, sw, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10, 22, 38, ${0.05 + prox * 0.15})`;
    ctx.fill();

    ctx.save();
    ctx.translate(W/2, renderY);
    ctx.scale(sx, sy);
    const bg = ctx.createRadialGradient(-R*0.28, -R*0.32, R*0.05, 0, 0, R*1.05);
    bg.addColorStop(0, '#3e8cbf');
    bg.addColorStop(0.55, '#155581');
    bg.addColorStop(1, '#0a3a5c');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    const hg = ctx.createRadialGradient(-R*0.38, -R*0.42, 0, -R*0.38, -R*0.42, R*0.6);
    hg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore();

    chRAFs.a = requestAnimationFrame(draw);
  }
  draw();
}

function runChB() {
  const c = document.getElementById('ch-b');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = 180, H = 180, GROUND = 155, R = 18;
  const GRAV = 0.5;
  const BOUNCE_H = 110;
  const DT = 0.6;
  let vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
  let y = GROUND - R;
  if (chRAFs.b) cancelAnimationFrame(chRAFs.b);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#DCE5ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, GROUND);
    ctx.lineTo(W - 15, GROUND);
    ctx.stroke();

    // Stable physics
    vy += GRAV * DT;
    y += vy * DT;
    if (y + R >= GROUND) {
      y = GROUND - R;
      vy = -Math.sqrt(2 * GRAV * BOUNCE_H);
    }
    const distG = GROUND - (y + R);

    // Neutral shadow (matches the other balls visually)
    const prox = Math.max(0, 1 - distG / 90);
    const sw = R * (0.55 + prox * 0.7);
    ctx.beginPath();
    ctx.ellipse(W/2, GROUND + 1, sw, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10, 22, 38, ${0.05 + prox * 0.15})`;
    ctx.fill();

    // Rigid ball — same visual quality as the others, but NO squash/stretch (sx = sy = 1)
    ctx.save();
    ctx.translate(W/2, y);
    const bg = ctx.createRadialGradient(-R*0.28, -R*0.32, R*0.05, 0, 0, R*1.05);
    bg.addColorStop(0, '#f25559');
    bg.addColorStop(0.55, '#DA1C27');
    bg.addColorStop(1, '#a01018');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();

    const hg = ctx.createRadialGradient(-R*0.38, -R*0.42, 0, -R*0.38, -R*0.42, R*0.6);
    hg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore();

    chRAFs.b = requestAnimationFrame(draw);
  }
  draw();
}

function checkChallenge(btn, ans) {
  document.querySelectorAll('#ch-opts .option').forEach(o => o.disabled = true);
  const fb = document.getElementById('ch-feedback');
  if (ans === 'A') {
    btn.classList.add('correct');
    fb.className = 'feedback ok show';
    fb.innerHTML = '<strong>Correct.</strong> Animation A applies squash & stretch — watch how the ball flattens at the ground and elongates at peak speed. Animation B keeps its perfect circular shape throughout, which makes it feel rigid and lifeless.';
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('#ch-opts .option')[0].classList.add('correct');
    fb.className = 'feedback bad show';
    fb.innerHTML = '<strong>Not quite.</strong> The correct answer is Animation A (the blue ball). It flattens at the bottom of each bounce and stretches during the fastest motion. Animation B (the red ball) stays perfectly round — that\'s the rigid version.';
  }
}

// ═══════════════════════════════════════════════════════════════
//  QUIZ
// ═══════════════════════════════════════════════════════════════
const QUIZ = [
  {
    q: 'What is the first rule when applying squash & stretch?',
    opts: ['Use as much stretch as possible', 'Preserve the volume of the object', 'Apply it only to soft objects', 'Always squash before stretching'],
    correct: 1,
    exp: 'Volume preservation is the mathematical heart of the principle. If scaleX increases, scaleY must decrease proportionally so that scaleX × scaleY = 1.'
  },
  {
    q: 'When should squash appear in a bouncing ball animation?',
    opts: ['While the ball rises upward', 'At the peak of the bounce', 'At the moment of impact with the ground', 'Throughout the entire animation'],
    correct: 2,
    exp: 'Squash should appear only at the instant of impact and live for just one to three frames. Holding it any longer makes the ball read as gum, not rubber.'
  },
  {
    q: 'A ball falls quickly. Which scale values show stretch while preserving volume?',
    opts: ['scaleX 1.4, scaleY 1.4', 'scaleX 0.7, scaleY 0.7', 'scaleX 0.7, scaleY 1.4', 'scaleX 1.4, scaleY 0.7'],
    correct: 2,
    exp: 'A taller, narrower shape communicates downward speed. 0.7 × 1.4 ≈ 1, so volume is preserved.'
  },
  {
    q: 'Which object would not benefit from squash & stretch?',
    opts: ['A rubber ball bouncing', 'A jumping cartoon character', 'A steel girder being lowered', 'A character running'],
    correct: 2,
    exp: 'A steel girder is rigid — deforming it would break believability. Squash & stretch communicates flexibility and weight, so it works best on objects meant to feel alive or soft.'
  },
  {
    q: 'What is the term for the most distorted frames in an animation?',
    opts: ['Key frames', 'In-betweens', 'Extremes', 'Holds'],
    correct: 2,
    exp: 'Extremes are the most squashed and most stretched frames. They define how flexible and exaggerated the motion feels. In-betweens are the frames that fill the gaps.'
  },
];
let qIdx = 0, score = 0, answered = false;

function renderQuestion() {
  const area = document.getElementById('quiz-q-area');
  if (!area) return;
  if (qIdx >= QUIZ.length) { showResult(); return; }
  const q = QUIZ[qIdx];
  answered = false;
  area.innerHTML = `
    <div class="quiz-q"><span class="qnum">${String(qIdx+1).padStart(2,'0')}.</span>${q.q}</div>
    <div class="quiz-opts">
      ${q.opts.map((o, i) => `<button class="quiz-opt" onclick="answerQ(${i})"><span class="opt-letter">${'ABCD'[i]}</span>${o}</button>`).join('')}
    </div>
    <div class="quiz-fb" id="qfb"></div>
    <div id="q-next-wrap">
      <button class="btn btn-primary btn-sm" onclick="nextQ()">Next question <span class="btn-arrow">→</span></button>
    </div>
  `;
  document.getElementById('quiz-fill').style.width = (qIdx / 5 * 100) + '%';
  document.getElementById('quiz-count').textContent = String(qIdx+1).padStart(2,'0') + ' / 05';
}

function answerQ(i) {
  if (answered) return;
  answered = true;
  const q = QUIZ[qIdx];
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach(o => o.disabled = true);
  opts[i].classList.add(i === q.correct ? 'correct' : 'wrong');
  if (i !== q.correct) opts[q.correct].classList.add('correct');
  if (i === q.correct) score++;
  const fb = document.getElementById('qfb');
  fb.className = 'quiz-fb ' + (i === q.correct ? 'ok' : 'bad') + ' show';
  fb.innerHTML = '<strong>' + (i === q.correct ? 'Correct.' : 'Incorrect.') + '</strong> ' + q.exp;
  document.getElementById('q-next-wrap').style.display = 'flex';
}

function nextQ() { qIdx++; renderQuestion(); }

function showResult() {
  document.getElementById('quiz-q-area').style.display = 'none';
  const res = document.getElementById('quiz-result');
  res.classList.remove('hidden');
  document.getElementById('score-num').textContent = score;
  const pct = score / 5;
  const c = 389.6;
  setTimeout(() => {
    document.getElementById('score-circle').style.strokeDashoffset = c - (c * pct);
  }, 200);
  const msgs = [
    ['Try again', 'Review the principles section and the playground, then come back to nail it.'],
    ['Keep going', 'You understand parts of the principle. Revisit the rules and try once more.'],
    ['Almost there', 'You have a solid grasp of the basics. One more review should do it.'],
    ['Strong work', 'You clearly understand squash & stretch. Excellent foundation.'],
    ['Outstanding', 'You\'ve mastered the principle. Ready for the next eleven.'],
    ['Perfect score', 'Outstanding work — every concept locked in. You\'re ready to teach this.'],
  ];
  document.getElementById('score-headline').textContent = msgs[score][0];
  document.getElementById('score-msg').textContent = msgs[score][1];
  document.getElementById('quiz-fill').style.width = '100%';
  document.getElementById('quiz-count').textContent = '05 / 05';
}

function resetQuiz() {
  qIdx = 0; score = 0; answered = false;
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-q-area').style.display = 'block';
  renderQuestion();
}

// ═══════════════════════════════════════════════════════════════
//  CODE TABS
// ═══════════════════════════════════════════════════════════════
const fileNames = { css: 'bounce.css', js: 'canvas-ball.js', transform: 'transform.css' };
function switchTab(btn, type) {
  document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.code-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + type).classList.add('active');
  document.getElementById('code-file').textContent = fileNames[type];
}
function copyCode() {
  const active = document.querySelector('.code-panel.active');
  if (!active) return;
  navigator.clipboard.writeText(active.innerText).then(() => {
    const btn = document.querySelector('.code-copy');
    btn.textContent = 'Copied'; btn.style.color = 'var(--deep-blue)';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1800);
  });
}

// ═══════════════════════════════════════════════════════════════
//  CONFETTI
// ═══════════════════════════════════════════════════════════════
function launchConfetti() {
  const colors = ['#155581', '#044B7B', '#DA1C27', '#155581', '#044B7B'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size = 6 + Math.random() * 8;
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${2 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.4}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 35);
  }
}

renderQuestion();
