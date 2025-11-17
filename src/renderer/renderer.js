// @ts-check
/* global window, document */

let currentConfig = null;
let currentRepository = null;

// UI Elements
const loginScreen = document.getElementById('loginScreen');
const browserScreen = document.getElementById('browserScreen');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const registryUrlInput = document.getElementById('registryUrl');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const saveCredentialsCheckbox = document.getElementById('saveCredentials');
const connectBtn = document.getElementById('connectBtn');
const aboutBtn = document.getElementById('aboutBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const repositoryList = document.getElementById('repositoryList');
const contentTitle = document.getElementById('contentTitle');
const contentBody = document.getElementById('contentBody');

// Utility Functions
function showError(message) {
  loginError.textContent = message;
  loginError.classList.remove('hidden');
  loginSuccess.classList.add('hidden');
}

function showSuccess(message) {
  loginSuccess.textContent = message;
  loginSuccess.classList.remove('hidden');
  loginError.classList.add('hidden');
}

function hideMessages() {
  loginError.classList.add('hidden');
  loginSuccess.classList.add('hidden');
}

function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  browserScreen.classList.add('hidden');
}

function showBrowserScreen() {
  loginScreen.classList.add('hidden');
  browserScreen.classList.remove('hidden');
}

// Load saved credentials on startup
async function loadSavedCredentials() {
  try {
    const result = await window.electronAPI.getCredentials();
    if (result.success && result.credentials) {
      const creds = result.credentials;
      if (creds.registryUrl) registryUrlInput.value = creds.registryUrl;
      if (creds.username) usernameInput.value = creds.username;
      if (creds.password) passwordInput.value = creds.password;
      if (creds.saved) saveCredentialsCheckbox.checked = true;
    }
  } catch (error) {
    console.error('Failed to load credentials:', error);
  }
}

// Connect to Registry
connectBtn.addEventListener('click', async () => {
  hideMessages();
  
  const registryUrl = registryUrlInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!registryUrl) {
    showError('Please enter a registry URL');
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = 'Connecting...';

  try {
    const config = { registryUrl, username, password };
    
    // Test connection
    const testResult = await window.electronAPI.testConnection(config);
    if (!testResult.success) {
      throw new Error(testResult.error || 'Connection failed');
    }

    // Save credentials if requested
    if (saveCredentialsCheckbox.checked) {
      await window.electronAPI.saveCredentials({
        registryUrl,
        username,
        password,
        saved: true,
      });
    } else {
      await window.electronAPI.clearCredentials();
    }

    currentConfig = config;
    showBrowserScreen();
    await loadRepositories();

  } catch (error) {
    showError(error.message);
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = 'Connect';
  }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
  currentConfig = null;
  currentRepository = null;
  showLoginScreen();
});

// About
aboutBtn.addEventListener('click', async () => {
  await window.electronAPI.showAbout();
});

// Load Repositories
async function loadRepositories() {
  repositoryList.innerHTML = '<div class="loading">Loading repositories...</div>';

  try {
    const result = await window.electronAPI.getRepositories(currentConfig);
    if (!result.success) {
      throw new Error(result.error || 'Failed to load repositories');
    }

    const repositories = result.repositories;
    
    if (repositories.length === 0) {
      repositoryList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No repositories found</p></div>';
      return;
    }

    repositoryList.innerHTML = '';
    repositories.forEach((repo) => {
      const item = document.createElement('div');
      item.className = 'repository-item';
      item.textContent = repo;
      item.addEventListener('click', () => selectRepository(repo));
      repositoryList.appendChild(item);
    });

  } catch (error) {
    repositoryList.innerHTML = `<div class="error-message">${error.message}</div>`;
  }
}

// Select Repository
async function selectRepository(repository) {
  currentRepository = repository;
  
  // Update active state
  const items = repositoryList.querySelectorAll('.repository-item');
  items.forEach(item => {
    if (item.textContent === repository) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  contentTitle.textContent = repository;
  contentBody.innerHTML = '<div class="loading">Loading tags...</div>';

  try {
    const result = await window.electronAPI.getTags(currentConfig, repository);
    if (!result.success) {
      throw new Error(result.error || 'Failed to load tags');
    }

    const tags = result.tags;
    
    if (tags.length === 0) {
      contentBody.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏷️</div><p>No tags found for this repository</p></div>';
      return;
    }

    contentBody.innerHTML = '<div class="tags-grid"></div>';
    const tagsGrid = contentBody.querySelector('.tags-grid');

    tags.forEach((tag) => {
      const card = document.createElement('div');
      card.className = 'tag-card';
      card.innerHTML = `<div class="tag-name">${tag}</div>`;
      card.addEventListener('click', () => showManifest(repository, tag));
      tagsGrid.appendChild(card);
    });

  } catch (error) {
    contentBody.innerHTML = `<div class="error-message">${error.message}</div>`;
  }
}

// Show Manifest
async function showManifest(repository, tag) {
  const existingManifest = document.getElementById('manifest-' + tag);
  if (existingManifest) {
    existingManifest.remove();
    return;
  }

  try {
    const result = await window.electronAPI.getManifest(currentConfig, repository, tag);
    if (!result.success) {
      throw new Error(result.error || 'Failed to load manifest');
    }

    const manifest = result.manifest;
    
    const manifestDiv = document.createElement('div');
    manifestDiv.id = 'manifest-' + tag;
    manifestDiv.className = 'manifest-details';
    manifestDiv.innerHTML = `
      <h3>Manifest for ${tag}</h3>
      <pre>${JSON.stringify(manifest, null, 2)}</pre>
    `;

    const tagsGrid = contentBody.querySelector('.tags-grid');
    if (tagsGrid) {
      tagsGrid.insertAdjacentElement('afterend', manifestDiv);
    }

  } catch (error) {
    alert(error.message);
  }
}

// Initialize
loadSavedCredentials();
