// Merge script - handles Rise/Wilds toggle
// This runs in the browser context

let currentGame = 'rise'; // 'rise' or 'wilds'
let riseApp = null;
let wildsApp = null;

function showGame(game) {
  currentGame = game;
  
  const riseElements = [
    'topbar-rise', 'home-view-rise', 'detail-rise',
    'decorations-view-rise', 'weapons-view-rise', 'armor-view-rise',
    'materials-view-rise', 'skills-view-rise'
  ];
  
  const wildsElements = [
    'topbar-wilds', 'home-view-wilds', 'detail-wilds',
    'decorations-view-wilds', 'charms-view-wilds', 'weapons-view-wilds',
    'armor-view-wilds', 'skills-view-wilds'
  ];
  
  const show = game === 'rise' ? riseElements : wildsElements;
  const hide = game === 'rise' ? wildsElements : riseElements;
  
  show.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  });
  
  hide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
  
  // Update toggle buttons
  document.getElementById('btn-rise').classList.toggle('active', game === 'rise');
  document.getElementById('btn-wilds').classList.toggle('active', game === 'wilds');
  
  // Update URL
  const url = new URL(location.href);
  url.searchParams.set('game', game);
  history.pushState(null, '', url);
  
  // Initialize the app if needed
  if (game === 'rise' && !riseApp) {
    if (typeof initRise === 'function') initRise();
  } else if (game === 'wilds' && !wildsApp) {
    if (typeof initWilds === 'function') initWilds();
  }
}

function initMerge() {
  // Check URL for game parameter
  const params = new URLSearchParams(location.search);
  const game = params.get('game') || 'rise';
  
  // Set up toggle buttons
  document.getElementById('btn-rise').addEventListener('click', () => showGame('rise'));
  document.getElementById('btn-wilds').addEventListener('click', () => showGame('wilds'));
  
  // Show initial game
  showGame(game);
  
  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(location.search);
    const game = params.get('game') || 'rise';
    showGame(game);
  });
}

// Expose for apps to call
window.showGame = showGame;
window.currentGame = () => currentGame;

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMerge);
} else {
  initMerge();
}