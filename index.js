const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isWin = process.platform === 'win32';

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: isDev ? 1000 : 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Show devtools automatically if in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// About Window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        width: 300,
        height: 300,
        title: 'About Electron',
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// When the app is ready, create the window
app.on('ready', () => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Remove variable from memory
    mainWindow.on('closed', () => (mainWindow = null));
});

// Menu template
const menu = [
    ...(isWin
        ? [
            {
                label: app.name,
                submenu: [
                    {
                        label: 'About',
                        click: createAboutWindow,
                    },
                ],
            },
        ]
        : []),
    {
        role: 'fileMenu',
    },
    ...(!isWin
        ? [
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About',
                        click: createAboutWindow,
                    },
                ],
            },
        ]
        : []),
    ...(isDev
        ? [
            {
                label: 'Developer',
                submenu: [
                    { role: 'reload' },
                    { role: 'forcereload' },
                    { type: 'separator' },
                    { role: 'toggledevtools' },
                ],
            },
        ]
        : []),
];
ipcMain.on('image:resize', (e, options) => {
    // console.log(options);
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImage(options);
});
async function resizeImage({ imgPath, height, width, dest }) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height,
        });
        const filename = path.basename(imgPath);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.writeFileSync(path.join(dest, filename), newPath);
        mainWindow.webContents.send('image:done');

        shell.openPath(dest);
    } catch (err) {
        console.log(err);
    }
}

app.on('window-all-closed', () => {
    if (!isWin) app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
