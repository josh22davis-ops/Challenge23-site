// Challenge 23 — Interactive Workout Graph
// HR data modeled from actual app session

(function() {
  'use strict';

  var PHASES = [
    // Warmup: 5 × 60s (0:00 - 5:00)
    { start: 0, end: 60, type: 'warmup', label: 'Controlled Squats', block: 'Warmup' },
    { start: 60, end: 120, type: 'warmup', label: 'Forward Fold', block: 'Warmup' },
    { start: 120, end: 180, type: 'warmup', label: 'Glute Bridge', block: 'Warmup' },
    { start: 180, end: 240, type: 'warmup', label: 'Marching', block: 'Warmup' },
    { start: 240, end: 300, type: 'warmup', label: 'Jumping Jacks', block: 'Warmup' },
    // Block 1 (5:00 - 8:00)
    { start: 300, end: 360, type: 'work', label: 'Pushups', block: 'Block 1' },
    { start: 360, end: 420, type: 'recover', label: 'Recovery', block: 'Block 1' },
    { start: 420, end: 480, type: 'hold', label: 'High Plank', block: 'Block 1' },
    // Block 2 (8:00 - 11:00)
    { start: 480, end: 540, type: 'work', label: 'Fast Tempo Squats', block: 'Block 2' },
    { start: 540, end: 600, type: 'recover', label: 'Recovery', block: 'Block 2' },
    { start: 600, end: 660, type: 'hold', label: 'Wall Sit', block: 'Block 2' },
    // Block 3 (11:00 - 14:00)
    { start: 660, end: 720, type: 'work', label: 'Burpees', block: 'Block 3' },
    { start: 720, end: 780, type: 'recover', label: 'Recovery', block: 'Block 3' },
    { start: 780, end: 840, type: 'hold', label: 'Low Squat Hold', block: 'Block 3' },
    // Block 4 (14:00 - 17:00)
    { start: 840, end: 900, type: 'work', label: 'Mountain Climbers', block: 'Block 4' },
    { start: 900, end: 960, type: 'recover', label: 'Recovery', block: 'Block 4' },
    { start: 960, end: 1020, type: 'hold', label: 'Side Plank', block: 'Block 4' },
    // Block 5 — mirrors Block 1 (17:00 - 20:00)
    { start: 1020, end: 1080, type: 'work', label: 'Pushups', block: 'Block 5' },
    { start: 1080, end: 1140, type: 'recover', label: 'Recovery', block: 'Block 5' },
    { start: 1140, end: 1200, type: 'hold', label: 'High Plank', block: 'Block 5' },
    // Cooldown — mirrors Block 2 work (20:00 - 23:00)
    { start: 1200, end: 1260, type: 'work', label: 'Fast Tempo Squats', block: 'Cooldown' },
    { start: 1260, end: 1380, type: 'recover', label: 'Recovery', block: 'Cooldown' },
  ];

  var PHASE_COLORS = {
    warmup: 'rgba(180,120,40,0.45)',
    work:   'rgba(200,60,60,0.40)',
    recover:'rgba(45,130,55,0.35)',
    hold:   'rgba(170,150,30,0.38)',
  };

  var TOTAL_DURATION = 1380;

  // Attempt to match the app screenshot HR curve closely
  // Key observations from the screenshot:
  // - Warmup: starts ~85, oscillates up/down, peaks ~125 around 3:00, ends ~120
  // - Work peaks: Block1 ~152, Block2 ~155, Block3 ~168, Block4 ~172, Block5 ~170, Cooldown ~168
  // - Recovery floors: stay high ~128-138 (never drops below 125 mid-workout)
  // - Hold phases: sustained ~130-145
  // - Cooldown recovery: drops much lower to ~110 by 23:00
  // - Line is smooth with natural variation, not noisy

  function generateHRData() {
    var points = [];
    // Define keyframe targets at specific timestamps (seconds)
    // Format: [time, targetBPM]
    var keyframes = [
      // Warmup — oscillatory ramp matching screenshot
      [0, 84], [10, 88], [20, 95], [35, 105], [50, 98], [60, 100],
      [70, 108], [85, 118], [100, 112], [115, 105],
      [120, 110], [140, 120], [155, 125], [170, 118], [180, 115],
      [195, 122], [210, 128], [225, 122], [240, 118],
      [255, 125], [270, 130], [285, 128], [300, 125],

      // Block 1: Work (5:00-6:00) → peak ~152
      [310, 132], [320, 140], [335, 148], [345, 152], [355, 150], [360, 148],
      // Block 1: Recover (6:00-7:00) → floor ~132
      [370, 142], [380, 138], [395, 135], [410, 132], [420, 130],
      // Block 1: Hold (7:00-8:00) → sustained ~132-140
      [435, 134], [450, 138], [465, 140], [480, 136],

      // Block 2: Work (8:00-9:00) → peak ~158
      [490, 142], [500, 150], [515, 155], [530, 158], [535, 156], [540, 152],
      // Block 2: Recover (9:00-10:00) → floor ~133
      [550, 145], [560, 140], [575, 136], [590, 134], [600, 133],
      // Block 2: Hold (10:00-11:00) → sustained ~134-142
      [615, 136], [630, 140], [645, 142], [660, 138],

      // Block 3: Work (11:00-12:00) → peak ~168 (burpees - hardest)
      [670, 148], [680, 158], [695, 164], [710, 168], [715, 166], [720, 162],
      // Block 3: Recover (12:00-13:00) → floor ~136
      [730, 152], [740, 146], [755, 140], [770, 138], [780, 136],
      // Block 3: Hold (13:00-14:00) → sustained ~136-144
      [795, 140], [810, 143], [825, 145], [840, 140],

      // Block 4: Work (14:00-15:00) → peak ~172 (mountain climbers + fatigue)
      [850, 150], [860, 160], [875, 168], [885, 171], [895, 170], [900, 166],
      // Block 4: Recover (15:00-16:00) → floor ~138
      [910, 155], [920, 148], [935, 142], [950, 140], [960, 138],
      // Block 4: Hold (16:00-17:00) → sustained ~138-146
      [975, 142], [990, 145], [1005, 147], [1020, 142],

      // Block 5: Work (17:00-18:00) → peak ~170 (pushups again, fatigued)
      [1030, 152], [1040, 160], [1055, 166], [1065, 170], [1075, 168], [1080, 164],
      // Block 5: Recover (18:00-19:00) → floor ~136
      [1090, 154], [1100, 148], [1115, 142], [1130, 138], [1140, 136],
      // Block 5: Hold (19:00-20:00) → sustained ~136-144
      [1155, 140], [1170, 143], [1185, 145], [1200, 140],

      // Cooldown: Work (20:00-21:00) → peak ~168
      [1210, 150], [1220, 158], [1235, 164], [1245, 168], [1255, 166], [1260, 160],
      // Cooldown: Extended Recovery (21:00-23:00) → drops to ~110
      [1270, 150], [1280, 142], [1295, 135], [1310, 128],
      [1325, 122], [1340, 118], [1355, 114], [1370, 112], [1380, 110],
    ];

    // Interpolate between keyframes with smooth cubic interpolation
    for (var t = 0; t <= TOTAL_DURATION; t++) {
      // Find surrounding keyframes
      var prevIdx = 0;
      for (var k = 0; k < keyframes.length - 1; k++) {
        if (keyframes[k][0] <= t && keyframes[k + 1][0] > t) {
          prevIdx = k;
          break;
        }
        if (k === keyframes.length - 2) prevIdx = k;
      }

      var kf0 = keyframes[Math.max(0, prevIdx - 1)];
      var kf1 = keyframes[prevIdx];
      var kf2 = keyframes[Math.min(keyframes.length - 1, prevIdx + 1)];
      var kf3 = keyframes[Math.min(keyframes.length - 1, prevIdx + 2)];

      var segStart = kf1[0];
      var segEnd = kf2[0];
      var segLen = segEnd - segStart;
      var frac = segLen > 0 ? (t - segStart) / segLen : 0;
      frac = Math.max(0, Math.min(1, frac));

      // Catmull-Rom interpolation for smooth curve
      var t2 = frac * frac;
      var t3 = t2 * frac;
      var bpm = 0.5 * (
        (2 * kf1[1]) +
        (-kf0[1] + kf2[1]) * frac +
        (2 * kf0[1] - 5 * kf1[1] + 4 * kf2[1] - kf3[1]) * t2 +
        (-kf0[1] + 3 * kf1[1] - 3 * kf2[1] + kf3[1]) * t3
      );

      // Add subtle natural HR variability
      var noise = Math.sin(t * 0.47) * 1.2 + Math.sin(t * 1.13) * 0.8 + Math.sin(t * 2.7) * 0.5;
      bpm = bpm + noise;
      bpm = Math.max(75, Math.min(180, bpm));

      points.push({ time: t, bpm: Math.round(bpm * 10) / 10 });
    }

    return points;
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getPhaseAt(time) {
    for (var i = 0; i < PHASES.length; i++) {
      if (time >= PHASES[i].start && time < PHASES[i].end) return PHASES[i];
    }
    return PHASES[PHASES.length - 1];
  }

  function initChart() {
    var container = document.getElementById('workout-chart');
    if (!container) return;

    var canvas = container.querySelector('canvas');
    var tooltip = container.querySelector('.chart-tooltip');
    var ctx = canvas.getContext('2d');
    var hrData = generateHRData();

    // Compute stats
    var allBPM = hrData.map(function(d) { return d.bpm; });
    var avgBPM = Math.round(allBPM.reduce(function(a, b) { return a + b; }, 0) / allBPM.length);
    var peakBPM = Math.round(Math.max.apply(null, allBPM));

    var statsEl = container.querySelector('.chart-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<span class="chart-stat-avg">Avg: ' + avgBPM + ' BPM</span>' +
        '<span class="chart-stat-peak">Peak: ' + peakBPM + ' BPM</span>';
    }

    var padding = { top: 40, right: 24, bottom: 36, left: 48 };

    function resize() {
      var rect = container.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      draw(null);
    }

    function draw(hoverTime) {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var chartW = w - padding.left - padding.right;
      var chartH = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);

      var minBPM = 75;
      var maxBPM = 185;
      var bpmRange = maxBPM - minBPM;

      function xPos(time) { return padding.left + (time / TOTAL_DURATION) * chartW; }
      function yPos(bpm) { return padding.top + (1 - (bpm - minBPM) / bpmRange) * chartH; }

      // Phase background bands
      for (var p = 0; p < PHASES.length; p++) {
        var phase = PHASES[p];
        var x1 = xPos(phase.start);
        var x2 = xPos(phase.end);
        ctx.fillStyle = PHASE_COLORS[phase.type];
        ctx.fillRect(x1, padding.top, x2 - x1, chartH);
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (var bpm = 80; bpm <= 180; bpm += 10) {
        var y = yPos(bpm);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px Sora, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(bpm, padding.left - 8, y);
      }

      // Time labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (var t = 0; t <= TOTAL_DURATION; t += 120) {
        ctx.fillText(formatTime(t), xPos(t), h - padding.bottom + 8);
      }

      // Area fill
      ctx.beginPath();
      ctx.moveTo(xPos(hrData[0].time), yPos(minBPM));
      for (var i = 0; i < hrData.length; i++) {
        ctx.lineTo(xPos(hrData[i].time), yPos(hrData[i].bpm));
      }
      ctx.lineTo(xPos(hrData[hrData.length - 1].time), yPos(minBPM));
      ctx.closePath();

      var areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      areaGrad.addColorStop(0, 'rgba(240,120,60,0.28)');
      areaGrad.addColorStop(0.5, 'rgba(220,80,50,0.12)');
      areaGrad.addColorStop(1, 'rgba(200,60,40,0.02)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // HR line — orange
      ctx.beginPath();
      for (var j = 0; j < hrData.length; j++) {
        var lx = xPos(hrData[j].time);
        var ly = yPos(hrData[j].bpm);
        j === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
      }
      ctx.strokeStyle = '#f0943c';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Hover scrub
      if (hoverTime !== null && hoverTime >= 0 && hoverTime <= TOTAL_DURATION) {
        var hx = xPos(hoverTime);

        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, padding.top);
        ctx.lineTo(hx, padding.top + chartH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Closest data point
        var closest = hrData[Math.round(hoverTime)];
        if (!closest) closest = hrData[hrData.length - 1];

        var dy = yPos(closest.bpm);
        ctx.beginPath();
        ctx.arc(hx, dy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f0943c';
        ctx.fill();
      }

      // Title
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '600 13px Sora, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('HEART RATE', padding.left, 12);
    }

    function getTimeFromEvent(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left - padding.left;
      var cW = rect.width - padding.left - padding.right;
      return Math.max(0, Math.min(TOTAL_DURATION, (x / cW) * TOTAL_DURATION));
    }

    function showTooltip(e, time) {
      var phase = getPhaseAt(time);
      var idx = Math.round(time);
      var closest = hrData[Math.min(idx, hrData.length - 1)];
      var bpm = Math.round(closest.bpm);
      var phaseTypeLabel = phase.type.charAt(0).toUpperCase() + phase.type.slice(1);

      tooltip.innerHTML =
        '<div class="chart-tooltip-exercise">' + phase.label + '</div>' +
        '<div class="chart-tooltip-bpm"><span class="chart-tooltip-heart">♥</span> ' + bpm + ' <span class="chart-tooltip-unit">BPM</span></div>' +
        '<div class="chart-tooltip-meta">' + formatTime(time) + ' · ' + phase.block + ' · <span class="chart-tooltip-' + phase.type + '">' + phaseTypeLabel + '</span></div>';

      tooltip.classList.add('visible');

      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left;
      var tooltipW = tooltip.offsetWidth;

      tooltip.style.left = (x > rect.width / 2) ? (x - tooltipW - 16) + 'px' : (x + 16) + 'px';
      tooltip.style.top = '40px';

      draw(time);
    }

    function hideTooltip() {
      tooltip.classList.remove('visible');
      draw(null);
    }

    canvas.addEventListener('mousemove', function(e) { showTooltip(e, getTimeFromEvent(e)); });
    canvas.addEventListener('mouseleave', hideTooltip);
    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); showTooltip(e, getTimeFromEvent(e)); }, { passive: false });
    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); showTooltip(e, getTimeFromEvent(e)); }, { passive: false });
    canvas.addEventListener('touchend', hideTooltip);

    window.addEventListener('resize', resize);
    resize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
  } else {
    initChart();
  }
})();
