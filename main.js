const path = require('path');
const os = require('os');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { OAuth2Client } = require('google-auth-library');

require('dotenv').config();

// Import CLIENT URL and OAUTH2 API KEY
const client_id = process.env.ELECTRON_APP_CLIENT_ID;
const client_secret = process.env.ELECTRON_APP_API_KEY;

app.on('ready', () => {
    const topWindow = new BrowserWindow({
        title: 'Play Pac-Man',
        webPreferences: { nodeIntegration: true }
    });
    topWindow.loadURL(`file://${__dirname}/index.html`);

    ipcMain.on('auth-start', async () => {
        // 0) Initialize OAuth Client
        const client = initOAuthClient();
        const url = client.generateAuthUrl({
            scope: ['https://www.googleapis.com/auth/userinfo.profile']
        });
        // 1) Create another window and get code.
        const auth = new BrowserWindow({ x: 60, y: 60, useContentSize: true });
        const code = await getOAuthCodeByInteraction(auth, url);
        // 2) Exchange OAuth code for tokens.
        const response = await client.getToken(code);
        // 3) Notify top window auth-success with tokens.
        topWindow.send('auth-success', response.tokens);
    });
});

/**
 * Initialize OAuth client with secret values.
 */
const initOAuthClient = () => {
    return new OAuth2Client({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    });
};

// const initOAuthClient = () => {
//     return new OAuth2Client({
//         clientId: `${process.env.ELECTRON_APP_CLIENT_ID}`,
//         clientSecret: `${process.env.ELECTRON_APP_API_KEY}`,
//         redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
//     });
// };

/**
 * This method opens a new window to let users log-in the OAuth provider service,
 * grant permissions to OAuth client service (this application),
 * and returns OAuth code which can be exchanged for the real API access keys.
 * 
 * @param {*} interactionWindow a window in which the user will have interaction with OAuth provider service.
 * @param {*} authPageURL an URL of OAuth provider service, which will ask the user grants permission to us.
 * @returns {Promise<string>}
 */
const getOAuthCodeByInteraction = (interactionWindow, authPageURL) => {
    interactionWindow.loadURL(authPageURL);
    return new Promise((resolve, reject) => {
        const onclosed = () => {
            reject('Interaction ended intentionally');
        };
        interactionWindow.on('closed', onclosed);
        interactionWindow.on('page-title-updated', (ev) => {
            const url = new URL(ev.sender.getURL());
            if (url.searchParams.get('approvalCode')) {
                interactionWindow.removeListener('closed', onclosed);
                interactionWindow.close();
                return resolve(url.searchParams.get('approvalCode'));
            }
            if ((url.searchParams.get('response') || '').startsWith('error=')) {
                interactionWindow.removeListener('closed', onclosed);
                interactionWindow.close();
                return reject(url.searchParams.get('response'));
            }
        });
    });
};

app.on('window-all-closed', () => {
    app.quit();
});
