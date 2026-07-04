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
    // focus first focusable element
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
      // click outside or close button
      const modalEl = e.target.closest('.modal-overlay');
      closeModal(modalEl || e.target.closest('.modal-window').parentElement);
      return;
    }
  });

  // Prevent clicks inside modal-window from closing
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.modal-window')) e.stopPropagation();
  }, true);

  // --- Video engine (canvas demo) ---
  let vdoPlayback = true; let vdoFrame=0; const vdoMax=300; let vdoTheme='matrix'; let vdoRAF=0;
  function renderVdo(){
    const canvas = $('generativeVideoCanvas'); if(!canvas) return;
    const ctx = canvas.getContext('2d'); const W=canvas.width, H=canvas.height;
    ctx.fillStyle='#020306'; ctx.fillRect(0,0,W,H);
    if(vdoTheme==='space'){
      ctx.strokeStyle='rgba(255,59,48,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(W/2,H/2,(vdoFrame*1.5)%(W/1.2),0,Math.PI*2); ctx.stroke();
    } else {
      ctx.fillStyle='rgba(88,86,214,0.8)'; ctx.font='11px monospace';
      for(let col=0; col<W; col+=20){ let speed=((col*93)%15)+5; let y=(vdoFrame*speed)%H; ctx.fillText(String.fromCharCode(33+(col%93)),col,y); ctx.fillStyle='rgba(163,86,255,0.2)'; ctx.fillRect(col,y-40,2,40); ctx.fillStyle='rgba(88,86,214,0.8)'; }
    }
    vdoFrame = (vdoFrame+1)%vdoMax; $('vdoTimelineBar').style.width = ((vdoFrame/vdoMax)*100)+'%'; $('vdoTimeCounter').innerText = (vdoFrame/30).toFixed(1)+'s / 10.0s';
    vdoRAF = requestAnimationFrame(renderVdo);
  }
  // Generate button
  $('vdoGenerate')?.addEventListener('click', ()=>{
    const prompt = ($('vdoPrompt')?.value||'').toLowerCase(); const out=$('videoThoughtOutput'); if(out){ out.hidden=false; out.textContent='Parsing...'; }
    vdoTheme = /space|galaxy|crimson/.test(prompt)?'space':'matrix';
    setTimeout(()=>{ if(out) out.textContent += '\nSynthesis complete.'; $('vdoFrameContainer').hidden=false; if(vdoRAF) cancelAnimationFrame(vdoRAF); vdoRAF = requestAnimationFrame(renderVdo); },800);
  });
  $('playStateBtn')?.addEventListener('click', ()=>{ vdoPlayback = !vdoPlayback; $('playStateBtn').textContent = vdoPlayback? '⏸ PAUSE':'▶ PLAY'; if(!vdoPlayback && vdoRAF) cancelAnimationFrame(vdoRAF); if(vdoPlayback) vdoRAF = requestAnimationFrame(renderVdo); });

  // --- Image synth (simple canvas render) ---
  $('imgGenerate')?.addEventListener('click', ()=>{
    const style = $('imgStyle')?.value || 'photorealistic'; const outCont = $('imgOutputContainer'); const img = $('imgFinalPreview'); if(outCont) outCont.hidden=false; if(!img) return;
    const c = document.createElement('canvas'); c.width=640; c.height=360; const ctx=c.getContext('2d'); ctx.fillStyle='#0c0e17'; ctx.fillRect(0,0,640,360);
    let color='#5856d6'; if(style==='anime') color='#ff3b30'; if(style==='oil') color='#ff9500';
    for(let i=0;i<60;i++){ ctx.fillStyle = i%2?color:'#171b2f'; ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc((i*23)%640,(i*17)%360,(i*3)%80,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1; ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif'; ctx.fillText('Engine: '+style.toUpperCase(),20,320);
    img.src = c.toDataURL('image/png');
    $('imgDownload')?.addEventListener('click', ()=>{ if(!img.src) return alert('No image'); const a=document.createElement('a'); a.href=img.src; a.download='neural_synthesis.png'; a.click(); });
  });

  // --- Audio (WebAudio) ---
  let audioCtx=null, audioNode=null;
  async function startAudio(){ if(audioCtx) return; const type = $('audioNoiseType')?.value||'brownian'; audioCtx = new (window.AudioContext||window.webkitAudioContext)(); // resume on user gesture
    const sampleRate = audioCtx.sampleRate; const frameCount = sampleRate * 2; const buffer = audioCtx.createBuffer(1, frameCount, sampleRate); const d = buffer.getChannelData(0);
    if(type==='brownian'){ let acc=0; for(let i=0;i<frameCount;i++){ const r = Math.random()*2-1; d[i] = (acc + 0.02*r)/1.02; acc = d[i]; d[i]*=3.5; } } else { for(let i=0;i<frameCount;i++) d[i]=Math.random()*2-1; }
    audioNode = audioCtx.createBufferSource(); audioNode.buffer = buffer; audioNode.loop = true; const g = audioCtx.createGain(); g.gain.value = type==='white'?0.08:0.25; audioNode.connect(g); g.connect(audioCtx.destination); audioNode.start(); }
  function stopAudio(){ if(audioNode){ try{ audioNode.stop(); }catch(e){} audioNode.disconnect(); audioNode=null; } if(audioCtx){ audioCtx.close(); audioCtx=null; } }
  $('startAudio')?.addEventListener('click', ()=>{ startAudio().catch(err=>alert('Audio error: '+err.message)) });
  $('stopAudio')?.addEventListener('click', ()=> stopAudio());

  // --- Key generator ---
  $('generateKey')?.addEventListener('click', ()=>{
    const len = Math.max(6, parseInt($('keyTargetLength')?.value || 16)); const upper = $('chkUpper')?.checked; const lower = $('chkLower')?.checked; const num = $('chkNum')?.checked; const sym = $('chkSym')?.checked;
    let pool=''; if(upper) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if(lower) pool += 'abcdefghijklmnopqrstuvwxyz'; if(num) pool += '0123456789'; if(sym) pool += '!@#$%^&*()-_=+[]{};:,.<>/?'; if(!pool) return alert('Select at least one charset');
    let out=''; const cryptoObj = window.crypto || window.msCrypto; const arr = new Uint32Array(len); cryptoObj.getRandomValues(arr); for(let i=0;i<len;i++) out += pool[arr[i] % pool.length]; $('keyStringOutput').textContent = out; 
  });

  // --- Base64 ---
  $('b64Encode')?.addEventListener('click', ()=>{
    const txt = $('b64DataPayload')?.value || ''; try{ $('b64TerminalResult').textContent = btoa(unescape(encodeURIComponent(txt))); }catch(e){ $('b64TerminalResult').textContent = 'Encode error: '+e.message; }
  });
  $('b64Decode')?.addEventListener('click', ()=>{
    const txt = $('b64DataPayload')?.value || ''; try{ $('b64TerminalResult').textContent = decodeURIComponent(escape(atob(txt))); }catch(e){ $('b64TerminalResult').textContent = 'Decode error: '+e.message; }
  });

  // --- Resizer ---
  let resizerSourceImg = null;
  $('resizerFileInput')?.addEventListener('change', (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = (ev)=>{ const img = new Image(); img.onload = ()=>{ resizerSourceImg = img; }; img.src = ev.target.result; }; r.readAsDataURL(f); });
  $('doResize')?.addEventListener('click', ()=>{
    const w = parseInt($('resizeTargetX')?.value)||800; const h = parseInt($('resizeTargetY')?.value)||600; if(!resizerSourceImg) return alert('Upload an image first'); const c = document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.drawImage(resizerSourceImg,0,0,w,h); const data=c.toDataURL('image/png'); $('resizerOutputPreviewImage').src=data; $('resizerOutputBlock').hidden=false; $('resizerDownload').onclick=()=>{ const a=document.createElement('a'); a.href=data; a.download='resized_image.png'; a.click(); };
  });

  // --- Merger ---
  let mergerA=null, mergerB=null;
  $('mergerFile1')?.addEventListener('change',(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ const img=new Image(); img.onload=()=>mergerA=img; img.src=ev.target.result; }; r.readAsDataURL(f); });
  $('mergerFile2')?.addEventListener('change',(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ const img=new Image(); img.onload=()=>mergerB=img; img.src=ev.target.result; }; r.readAsDataURL(f); });
  $('doMerge')?.addEventListener('click', ()=>{
    if(!mergerA || !mergerB) return alert('Upload both images'); const orientation = $('mergeOrientation')?.value||'vertical'; let w = orientation==='horizontal' ? mergerA.width+mergerB.width : Math.max(mergerA.width, mergerB.width); let h = orientation==='vertical' ? mergerA.height+mergerB.height : Math.max(mergerA.height, mergerB.height); const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); if(orientation==='vertical'){ ctx.drawImage(mergerA,0,0); ctx.drawImage(mergerB,0,mergerA.height); } else { ctx.drawImage(mergerA,0,0); ctx.drawImage(mergerB,mergerA.width,0); } const data=c.toDataURL('image/png'); $('mergerOutputPreviewImage').src=data; $('mergerOutputBlock').hidden=false; $('mergerDownload').onclick=()=>{ const a=document.createElement('a'); a.href=data; a.download='merged_composition.png'; a.click(); };
  });

  // --- PDF extract and Text->PDF ---
  $('pdfDeconstructBtn')?.addEventListener('click', async ()=>{
    const file = $('pdfDeconstructFileInput')?.files?.[0]; if(!file) return alert('Select a PDF'); const arr = await file.arrayBuffer(); const pdf = await pdfjsLib.getDocument({data:arr}).promise; $('pdfDeconstructLogs').textContent = `Pages: ${pdf.numPages}`; const outArea = $('pdfDeconstructOutputArea'); outArea.innerHTML=''; for(let i=1;i<=Math.min(pdf.numPages,6);i++){ const p = await pdf.getPage(i); const viewport = p.getViewport({scale:1}); const canvas=document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height; const ctx = canvas.getContext('2d'); await p.render({canvasContext:ctx,viewport}).promise; const img = new Image(); img.src = canvas.toDataURL(); outArea.appendChild(img); }
  });
  $('pdfTextToPdf')?.addEventListener('click', ()=>{
    const name = $('pdfTextOutName')?.value || 'document.pdf'; const body = $('pdfTextOutBody')?.value || '';
    try{ const { jsPDF } = window.jspdf; const doc = new jsPDF(); const lines = doc.splitTextToSize(body,180); doc.text(lines,10,10); doc.save(name); }catch(e){ alert('PDF error: '+e.message); }
  });

  // --- Markdown preview & download ---
  function renderMarkdown(md){ if(md.trim()===''){ $('notePreviewArea').innerHTML=''; return; } // very small parser
    let html = md.replace(/^# (.*$)/gim,'<h1>$1</h1>').replace(/^## (.*$)/gim,'<h2>$1</h2>').replace(/\*\*(.*?)\*\*/gim,'<strong>$1</strong>').replace(/\*(.*?)\*/gim,'<em>$1</em>').replace(/(^|\n)- (.*)/gim,'<ul><li>$2</li></ul>').replace(/\n/g,'<br>'); return html;
  }
  $('noteInput')?.addEventListener('input', (e)=>{ const md = e.target.value; $('notePreviewArea').innerHTML = renderMarkdown(md) || ''; });
  $('downloadMd')?.addEventListener('click', ()=>{ const md=$('noteInput')?.value||''; const blob=new Blob([md],{type:'text/markdown'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='notes.md'; a.click(); URL.revokeObjectURL(a.href); });

  // Close modals by setting aria-hidden
  qsAll('.modal-overlay').forEach(m=> m.setAttribute('aria-hidden','true'));

  // Expose open/close to global for inline calls if needed
  window.openEngineModal = openModal; window.closeEngineModal = closeModal;

})();
