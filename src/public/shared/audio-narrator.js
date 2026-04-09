/**
 * Audio Narrator — Inline horizontal player for page narration
 * Usage: Add <div id="audio-narrator" data-src="/audio/filename.mp3"></div> to any page
 * The div should be placed AFTER the hero section and BEFORE the first content section.
 * The player renders inline (not floating) and flows with the page layout.
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var container = document.getElementById('audio-narrator');
  if (!container) return;

  var src = container.getAttribute('data-src');
  if (!src) return;

  var audio = new Audio();
  audio.preload = 'metadata';
  audio.src = src;
  var isPlaying = false;
  var progressInterval = null;

  // Log load errors
  audio.addEventListener('error', function () {
    console.error('Audio narrator: failed to load', src, audio.error);
  });

  // --- Build inline player ---
  container.innerHTML = '';

  // Wrapper styles — inline, NOT fixed/floating
  container.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:14px',
    'background:#EFF6FF',
    'border:1px solid rgba(0,51,161,0.18)',
    'border-left:4px solid #0033A1',
    'border-radius:10px',
    'padding:10px 16px',
    'max-width:560px',
    'margin:0 0 0 0',
    'box-sizing:border-box',
    'width:100%',
  ].join(';');

  // --- Play/Pause button ---
  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Escuchar narración de esta página');
  btn.style.cssText = [
    'flex-shrink:0',
    'width:36px',
    'height:36px',
    'border-radius:50%',
    'background:#0033A1',
    'color:#fff',
    'border:none',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'transition:background 0.2s',
    'padding:0',
  ].join(';');

  var playIcon  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var pauseIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  btn.innerHTML = playIcon;

  btn.addEventListener('mouseenter', function () { if (!isPlaying) btn.style.background = '#1a4db3'; });
  btn.addEventListener('mouseleave', function () { if (!isPlaying) btn.style.background = '#0033A1'; });

  // --- Middle section: label + progress bar ---
  var middle = document.createElement('div');
  middle.style.cssText = 'flex:1;min-width:0;';

  var titleRow = document.createElement('div');
  titleRow.style.cssText = 'font-size:12px;font-weight:600;color:#1e3a5f;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  titleRow.textContent = 'Escuchar esta página';

  var progressTrack = document.createElement('div');
  progressTrack.style.cssText = 'height:4px;background:#dbeafe;border-radius:2px;overflow:hidden;cursor:pointer;';

  var progressFill = document.createElement('div');
  progressFill.id = 'audio-progress-bar';
  progressFill.style.cssText = 'height:100%;width:0%;background:#0033A1;border-radius:2px;transition:width 0.3s linear;';

  progressTrack.appendChild(progressFill);
  middle.appendChild(titleRow);
  middle.appendChild(progressTrack);

  // Seek on click
  progressTrack.addEventListener('click', function (e) {
    if (!audio.duration) return;
    var rect = progressTrack.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
    updateProgress();
  });

  // --- Time display ---
  var timeEl = document.createElement('span');
  timeEl.id = 'audio-time';
  timeEl.style.cssText = 'flex-shrink:0;font-size:11px;color:#6b8aad;white-space:nowrap;font-variant-numeric:tabular-nums;min-width:34px;text-align:right;';
  timeEl.textContent = '0:00';

  // Update time display when metadata loads
  audio.addEventListener('loadedmetadata', function () {
    timeEl.textContent = formatTime(audio.duration);
  });

  // Assemble player
  container.appendChild(btn);
  container.appendChild(middle);
  container.appendChild(timeEl);

  // --- Helper: format seconds to M:SS ---
  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // --- Progress update ---
  function updateProgress() {
    if (audio.duration) {
      var pct = audio.currentTime / audio.duration;
      progressFill.style.width = (pct * 100) + '%';
      timeEl.textContent = formatTime(audio.currentTime);
    }
  }

  // --- Playing state UI ---
  function setPlayingUI() {
    isPlaying = true;
    btn.innerHTML = pauseIcon;
    btn.setAttribute('aria-label', 'Pausar narración');
    btn.style.background = '#1a4db3';
    titleRow.textContent = 'Pausar narración';
    progressInterval = setInterval(updateProgress, 200);
  }

  function setStoppedUI(label) {
    isPlaying = false;
    btn.innerHTML = playIcon;
    btn.setAttribute('aria-label', 'Escuchar narración de esta página');
    btn.style.background = '#0033A1';
    titleRow.textContent = label || 'Escuchar esta página';
    clearInterval(progressInterval);
  }

  // --- Click handler ---
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      audio.pause();
      setStoppedUI('Escuchar esta página');
    } else {
      var playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(function () {
          setPlayingUI();
        }).catch(function (err) {
          console.error('Audio narrator: play failed', err);
          setStoppedUI('Error al reproducir');
        });
      } else {
        setPlayingUI();
      }
    }
  });

  // --- Audio events ---
  audio.addEventListener('ended', function () {
    setStoppedUI('Escuchar de nuevo');
    progressFill.style.width = '100%';
    setTimeout(function () {
      audio.currentTime = 0;
      progressFill.style.width = '0%';
      timeEl.textContent = formatTime(audio.duration);
      setStoppedUI('Escuchar esta página');
    }, 2000);
  });

  audio.addEventListener('timeupdate', updateProgress);
});
