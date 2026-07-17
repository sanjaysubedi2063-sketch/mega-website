// Centralized JS for index features - extended Text→Video upgrades + Blog System
(function(){
  const $ = id => document.getElementById(id);
  const qsAll = sel => Array.from(document.querySelectorAll(sel));

  // Modal helpers
  let activeModal = null;
  function openModal(id){ 
    const modal = $(id); 
    if(!modal) return; 
    modal.setAttribute('aria-hidden','false'); 
    activeModal = modal; 
    const focusable = modal.querySelectorAll('button, input, textarea, select'); 
    if(focusable.length) focusable[0].focus(); 
    document.addEventListener('keydown', onKeyDown); 
  }
  function closeModal(modal){ 
    if(!modal) return; 
    modal.setAttribute('aria-hidden','true'); 
    if(modal===activeModal) activeModal=null; 
    document.removeEventListener('keydown', onKeyDown); 
  }
  function onKeyDown(e){ 
    if(e.key==='Escape' && activeModal) closeModal(activeModal); 
  }
  document.addEventListener('click', (e)=>{
    const openId = e.target.closest('[data-open]')?.getAttribute('data-open'); 
    if(openId){ e.preventDefault(); openModal(openId); return; } 
    if(e.target.closest('[data-close]')){ closeModal(activeModal); return; }
  });
  qsAll('.modal-overlay').forEach(m=> m.setAttribute('aria-hidden','true'));
  window.openEngineModal = openModal; 
  window.closeEngineModal = closeModal;

  // ============= VIDEO STATE & RENDERING =============
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
  function initParticles(){ 
    vdo.particles=[]; 
    for(let i=0;i<vdo.particleCount;i++){ 
      if(vdo.theme==='space'){ 
        vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,z:Math.random()*10,s:Math.random()*2+0.5,phase:Math.random()*Math.PI*2}); 
      } else if(vdo.theme==='cinematic'){ 
        vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height,vx:(Math.random()-0.5)*2,vy:Math.random()*1+0.5,life:200+Math.random()*100,s:Math.random()*3+1}); 
      } else { 
        vdo.particles.push({x:Math.random()*vdo.width,y:Math.random()*vdo.height+10,vy:Math.random()*2+1,char:Math.floor(Math.random()*26)+65}); 
      } 
    } 
  }

  function resizeCanvas(res){ 
    const [w,h] = res.split('x').map(Number); 
    const canvas = $('generativeVideoCanvas'); 
    if(!canvas) return; 
    canvas.width=w; 
    canvas.height=h; 
    vdo.width=w; 
    vdo.height=h; 
  }

  // offscreen for bloom
  let bloomCanvas=null, bloomCtx=null;
  function ensureBloomCanvas(){ 
    if(!bloomCanvas){ bloomCanvas = document.createElement('canvas'); bloomCtx = bloomCanvas.getContext('2d'); } 
    bloomCanvas.width = vdo.width; 
    bloomCanvas.height = vdo.height; 
  }

  function renderFrame(ts){ 
    const canvas=$('generativeVideoCanvas'); 
    if(!canvas) return; 
    const ctx=canvas.getContext('2d'); 
    if(!vdo.running) return; 
    if(vdo.paused){ vdo.rafId = requestAnimationFrame(renderFrame); return; }
    
    // FPS throttling
    if(!vdo.lastTS) vdo.lastTS = ts; 
    const delta=ts - vdo.lastTS; 
    const interval = 1000 / vdo.fps; 
    vdo.accum += delta; 
    if(vdo.accum < interval){ vdo.lastTS = ts; vdo.rafId = requestAnimationFrame(renderFrame); return; }
    vdo.accum -= interval;

    // motion blur: draw translucent rect instead of clear
    if(vdo.motionBlur){ ctx.fillStyle = 'rgba(2,3,6,0.28)'; ctx.fillRect(0,0,vdo.width,vdo.height); } else { ctx.fillStyle='#020306'; ctx.fillRect(0,0,vdo.width,vdo.height); }

    if(vdo.theme==='space'){
      ctx.strokeStyle = rgba(vdo.color,0.35); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(vdo.width/2,vdo.height/2,(vdo.frame*1.5)%(Math.min(vdo.width,vdo.height)/1.2),0,Math.PI*2); ctx.stroke();
      for(let p of vdo.particles){ p.x += Math.sin(p.phase + vdo.frame*0.01) * (p.z*0.6); p.y += Math.cos(p.phase + vdo.frame*0.008) * (p.s*0.3); if(p.x>vdo.width) p.x=0; if(p.y>vdo.height) p.y=0; ctx.fillStyle=rgba(vdo.color,0.6); ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,Math.PI*2); ctx.fill(); }
    } else if(vdo.theme==='cinematic'){
      // soft particles and subtle parallax
      for(let p of vdo.particles){ p.x += p.vx; p.y += p.vy; p.life -= 1; if(p.x< -10) p.x = vdo.width+10; if(p.x>vdo.width+10) p.x=-10; if(p.y< -10) p.y = vdo.height+10; if(p.y>vdo.height+10) p.y=-10; ctx.fillStyle = rgba(vdo.color, p.life/200*0.7); ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,Math.PI*2); ctx.fill(); }
    } else {
      ctx.fillStyle = vdo.color; ctx.font = Math.max(10, Math.floor(vdo.width/60))+'px monospace'; for(let p of vdo.particles){ p.y += p.vy; if(p.y > vdo.height+20) p.y = -20; ctx.fillStyle = rgba(vdo.color,0.5); ctx.fillText(String.fromCharCode(p.char), p.x, p.y); }
    }

    // Bloom: render bright layers to bloomCanvas, blur, and composite
    if(vdo.bloom){ 
      ensureBloomCanvas(); 
      bloomCtx.clearRect(0,0,vdo.width,vdo.height); 
      if(vdo.theme==='space' || vdo.theme==='cinematic'){
        bloomCtx.fillStyle = rgba(vdo.color,0.9); 
        for(let p of vdo.particles) bloomCtx.fillRect(p.x,p.y, Math.max(1,p.s)*2, Math.max(1,p.s)*2);
      } else { 
        bloomCtx.fillStyle = rgba(vdo.color,0.9); 
        for(let p of vdo.particles) bloomCtx.fillText(String.fromCharCode(p.char), Math.floor(p.x/10)*10, p.y);
      }
      try{ 
        ctx.save(); 
        ctx.filter = 'blur(8px)'; 
        ctx.globalCompositeOperation = 'lighter'; 
        ctx.drawImage(bloomCanvas,0,0); 
        ctx.restore(); 
        ctx.globalCompositeOperation = 'source-over'; 
      }catch(e){ console.warn('Bloom not supported',e); }
    }

    vdo.frame++;
    const percent = Math.min(100,(vdo.frame / vdo.maxFrames) * 100); 
    $('vdoTimelineBar').style.width = percent + '%'; 
    $('vdoTimeCounter').innerText = `${(vdo.frame / vdo.fps).toFixed(1)}s / ${vdo.duration}s`;
    if(vdo.frame >= vdo.maxFrames){ stopVdo(); } else vdo.rafId = requestAnimationFrame(renderFrame);
  }

  function rgba(hex,a){ 
    const h=hex.replace('#',''); 
    const bi=parseInt(h,16); 
    const r=(bi>>16)&255; 
    const g=(bi>>8)&255; 
    const b=bi&255; 
    return `rgba(${r},${g},${b},${a})`; 
  }

  function startVdo(){ 
    if(vdo.running) return; 
    vdo.running=true; 
    vdo.paused=false; 
    vdo.frame=0; 
    vdo.lastTS=0; 
    vdo.accum=0; 
    initParticles(); 
    $('videoThoughtOutput').hidden=false; 
    $('videoThoughtOutput').textContent=''; 
    $('vdoFrameContainer').hidden=false; 
    vdo.rafId = requestAnimationFrame(renderFrame); 
  }
  function stopVdo(){ 
    vdo.running=false; 
    vdo.paused=false; 
    if(vdo.rafId) cancelAnimationFrame(vdo.rafId); 
    vdo.rafId=null; 
    $('videoThoughtOutput').textContent += '\nRender completed.'; 
  }
  function toggleVdo(){ 
    if(!vdo.running) return; 
    vdo.paused = !vdo.paused; 
    $('vdoTogglePlay').textContent = vdo.paused ? '▶ Play' : '⏸ Pause'; 
  }

  // Recording: support combining canvas + optional audio file
  async function startRecording(){
    const canvas = $('generativeVideoCanvas'); 
    if(!canvas) return alert('Canvas not ready');
    const canvasStream = canvas.captureStream(vdo.fps);
    let finalStream = canvasStream;

    if(vdo.audioFile){
      try{
        const audioEl = document.createElement('audio'); 
        audioEl.src = URL.createObjectURL(vdo.audioFile); 
        audioEl.loop = false; 
        await audioEl.play().catch(()=>{});
        const audioStream = audioEl.captureStream ? audioEl.captureStream() : null;
        if(audioStream && audioStream.getAudioTracks().length){ 
          finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()]); 
        } else {
          const ac = new (window.AudioContext||window.webkitAudioContext)(); 
          const src = ac.createMediaElementSource(audioEl); 
          const dest = ac.createMediaStreamDestination(); 
          src.connect(dest); 
          finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]); 
        }
      }catch(err){ console.warn('Audio capture failed',err); }
    }

    vdo.recordedBlobs = [];
    try{
      const options = {mimeType:'video/webm;codecs=vp9'}; 
      vdo.mediaRecorder = new MediaRecorder(finalStream, options);
      vdo.mediaRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size) vdo.recordedBlobs.push(e.data); };
      vdo.mediaRecorder.onstop = ()=>{ 
        vdo.recordedWebm = new Blob(vdo.recordedBlobs, {type:'video/webm'}); 
        $('videoThoughtOutput').textContent += '\nRecording stopped (webm ready).'; 
        downloadWebM(); 
      };
      vdo.mediaRecorder.start(); 
      $('videoThoughtOutput').textContent += '\nRecording started.';
    }catch(err){ alert('Recording not supported: '+err.message); }
  }

  function stopRecording(){ 
    if(!vdo.mediaRecorder) return alert('No recording'); 
    vdo.mediaRecorder.stop(); 
    vdo.mediaRecorder = null; 
  }

  function downloadWebM(){
    if(!vdo.recordedWebm) return;
    const url = URL.createObjectURL(vdo.recordedWebm);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-output-'+Date.now()+'.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============= IMAGE STATE & RENDERING =============
  let img = {
    width:512, height:512, quality:'standard', style:'realism', canvas:null, ctx:null
  };

  function generateImage(){
    const prompt = $('imgPrompt')?.value || '';
    img.width = parseInt($('imgWidth')?.value || 512);
    img.height = parseInt($('imgHeight')?.value || 512);
    img.quality = $('imgQuality')?.value || 'standard';
    img.style = $('imgStyle')?.value || 'realism';

    img.canvas = $('synthesisCanvas');
    if(!img.canvas) return alert('Canvas not found');
    img.canvas.width = img.width;
    img.canvas.height = img.height;
    img.ctx = img.canvas.getContext('2d');

    // Simple procedural generation
    const noise = (x,y) => Math.sin(x*0.01)*Math.cos(y*0.01)*0.5+0.5;
    
    for(let y=0; y<img.height; y++){
      for(let x=0; x<img.width; x++){
        const n = noise(x+y*1234, x*5678+y);
        let r,g,b;
        
        if(img.style==='realism'){
          r = Math.floor(n*200+55); g = Math.floor(n*180+75); b = Math.floor(n*160+95);
        } else if(img.style==='abstract'){
          r = Math.floor(Math.sin(n*Math.PI)*255); g = Math.floor(Math.cos(n*Math.PI)*255); b = Math.floor(n*255);
        } else if(img.style==='cyberpunk'){
          r = Math.floor(n*255); g = 0; b = Math.floor((1-n)*255);
        } else {
          r = Math.floor(n*180+75); g = Math.floor(n*200+55); b = Math.floor(n*160+95);
        }
        
        img.ctx.fillStyle = `rgb(${r},${g},${b})`;
        img.ctx.fillRect(x, y, 1, 1);
      }
    }

    $('imgOutput').hidden = false;
  }

  function exportImagePNG(){
    if(!img.canvas) return alert('No image generated');
    const link = document.createElement('a');
    link.href = img.canvas.toDataURL('image/png');
    link.download = 'synthesized-image-'+Date.now()+'.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============= AUDIO STATE & RENDERING =============
  let aud = {
    context: null, oscillator: null, gain: null, running: false
  };

  async function startAudio(){
    const noiseType = $('audioType')?.value || 'white';
    const freq = parseFloat($('audioFrequency')?.value || 440);
    const duration = parseInt($('audioDuration')?.value || 300);
    const volume = parseFloat($('audioVolume')?.value || 50) / 100;

    if(!aud.context) aud.context = new (window.AudioContext || window.webkitAudioContext)();
    const ac = aud.context;
    
    if(aud.running) stopAudio();
    
    aud.gain = ac.createGain();
    aud.gain.gain.value = volume * 0.3;
    aud.gain.connect(ac.destination);

    if(noiseType==='binaural'){
      // Create two oscillators at slightly different frequencies
      const osc1 = ac.createOscillator();
      const osc2 = ac.createOscillator();
      osc1.frequency.value = freq;
      osc2.frequency.value = freq + 40;
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.connect(aud.gain);
      osc2.connect(aud.gain);
      osc1.start();
      osc2.start(ac.currentTime + duration);
      aud.oscillator = [osc1, osc2];
    } else {
      aud.oscillator = ac.createOscillator();
      aud.oscillator.type = noiseType==='brown'?'triangle':'sine';
      aud.oscillator.frequency.value = freq;
      aud.oscillator.connect(aud.gain);
      aud.oscillator.start();
      aud.oscillator.stop(ac.currentTime + duration);
    }

    aud.running = true;
    $('audioOutput').hidden = false;
    $('audioOutput').textContent = `Playing ${noiseType} noise at ${freq}Hz for ${duration}s`;
  }

  function stopAudio(){
    if(!aud.oscillator) return;
    if(Array.isArray(aud.oscillator)){
      aud.oscillator.forEach(o => o.stop());
    } else {
      try{ aud.oscillator.stop(); }catch(e){}
    }
    aud.oscillator = null;
    aud.running = false;
  }

  function exportAudioWAV(){
    alert('WAV export requires additional libraries. Download the WebM from video recording instead.');
  }

  // ============= BLOG / CONTENT MANAGEMENT SYSTEM =============
  const BLOG_STORAGE_KEY = 'hyperengine_blog_posts';
  
  class BlogSystem {
    constructor(){
      this.posts = this.loadPosts();
    }

    loadPosts(){
      const stored = localStorage.getItem(BLOG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    savePosts(){
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(this.posts));
    }

    createPost(title, content, tags=''){
      const post = {
        id: Date.now(),
        title: title,
        content: content,
        tags: tags.split(',').map(t=>t.trim()).filter(t=>t),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.posts.unshift(post);
      this.savePosts();
      return post;
    }

    updatePost(id, title, content, tags=''){
      const post = this.posts.find(p=>p.id==id);
      if(!post) return null;
      post.title = title;
      post.content = content;
      post.tags = tags.split(',').map(t=>t.trim()).filter(t=>t);
      post.updatedAt = new Date().toISOString();
      this.savePosts();
      return post;
    }

    deletePost(id){
      this.posts = this.posts.filter(p=>p.id!=id);
      this.savePosts();
    }

    getPost(id){
      return this.posts.find(p=>p.id==id);
    }

    getAllPosts(){
      return this.posts;
    }
  }

  const blog = new BlogSystem();

  function renderBlogList(){
    const container = $('blogPostsList');
    if(!container) return;
    
    const posts = blog.getAllPosts();
    if(posts.length===0){
      container.innerHTML = '<p style="text-align:center;color:#999;">No blog posts yet. Create your first post!</p>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <article class="blog-post-card" style="border:1px solid #ddd;padding:16px;margin-bottom:12px;border-radius:8px;">
        <h3 style="margin:0 0 8px 0;color:#333;">${escapeHtml(post.title)}</h3>
        <p style="margin:0 0 12px 0;color:#666;font-size:14px;">${new Date(post.createdAt).toLocaleDateString()}</p>
        <p style="margin:0 0 12px 0;color:#555;line-height:1.6;">${escapeHtml(post.content.substring(0,150))}...</p>
        <div style="display:flex;gap:8px;">
          <button class="blog-read-btn" data-post-id="${post.id}" style="background:#5856d6;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Read</button>
          <button class="blog-edit-btn" data-post-id="${post.id}" style="background:#34c759;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Edit</button>
          <button class="blog-delete-btn" data-post-id="${post.id}" style="background:#ff3b30;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Delete</button>
        </div>
      </article>
    `).join('');

    qsAll('.blog-read-btn').forEach(btn => btn.addEventListener('click', (e)=>{
      const id = parseInt(e.target.getAttribute('data-post-id'));
      viewBlogPost(id);
    }));
    qsAll('.blog-edit-btn').forEach(btn => btn.addEventListener('click', (e)=>{
      const id = parseInt(e.target.getAttribute('data-post-id'));
      editBlogPost(id);
    }));
    qsAll('.blog-delete-btn').forEach(btn => btn.addEventListener('click', (e)=>{
      const id = parseInt(e.target.getAttribute('data-post-id'));
      if(confirm('Delete this post?')){
        blog.deletePost(id);
        renderBlogList();
      }
    }));
  }

  function viewBlogPost(id){
    const post = blog.getPost(id);
    if(!post) return;
    alert(`Title: ${post.title}\n\nTags: ${post.tags.join(', ')}\n\n${post.content}`);
  }

  function editBlogPost(id){
    const post = blog.getPost(id);
    if(!post) return;
    $('blogEditId').value = id;
    $('blogEditTitle').value = post.title;
    $('blogEditContent').value = post.content;
    $('blogEditTags').value = post.tags.join(', ');
    openModal('blogEditModal');
  }

  function escapeHtml(txt){
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML;
  }

  // Wire up blog UI
  $('blogNewBtn')?.addEventListener('click', ()=>{
    $('blogEditId').value = '';
    $('blogEditTitle').value = '';
    $('blogEditContent').value = '';
    $('blogEditTags').value = '';
    openModal('blogEditModal');
  });

  $('blogEditSaveBtn')?.addEventListener('click', ()=>{
    const id = $('blogEditId').value;
    const title = $('blogEditTitle').value.trim();
    const content = $('blogEditContent').value.trim();
    const tags = $('blogEditTags').value.trim();

    if(!title || !content){
      alert('Title and content required');
      return;
    }

    if(id){
      blog.updatePost(parseInt(id), title, content, tags);
    } else {
      blog.createPost(title, content, tags);
    }
    closeModal($('blogEditModal'));
    renderBlogList();
  });

  // Initialize blog on load
  if($('blogPostsList')) renderBlogList();

  // ============= VIDEO ENGINE UI =============
  $('vdoGenerate')?.addEventListener('click', ()=>{
    const prompt = $('vdoPrompt')?.value || '';
    const nlpEnabled = $('vdoNlpParse')?.checked;
    if(nlpEnabled && prompt.trim()){
      const parsed = parsePromptToParams(prompt); 
      if(parsed.theme) $('vdoTheme').value = parsed.theme; 
      if(parsed.color) $('vdoColor').value = parsed.color; 
      if(parsed.fps) $('vdoFps').value = parsed.fps; 
      if(parsed.particles) $('vdoParticles').value = parsed.particles; 
      if(parsed.motionBlur) $('vdoMotionBlur').checked = true; 
      if(parsed.bloom) $('vdoBloom').checked = true; 
    }
    vdo.duration = Math.max(1, parseInt($('vdoDuration').value||10)); 
    vdo.fps = Math.max(5, parseInt($('vdoFps').value||30)); 
    vdo.maxFrames = vdo.duration * vdo.fps; 
    vdo.particleCount = parseInt($('vdoParticles').value||160); 
    vdo.theme = $('vdoTheme').value || 'matrix'; 
    vdo.color = $('vdoColor').value || '#5856d6'; 
    vdo.motionBlur = $('vdoMotionBlur').checked; 
    vdo.bloom = $('vdoBloom').checked;

    const res = $('vdoResolution').value || '640x360'; 
    resizeCanvas(res);
    if($('vdoAutoScale').checked){ 
      const [w,h] = res.split('x').map(Number); 
      const area = (w*h)/(640*360); 
      vdo.particleCount = Math.min(800, Math.max(20, Math.floor(vdo.particleCount*area)));
    }
    const audioFile = $('vdoAudioUpload')?.files?.[0]; 
    vdo.audioFile = audioFile || null;
    $('videoThoughtOutput').hidden = false; 
    $('videoThoughtOutput').textContent = `Prompt: ${prompt}\nTheme:${vdo.theme} | Particles:${vdo.particleCount} | ${res} | ${vdo.fps}fps | ${vdo.duration}s`;
    initParticles(); 
    startVdo();
  });

  $('vdoTogglePlay')?.addEventListener('click', ()=>{ toggleVdo(); });
  $('vdoRecord')?.addEventListener('click', ()=>{ startRecording(); });
  $('vdoStopRecord')?.addEventListener('click', ()=>{ stopRecording(); });

  // Range slider live updates
  $('vdoParticles')?.addEventListener('input', (e)=>{ $('vdoParticlesValue').textContent = e.target.value; });
  $('audioVolume')?.addEventListener('input', (e)=>{ $('audioVolumeValue').textContent = e.target.value; });

  // ============= IMAGE ENGINE UI =============
  $('imgGenerate')?.addEventListener('click', ()=>{ generateImage(); });
  $('imgExport')?.addEventListener('click', ()=>{ exportImagePNG(); });

  // ============= AUDIO ENGINE UI =============
  $('audioStart')?.addEventListener('click', ()=>{ startAudio(); });
  $('audioStop')?.addEventListener('click', ()=>{ stopAudio(); });
  $('audioExport')?.addEventListener('click', ()=>{ exportAudioWAV(); });

  // Expose functions for global access
  window.initializeAndPlayVideoMatrixLoop = function(){ $('vdoGenerate')?.click(); };
  window.toggleVideoPlaybackState = function(){ $('vdoTogglePlay')?.click(); };
  window.generateImage = generateImage;
  window.startAudio = startAudio;
  window.stopAudio = stopAudio;

})();