// This script injects an AI Code Reviewer tool card and modal into the existing page
// It does not modify existing HTML files — it appends UI at runtime.

document.addEventListener('DOMContentLoaded', () => {
  try {
    const grid = document.querySelector('.tools-grid');
    if (!grid) return;

    // Create tool card
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <div class="tool-icon">🤖</div>
      <h3>AI Code Reviewer</h3>
      <p>Paste code and get an expert review, inline suggestions, and a minimal patch powered by an AI model.</p>
      <button class="btn btn-primary">Launch Tool</button>
    `;
    card.addEventListener('click', () => openAIReviewerModal());
    grid.appendChild(card);

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'aiModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">AI Code Reviewer</div>
          <button class="close-btn" id="aiModalClose">✖</button>
        </div>
        <div>
          <div class="form-group">
            <label for="ai-language">Language</label>
            <select id="ai-language">
              <option value="auto">Auto-detect</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="csharp">C#</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ai-code">Paste your code</label>
            <textarea id="ai-code" placeholder="Paste code here..."></textarea>
          </div>
          <div style="display:flex;gap:1rem;flex-wrap:wrap;">
            <button class="btn btn-primary" id="aiRunBtn">Run Review</button>
            <button class="btn btn-secondary" id="aiClearBtn">Clear</button>
          </div>
          <div id="aiOutput" style="margin-top:1.5rem;display:none;">
            <h3 style="color:white;font-size:1.1rem;margin-bottom:0.8rem;">Summary</h3>
            <pre id="aiSummary" class="output-box" style="white-space:pre-wrap;color:var(--success);"></pre>
            <h3 style="color:white;font-size:1.1rem;margin:16px 0 8px;">Patch / Suggestion</h3>
            <pre id="aiPatch" class="output-box" style="white-space:pre-wrap;color:var(--success);"></pre>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Modal handlers
    const aiModal = document.getElementById('aiModal');
    const closeBtn = document.getElementById('aiModalClose');
    closeBtn.addEventListener('click', () => { aiModal.classList.remove('active'); });

    window.openAIReviewerModal = () => {
      aiModal.classList.add('active');
    };

    // Run review
    const runBtn = document.getElementById('aiRunBtn');
    const clearBtn = document.getElementById('aiClearBtn');
    const codeInput = document.getElementById('ai-code');
    const langSelect = document.getElementById('ai-language');
    const outputWrap = document.getElementById('aiOutput');
    const summaryEl = document.getElementById('aiSummary');
    const patchEl = document.getElementById('aiPatch');

    runBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      const language = langSelect.value || 'auto';
      if (!code) {
        alert('Please paste some code to review.');
        return;
      }

      runBtn.disabled = true;
      runBtn.textContent = 'Reviewing...';
      try {
        const res = await fetch('/api/ai-reviewer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language })
        });
        const data = await res.json();

        outputWrap.style.display = 'block';
        if (data.summary) summaryEl.textContent = typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary, null, 2);
        else if (data.raw) summaryEl.textContent = data.raw;
        else summaryEl.textContent = JSON.stringify(data, null, 2);

        patchEl.textContent = data.patch || '';
      } catch (err) {
        alert('Error running review: ' + err.message);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Run Review';
      }
    });

    clearBtn.addEventListener('click', () => {
      codeInput.value = '';
      summaryEl.textContent = '';
      patchEl.textContent = '';
      outputWrap.style.display = 'none';
    });

  } catch (e) {
    console.error('ai-inject script failed', e);
  }
});
