const { ipcRenderer, shell } = require('electron');

const __onload__ = () => {
  const btn = document.querySelector('button#start-auth');
  btn.addEventListener('click', () => {
    btn.setAttribute('disabled', true);
    ipcRenderer.send('auth-start');
  });
  ipcRenderer.on('auth-success', async (ev, tokens) => {
    document.querySelector('div.logged-out').style.display = 'none';
    document.querySelector('div.logged-in').style.display = 'inline';
  });
};

window.onload = __onload__;
