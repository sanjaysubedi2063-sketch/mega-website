// Centralized JS for index features - extended Text→Video upgrades
(function(){
  const $ = id => document.getElementById(id);
  const qsAll = sel => Array.from(document.querySelectorAll(sel));

  // Modal helpers (kept from previous)
  let activeModal = null;
  function openModal(id){ const modal = $(id); if(!modal) return; modal.setAttribute('aria-hidden','false'); activeModal = modal; const focusable = modal.querySelector('button, input, textarea, select'); if(focusable) focusable.focus(); document.addEventListener('keydown', onKeyDown); }
  function closeModal(modal){ if(!modal) return; modal.setAttribute('aria-hidden','true'); if(modal===activeModal) activeModal=null; document.removeEventListener('keydown', onKeyDown); }
  function onKeyDown(e){ if(e.key==='Escape' && activeModal) closeModal(activeModal); }
  document.addEventListener('click', (e)=>{ const openId = e.target.closest('[data-open]')?.getAttribute('data-open'); if(openId){ e.preventDefault(); openModal(openId); return; } if(e.target.closest('[data-close]') || e.target.classList.contains('modal-overlay')){ const modalEl = e.target.closest('.modal-overlay'); closeModal(modalEl || e.target.closest('.modal-window').parentElement); return; } });
  qsAll('.modal-overlay').forEach(m=> m.setAttribute('aria-hidden','true'));
  window.openEngineModal = openModal; window.closeEngineModal = closeModal;

  // VDO state
  let vdo = {
    fps:30, duration:10, maxFrames:300, frame:0, running:false, paused:false, rafId:null, lastTS:0, accum:0,
    theme:'matrix', particles:[], particleCount:160, color:'#5856d6', width:640, height:360,
    motionBlur:false, bloom:false, audioFile:null, mediaRecorder:null, recordedBlobs:[], recordedWebm:null
  };

  // Prompt NLP parser (basic heuristics)
  function parsePromptToParams(prompt){
    const p = prompt.toLowerCase(); const cfg = {};
    if(/space|galaxy|cosmic|star/.test(p)) cfg.theme='space';
    if(/matrix|code|digital|neon/.test(p)) cfg.theme='matrix';
    if(/cinema|cinematic|film|slow|dramatic/.test(p)) cfg.theme='cinematic';

    const colorMatch = p.match(/#?[0-9a-f]{6}\b/);
    if(colorMatch) cfg.color = colorMatch[0].startsWith('#')?colorMatch[0]:'#'+colorMatch[0];
    const speedMatch = p.match(/(slow|fast|medium|brisk)/);
    if(speedMatch){ if(speedMatch[1]==='slow') cfg.fps = 18; else if(speedMatch[1]==='fast') cfg.fps = 45; else cfg.fps = 30; }
    const particlesMatch = p.match(/(\d{2,4})\s*(particles|pts|count)/);
    if(particlesMatch) cfg.particles = Math.min(800, parseInt(particlesMatch[1]));
    if(/blur|motion blur/.test(p)) cfg.motionBlur = true;
    if(/bloom|glow/.test(p)) cfg.bloom = true;
    return cfg;
  }

  // Particle system
  function initParticles(){ vdo.particles=[]; for(let i=0;i<vdo.particleCount;i++){ if(vdo.theme==='space'){ vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,z:Math.random()*2+0.2,s:Math.random()*2+0.5,phase:Math.random()*Math.PI*2}); } else if(vdo.theme==='cinematic'){ vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,vx:(Math.random()-0.5)*1.2,vy:(Math.random()-0.5)*0.6,r:Math.random()*2+1,life:Math.random()*200}); } else { vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,vy:Math.random()*2+0.5,char:33+Math.floor(Math.random()*90)}); } } }

  function resizeCanvas(res){ const [w,h] = res.split('x').map(Number); const canvas = $('generativeVideoCanvas'); if(!canvas) return; canvas.width=w; canvas.height=h; vdo.width=w; vdo.height=h; }

  // offscreen for bloom
  let bloomCanvas=null, bloomCtx=null;
  function ensureBloomCanvas(){ if(!bloomCanvas){ bloomCanvas = document.createElement('canvas'); bloomCtx = bloomCanvas.getContext('2d'); } bloomCanvas.width = vdo.width; bloomCanvas.height = vdo.height; }

  function renderFrame(ts){ const canvas=$('generativeVideoCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d'); if(!vdo.running) return; if(vdo.paused){ vdo.rafId = requestAnimationFrame(renderFrame); return; }
    // FPS throttling
    if(!vdo.lastTS) vdo.lastTS = ts; const delta=ts - vdo.lastTS; const interval = 1000 / vdo.fps; vdo.accum += delta; if(vdo.accum < interval){ vdo.lastTS = ts; vdo.rafId = requestAnimationFrame(renderFrame); return; } vdo.accum = 0; vdo.lastTS = ts;

    // motion blur: draw translucent rect instead of clear
    if(vdo.motionBlur){ ctx.fillStyle = 'rgba(2,3,6,0.28)'; ctx.fillRect(0,0,vdo.width,vdo.height); } else { ctx.fillStyle='#020306'; ctx.fillRect(0,0,vdo.width,vdo.height); }

    if(vdo.theme==='space'){
      ctx.strokeStyle = rgba(vdo.color,0.35); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(vdo.width/2,vdo.height/2,(vdo.frame*1.5)%(Math.min(vdo.width,vdo.height)/1.2),0,Math.PI*2); ctx.stroke();
      for(let p of vdo.particles){ p.x += Math.sin(p.phase + vdo.frame*0.01) * (p.z*0.6); p.y += Math.cos(p.phase + vdo.frame*0.008) * (p.s*0.3); if(p.x>vdo.width) p.x=0; if(p.y>vdo.height) p.y=0; ctx.fillStyle = rgba(vdo.color, Math.random()*0.9 + 0.1); ctx.fillRect(p.x,p.y, Math.max(1,p.s), Math.max(1,p.s)); }
    } else if(vdo.theme==='cinematic'){
      // soft particles and subtle parallax
      for(let p of vdo.particles){ p.x += p.vx; p.y += p.vy; p.life -= 1; if(p.x< -10) p.x = vdo.width+10; if(p.x>vdo.width+10) p.x=-10; if(p.y< -10) p.y = vdo.height+10; if(p.y>vdo.height+10) p.y=-10; ctx.globalAlpha = 0.6; ctx.fillStyle = rgba(vdo.color,0.6); ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }
    } else {
      ctx.fillStyle = vdo.color; ctx.font = Math.max(10, Math.floor(vdo.width/60))+'px monospace'; for(let p of vdo.particles){ p.y += p.vy; if(p.y > vdo.height+20) p.y = -20; ctx.fillStyle = vdo.color; ctx.fillText(String.fromCharCode(p.char), Math.floor(p.x/10)*10, p.y); ctx.fillStyle = rgba(vdo.color,0.18); ctx.fillRect(p.x, p.y-40, 2, 40); }
    }

    // Bloom: render bright layers to bloomCanvas, blur, and composite
    if(vdo.bloom){ ensureBloomCanvas(); bloomCtx.clearRect(0,0,vdo.width,vdo.height); // draw bright highlights
      if(vdo.theme==='space' || vdo.theme==='cinematic'){
        bloomCtx.fillStyle = rgba(vdo.color,0.9); for(let p of vdo.particles) bloomCtx.fillRect(p.x,p.y, Math.max(1,p.s)*2, Math.max(1,p.s)*2);
      } else { bloomCtx.fillStyle = rgba(vdo.color,0.9); for(let p of vdo.particles) bloomCtx.fillText(String.fromCharCode(p.char), Math.floor(p.x/10)*10, p.y);
      }
      // apply CSS blur when drawing back (fast, supported in modern browsers)
      try{ ctx.save(); ctx.filter = 'blur(8px)'; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(bloomCanvas,0,0); ctx.restore(); ctx.globalCompositeOperation = 'source-over'; }catch(e){ /* fallback: no bloom */ }
    }

    vdo.frame++;
    const percent = Math.min(100,(vdo.frame / vdo.maxFrames) * 100); $('vdoTimelineBar').style.width = percent + '%'; $('vdoTimeCounter').innerText = `${(vdo.frame / vdo.fps).toFixed(1)}s / ${vdo.duration}s`;
    if(vdo.frame >= vdo.maxFrames){ stopVdo(); } else vdo.rafId = requestAnimationFrame(renderFrame);
  }

  function rgba(hex,a){ const h=hex.replace('#',''); const bi=parseInt(h,16); const r=(bi>>16)&255; const g=(bi>>8)&255; const b=bi&255; return `rgba(${r},${g},${b},${a})`; }

  function startVdo(){ if(vdo.running) return; vdo.running=true; vdo.paused=false; vdo.frame=0; vdo.lastTS=0; vdo.accum=0; initParticles(); $('videoThoughtOutput').hidden=false; $('videoThoughtOutput').textContent='Rendering...'; $('vdoFrameContainer').hidden=false; vdo.rafId = requestAnimationFrame(renderFrame); }
  function stopVdo(){ vdo.running=false; vdo.paused=false; if(vdo.rafId) cancelAnimationFrame(vdo.rafId); vdo.rafId=null; $('videoThoughtOutput').textContent += '\nRender completed.'; }
  function toggleVdo(){ if(!vdo.running) return; vdo.paused = !vdo.paused; $('vdoTogglePlay').textContent = vdo.paused ? 'Play' : 'Pause'; }

  // Recording: support combining canvas + optional audio file
  async function startRecording(){
    const canvas = $('generativeVideoCanvas'); if(!canvas) return alert('Canvas not ready');
    const canvasStream = canvas.captureStream(vdo.fps);
    let finalStream = canvasStream;

    if(vdo.audioFile){
      try{
        // try captureStream on audio element
        const audioEl = document.createElement('audio'); audioEl.src = URL.createObjectURL(vdo.audioFile); audioEl.loop = false; await audioEl.play().catch(()=>{});
        const audioStream = audioEl.captureStream ? audioEl.captureStream() : null;
        if(audioStream && audioStream.getAudioTracks().length){ finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()]); } else {
          // fallback: use WebAudio routing
          const ac = new (window.AudioContext||window.webkitAudioContext)(); const src = ac.createMediaElementSource(audioEl); const dest = ac.createMediaStreamDestination(); src.connect(dest); src.connect(ac.destination); finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        }
      }catch(err){ console.warn('Audio capture failed',err); }
    }

    vdo.recordedBlobs = [];
    try{
      const options = {mimeType:'video/webm;codecs=vp9'}; vdo.mediaRecorder = new MediaRecorder(finalStream, options);
      vdo.mediaRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size) vdo.recordedBlobs.push(e.data); };
      vdo.mediaRecorder.onstop = ()=>{ vdo.recordedWebm = new Blob(vdo.recordedBlobs, {type:'video/webm'}); $('videoThoughtOutput').textContent += '\nRecording stopped (webm ready).'; };
      vdo.mediaRecorder.start(); $('videoThoughtOutput').textContent += '\nRecording started.';
    }catch(err){ alert('Recording not supported: '+err.message); }
  }

  function stopRecording(){ if(!vdo.mediaRecorder) return alert('No recording'); vdo.mediaRecorder.stop(); vdo.mediaRecorder = null; }

  // Convert WebM -> MP4 using ffmpeg.wasm (lazy load). If unavailable, show message.
  let ffmpegModule = null; async function convertWebmToMp4(){ if(!vdo.recordedWebm) return alert('No webm recorded yet'); const { createFFmpeg, fetchFile } = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js').catch(e=>{ alert('FFmpeg wasm load failed: '+e.message); return {}; }); if(!createFFmpeg) return; const ffmpeg = createFFmpeg({ log:true }); await ffmpeg.load(); const data = await vdo.recordedWebm.arrayBuffer(); ffmpeg.FS('writeFile','input.webm', new Uint8Array(data)); await ffmpeg.run('-i','input.webm','-c:v','libx264','-preset','veryfast','-movflags','faststart','output.mp4'); const outData = ffmpeg.FS('readFile','output.mp4'); const blob = new Blob([outData.buffer], {type:'video/mp4'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = `hyperengine_${Date.now()}.mp4`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),10000); }

  // Wire UI
  $('vdoGenerate')?.addEventListener('click', ()=>{
    const prompt = $('vdoPrompt')?.value || '';
    const nlpEnabled = $('vdoNlpParse')?.checked;
    if(nlpEnabled && prompt.trim()){
      const parsed = parsePromptToParams(prompt); if(parsed.theme) $('vdoTheme').value = parsed.theme; if(parsed.color) $('vdoColor').value = parsed.color; if(parsed.fps) $('vdoFps').value = parsed.fps; if(parsed.particles) $('vdoParticles').value = parsed.particles; if(parsed.motionBlur) $('vdoMotionBlur').checked = true; if(parsed.bloom) $('vdoBloom').checked = true;
    }
    // apply settings
    vdo.duration = Math.max(1, parseInt($('vdoDuration').value||10)); vdo.fps = Math.max(5, parseInt($('vdoFps').value||30)); vdo.maxFrames = vdo.duration * vdo.fps; vdo.particleCount = parseInt($('vdoParticles').value||160); vdo.theme = $('vdoTheme').value || 'matrix'; vdo.color = $('vdoColor').value || '#5856d6'; vdo.motionBlur = !!$('vdoMotionBlur').checked; vdo.bloom = !!$('vdoBloom').checked;
    const res = $('vdoResolution').value || '640x360'; resizeCanvas(res);
    if($('vdoAutoScale').checked){ // adaptive particle cap for resolution
      const [w,h] = res.split('x').map(Number); const area = (w*h)/(640*360); vdo.particleCount = Math.min(800, Math.max(20, Math.floor(vdo.particleCount*area)));
    }
    // audio file
    const audioFile = $('vdoAudioUpload')?.files?.[0]; vdo.audioFile = audioFile || null;
    $('videoThoughtOutput').hidden = false; $('videoThoughtOutput').textContent = `Prompt: ${prompt}\nTheme:${vdo.theme} | Particles:${vdo.particleCount} | ${res} | ${vdo.fps}fps | ${vdo.duration}s`;
    initParticles(); startVdo();
  });

  $('vdoTogglePlay')?.addEventListener('click', ()=>{ toggleVdo(); });
  $('vdoRecord')?.addEventListener('click', ()=>{ startRecording(); });
  $('vdoStopRecord')?.addEventListener('click', ()=>{ stopRecording(); });
  $('vdoConvertMp4')?.addEventListener('click', ()=>{ if(!vdo.recordedWebm) return alert('Record first'); convertWebmToMp4(); });

  // Expose some functions for legacy inline calls
  window.initializeAndPlayVideoMatrixLoop = function(){ $('vdoGenerate')?.click(); };
  window.toggleVideoPlaybackState = function(){ $('vdoTogglePlay')?.click(); };

})();
