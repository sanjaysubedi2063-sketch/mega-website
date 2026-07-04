// Centralized JS for index features - defensive and accessible
(function(){
  // Helpers
  const $ = (id)=> document.getElementById(id);
  const qsAll = (sel) => Array.from(document.querySelectorAll(sel));

  // Modal handling with focus trap
  let activeModal = null;
  function openModal(id){
    const modal = $(id);
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    activeModal = modal;
    const focusable = modal.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if(focusable) focusable.focus();
    document.addEventListener('keydown', onKeyDown);
  }
  function closeModal(modal){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    if(modal===activeModal) activeModal = null;
    document.removeEventListener('keydown', onKeyDown);
  }
  function onKeyDown(e){
    if(e.key === 'Escape' && activeModal) closeModal(activeModal);
  }

  // Attach open/close buttons
  document.addEventListener('click', (e)=>{
    const openId = e.target.closest('[data-open]')?.getAttribute('data-open');
    if(openId){ e.preventDefault(); openModal(openId); return; }
    if(e.target.closest('[data-close]') || e.target.classList.contains('modal-overlay')){
      const modalEl = e.target.closest('.modal-overlay');
      closeModal(modalEl || e.target.closest('.modal-window').parentElement);
      return;
    }
  });

  // Prevent clicks inside modal-window from closing
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.modal-window')) e.stopPropagation();
  }, true);

  // --- TEXT-TO-VIDEO: enhanced ---
  let vdo = {
    fps: 30,
    duration: 10,
    maxFrames: 300,
    frame: 0,
    running: false,
    paused: false,
    theme: 'matrix',
    particles: [],
    particleCount: 120,
    color: '#5856d6',
    width: 640,
    height: 360,
    rafId: null,
    lastTimestamp: 0,
    accumulator: 0,
    mediaRecorder: null,
    recordedBlobs: []
  };

  function initParticles(){
    vdo.particles = [];
    for(let i=0;i<vdo.particleCount;i++){
      if(vdo.theme === 'space'){
        vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,z:Math.random()*2+0.2,s:Math.random()*1.5+0.5});
      } else {
        vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,vy:Math.random()*2+0.5,char:33+Math.floor(Math.random()*90)});
      }
    }
  }

  function resizeCanvasFromResolution(res){
    const [w,h] = res.split('x').map(Number);
    const canvas = $('generativeVideoCanvas'); if(!canvas) return;
    canvas.width = w; canvas.height = h; vdo.width = w; vdo.height = h;
  }

  function renderFrame(timestamp){
    const canvas = $('generativeVideoCanvas'); if(!canvas) return;
    const ctx = canvas.getContext('2d');

    if(!vdo.running) return;
    if(vdo.paused){ vdo.rafId = requestAnimationFrame(renderFrame); return; }

    // FPS throttle
    if(!vdo.lastTimestamp) vdo.lastTimestamp = timestamp;
    const delta = timestamp - vdo.lastTimestamp;
    const interval = 1000 / vdo.fps;
    vdo.accumulator += delta;
    if(vdo.accumulator < interval){ vdo.lastTimestamp = timestamp; vdo.rafId = requestAnimationFrame(renderFrame); return; }
    vdo.accumulator = 0; vdo.lastTimestamp = timestamp;

    // clear
    ctx.fillStyle = '#020306'; ctx.fillRect(0,0,vdo.width,vdo.height);

    if(vdo.theme === 'space'){
      // draw expanding orbits
      ctx.strokeStyle = hexToRgba(vdo.color,0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(vdo.width/2,vdo.height/2,(vdo.frame*1.5)%(Math.min(vdo.width,vdo.height)/1.2),0,Math.PI*2); ctx.stroke();
      for(let p of vdo.particles){ p.x += (p.z*0.6); p.y += (p.s*0.3); if(p.x>vdo.width) p.x=0; if(p.y>vdo.height) p.y=0; ctx.fillStyle = randomAccent(); ctx.fillRect(p.x,p.y, Math.max(1,p.s), Math.max(1,p.s)); }
    } else {
      // matrix droplets
      ctx.fillStyle = vdo.color; ctx.font = Math.max(10, Math.floor(vdo.width/60))+'px monospace';
      for(let p of vdo.particles){ p.y += p.vy; if(p.y > vdo.height+20) p.y = -20; ctx.fillStyle = vdo.color; ctx.fillText(String.fromCharCode(p.char), Math.floor(p.x/10)*10, p.y); ctx.fillStyle = hexToRgba(vdo.color,0.18); ctx.fillRect(p.x, p.y-40, 2, 40); }
    }

    vdo.frame++;
    // update HUD
    const percent = Math.min(100, (vdo.frame / vdo.maxFrames) * 100);
    $('vdoTimelineBar').style.width = percent + '%';
    $('vdoTimeCounter').innerText = `${(vdo.frame / vdo.fps).toFixed(1)}s / ${vdo.duration}s`;

    if(vdo.frame >= vdo.maxFrames){ stopVdo(); }
    else vdo.rafId = requestAnimationFrame(renderFrame);
  }

  function hexToRgba(hex,alpha){
    const h = hex.replace('#',''); const bigint = parseInt(h,16); const r=(bigint>>16)&255; const g=(bigint>>8)&255; const b=bigint&255; return `rgba(${r},${g},${b},${alpha})`;
  }
  function randomAccent(){ return hexToRgba(vdo.color, Math.random()*0.8 + 0.2); }

  function startVdo(){
    if(vdo.running) return;
    vdo.running = true; vdo.paused = false; vdo.frame = 0; vdo.accumulator = 0; vdo.lastTimestamp = 0;
    initParticles();
    $('videoThoughtOutput').hidden = false; $('videoThoughtOutput').textContent = 'Rendering...';
    $('vdoFrameContainer').hidden = false;
    vdo.rafId = requestAnimationFrame(renderFrame);
  }
  function stopVdo(){
    vdo.running = false; vdo.paused = false;
    if(vdo.rafId) cancelAnimationFrame(vdo.rafId); vdo.rafId = null;
    $('videoThoughtOutput').textContent += '\nCompleted.';
  }

  function toggleVdo(){ if(!vdo.running) return; vdo.paused = !vdo.paused; $('vdoTogglePlay').textContent = vdo.paused? 'Play' : 'Pause'; }

  // Media recording
  function startRecording(){
    const canvas = $('generativeVideoCanvas'); if(!canvas) return alert('Canvas not available');
    try{
      const stream = canvas.captureStream(vdo.fps);
      vdo.recordedBlobs = [];
      const options = {mimeType: 'video/webm;codecs=vp9'};
      vdo.mediaRecorder = new MediaRecorder(stream, options);
      vdo.mediaRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size) vdo.recordedBlobs.push(e.data); };
      vdo.mediaRecorder.start(); $('videoThoughtOutput').textContent += '\nRecording started.';
    } catch(err){ alert('Recording not supported: '+err.message); }
  }
  function stopRecordingAndDownload(){
    if(!vdo.mediaRecorder) return alert('No recording in progress');
    vdo.mediaRecorder.stop(); vdo.mediaRecorder = null;
    const blob = new Blob(vdo.recordedBlobs, {type:'video/webm'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = `hyperengine_vdo_${Date.now()}.webm`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),10000);
  }

  // Wire up controls
  $('vdoGenerate')?.addEventListener('click', ()=>{
    const duration = Math.max(1, parseInt($('vdoDuration')?.value || 10)); const fps = Math.max(5, parseInt($('vdoFps')?.value || 30)); const res = $('vdoResolution')?.value || '640x360'; const parts = parseInt($('vdoParticles')?.value || 120);
    const theme = $('vdoTheme')?.value || 'matrix'; const color = $('vdoColor')?.value || '#5856d6';
    vdo.duration = duration; vdo.fps = fps; vdo.maxFrames = duration * fps; vdo.particleCount = parts; vdo.theme = theme; vdo.color = color; resizeCanvasFromResolution(res);
    $('videoThoughtOutput').hidden = false; $('videoThoughtOutput').textContent = `Prompt: ${$('vdoPrompt')?.value || ''}\nTheme: ${theme} | Particles: ${parts} | ${res} | ${fps}fps | ${duration}s`;
    startVdo();
  });

  $('vdoTogglePlay')?.addEventListener('click', ()=> toggleVdo());
  $('vdoRecord')?.addEventListener('click', ()=> startRecording());
  $('vdoStopRecord')?.addEventListener('click', ()=> stopRecordingAndDownload());

  // expose controls for legacy inline calls
  window.initializeAndPlayVideoMatrixLoop = function(){ $('vdoGenerate')?.click(); };
  window.toggleVideoPlaybackState = function(){ $('vdoTogglePlay')?.click(); };

  // utilities on load
  qsAll('.modal-overlay').forEach(m=> m.setAttribute('aria-hidden','true'));
  window.openEngineModal = openModal; window.closeEngineModal = closeModal;

})();
