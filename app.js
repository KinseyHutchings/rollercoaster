const tabs = document.querySelectorAll('.view-tab');
const screens = {
  editor: document.querySelector('#editor-screen'),
  ride: document.querySelector('#ride-screen'),
};

function showScreen(name) {
  for (const [screenName, screen] of Object.entries(screens)) {
    const active = screenName === name;
    screen.hidden = !active;
    screen.classList.toggle('is-hidden', !active);
    document.querySelector(`[data-screen="${screenName}"]`).setAttribute('aria-selected', String(active));
  }
}

for (const tab of tabs) {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
}

document.querySelector('#preview-ride').addEventListener('click', () => showScreen('ride'));
document.querySelector('#back-to-editor').addEventListener('click', () => showScreen('editor'));
