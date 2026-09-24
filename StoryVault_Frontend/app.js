// --- 1. GRAB HTML ELEMENTS ---
const form = document.getElementById('search-form');
const topicInput = document.getElementById('topic-input');
const submitBtn = document.getElementById('submit-btn');
const resetBtn = document.getElementById('reset-btn');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');

const resultTopic = document.getElementById('result-topic');
const resultSummary = document.getElementById('result-summary');
const warningsList = document.getElementById('warnings-list');
const timelineList = document.getElementById('timeline-list');
const sourcesList = document.getElementById('sources-list');

// --- 2. QUICK DEMO TAG HELPER ---
function quickSearch(topicName) {
  topicInput.value = topicName;
  form.dispatchEvent(new Event('submit'));
}

// --- 3. INTERACTIVE TAB SWITCHER ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
  }
  
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

// --- 4. FORM SUBMISSION (CONNECTS TO BACKEND) ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const topic = topicInput.value.trim();
  if (!topic) return;

  showLoading();

  try {
    // Sends request to live backend server running on Port 5000
    const response = await fetch('http://localhost:5000/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (!response.ok) {
      throw new Error('Server error: Could not complete research request.');
    }

    const data = await response.json();
    renderResults(data);

  } catch (err) {
    showError(err.message || 'An error occurred while connecting to the server.');
  }
});

// --- 5. RESET BUTTON CLICK ---
resetBtn.addEventListener('click', () => {
  topicInput.value = '';
  hideAll();
  submitBtn.disabled = false;
  submitBtn.innerText = 'Start Research';
  resetBtn.classList.add('hidden');
});

// --- 6. UI STATE HELPERS ---
function showLoading() {
  hideAll();
  loadingState.classList.remove('hidden');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Running Actor...';
}

function showError(msg) {
  hideAll();
  errorMessage.innerText = msg;
  errorState.classList.remove('hidden');
  submitBtn.disabled = false;
  submitBtn.innerText = 'Start Research';
  resetBtn.classList.remove('hidden');
}

// --- 7. DISPLAY RESULTS FROM BACKEND ---
function renderResults(data) {
  hideAll();

  // Populate Overview Tab
  resultTopic.innerText = data.topic || topicInput.value;
  resultSummary.innerText = data.summary || 'No summary available for this research topic.';

  // Populate Timeline Tab
  timelineList.innerHTML = '';
  if (data.timeline && data.timeline.length > 0) {
    data.timeline.forEach(item => {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-date">${item.date || 'Historical Period'}</div>
        <div class="timeline-title">${item.event || 'Historical Event'}</div>
        <p class="timeline-desc">${item.description || ''}</p>
        ${item.sourceUrl ? `<a href="${item.sourceUrl}" target="_blank" class="source-link">View Original Record ↗</a>` : ''}
      `;
      timelineList.appendChild(div);
    });
  } else {
    timelineList.innerHTML = '<p>No timeline records retrieved.</p>';
  }

  // Populate Sources Tab
  sourcesList.innerHTML = '';
  if (data.sources && data.sources.length > 0) {
    data.sources.forEach(src => {
      const div = document.createElement('div');
      div.className = 'source-card';
      div.innerHTML = `
        <div>
          <strong style="font-size: 1rem; display: block; margin-bottom: 4px;">${src.title || 'Audited Web Record'}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Domain: ${src.domain || 'Public Archive'}</span>
        </div>
        <a href="${src.url}" target="_blank" class="source-link">${src.url} ↗</a>
      `;
      sourcesList.appendChild(div);
    });
  } else {
    sourcesList.innerHTML = '<p>No audited sources attached.</p>';
  }

  // Populate Integrity & Warnings Tab
  warningsList.innerHTML = '';
  if (data.warnings && data.warnings.length > 0) {
    data.warnings.forEach(warn => {
      const li = document.createElement('li');
      li.innerText = warn;
      warningsList.appendChild(li);
    });
  } else {
    warningsList.innerHTML = '<li>No source conflict warnings flagged for this query.</li>';
  }

  resultsContainer.classList.remove('hidden');
  submitBtn.disabled = false;
  submitBtn.innerText = 'Start Research';
  resetBtn.classList.remove('hidden');
}

function hideAll() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsContainer.classList.add('hidden');
}