/**
 * Audio Narrator — Floating play button for page narration
 * Usage: Add <div id="audio-narrator" data-src="/audio/filename.mp3"></div> to any page
 */
(function () {
  'use strict';

  var container = document.getElementById('audio-narrator');
  if (!container) return;

  var src = container.getAttribute('data-src');
  if (!src) return;

  var audio = new Audio(src);
  var isPlaying = false;
  var progressInterval = null;

  // Build the floating button
  container.innerHTML = '';
  container.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;align-items:center;gap:0.75rem;';

  // Progress ring + button
  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Escuchar narración de esta página');
  btn.setAttribute('title', 'Escuchar narración');
  btn.style.cssText = 'width:56px;height:56px;border-radius:50%;background:#0033A1;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,51,161,0.35);transition:all 0.3s ease;position:relative;';

  // SVG progress ring
  var ringSize = 64;
  var ringStroke = 3;
  var ringRadius = (ringSize - ringStroke) / 2;
  var ringCircumference = 2 * Math.PI * ringRadius;

  var ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('width', ringSize);
  ring.setAttribute('height', ringSize);
  ring.style.cssText = 'position:absolute;top:-4px;left:-4px;transform:rotate(-90deg);pointer-events:none;';

  var bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', ringSize / 2);
  bgCircle.setAttribute('cy', ringSize / 2);
  bgCircle.setAttribute('r', ringRadius);
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', 'rgba(255,255,255,0.2)');
  bgCircle.setAttribute('stroke-width', ringStroke);

  var progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  progressCircle.setAttribute('cx', ringSize / 2);
  progressCircle.setAttribute('cy', ringSize / 2);
  progressCircle.setAttribute('r', ringRadius);
  progressCircle.setAttribute('fill', 'none');
  progressCircle.setAttribute('stroke', '#FFB81C');
  progressCircle.setAttribute('stroke-width', ringStroke);
  progressCircle.setAttribute('stroke-linecap', 'round');
  progressCircle.style.strokeDasharray = ringCircumference;
  progressCircle.style.strokeDashoffset = ringCircumference;
  progressCircle.style.transition = 'stroke-dashoffset 0.3s ease';

  ring.appendChild(bgCircle);
  ring.appendChild(progressCircle);
  btn.appendChild(ring);

  // Play/pause icon
  var iconSpan = document.createElement('span');
  iconSpan.style.cssText = 'position:relative;z-index:1;display:flex;align-items:center;justify-content:center;';
  var playIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var pauseIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  iconSpan.innerHTML = playIcon;
  btn.appendChild(iconSpan);

  // Label tooltip
  var label = document.createElement('div');
  label.textContent = 'Escuchar';
  label.style.cssText = 'background:#0033A1;color:#fff;font-size:0.8125rem;font-weight:600;padding:0.4rem 0.85rem;border-radius:2rem;box-shadow:0 2px 12px rgba(0,0,0,0.15);white-space:nowrap;opacity:1;transition:opacity 0.3s ease;pointer-events:none;';

  container.appendChild(label);
  container.appendChild(btn);

  // Hover effects
  btn.addEventListener('mouseenter', function () {
    btn.style.transform = 'scale(1.08)';
    btn.style.boxShadow = '0 6px 28px rgba(0,51,161,0.45)';
  });
  btn.addEventListener('mouseleave', function () {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 20px rgba(0,51,161,0.35)';
  });

  function updateProgress() {
    if (audio.duration) {
      var pct = audio.currentTime / audio.duration;
      var offset = ringCircumference * (1 - pct);
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  function play() {
    audio.play();
    isPlaying = true;
    iconSpan.innerHTML = pauseIcon;
    label.textContent = 'Pausar';
    btn.style.background = '#1a4db3';
    progressInterval = setInterval(updateProgress, 100);
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    iconSpan.innerHTML = playIcon;
    label.textContent = 'Escuchar';
    btn.style.background = '#0033A1';
    clearInterval(progressInterval);
  }

  btn.addEventListener('click', function () {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });

  audio.addEventListener('ended', function () {
    pause();
    audio.currentTime = 0;
    progressCircle.style.strokeDashoffset = ringCircumference;
    label.textContent = 'Escuchar de nuevo';
  });

  // Hide label after 4 seconds
  setTimeout(function () {
    label.style.opacity = '0';
    setTimeout(function () { label.style.display = 'none'; }, 300);
  }, 4000);

  // Show label on hover
  btn.addEventListener('mouseenter', function () {
    label.style.display = 'block';
    label.style.opacity = '1';
  });
  btn.addEventListener('mouseleave', function () {
    if (!isPlaying) {
      label.style.opacity = '0';
      setTimeout(function () { label.style.display = 'none'; }, 300);
    }
  });
})();
