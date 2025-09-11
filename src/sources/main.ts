import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { isDev } from './utils/environment';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with proper configuration
 */
function createMainWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready-to-show
    icon: path.join(__dirname, '../assets/icon.png'), // App icon
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      sandbox: false, // Allow access to Node.js APIs in preload
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Security: block insecure content
    },
  });

  // Load the application
  if (isDev()) {
    // Development: load from webpack dev server
    mainWindow.loadURL('http://localhost:9000');
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Focus on window when shown
      if (isDev()) {
        mainWindow.focus();
      }
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle unresponsive window
  mainWindow.on('unresponsive', () => {
    console.warn('Main window became unresponsive');
  });

  // Handle window restored from unresponsive state
  mainWindow.on('responsive', () => {
    console.log('Main window became responsive again');
  });
}

/**
 * Creates and sets up the application menu
 */
function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Send IPC message to renderer to start new session
            if (mainWindow) {
              mainWindow.webContents.send('menu:new-session');
            }
          },
        },
        {
          label: 'Open Files...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow) {
              const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openFile', 'multiSelections'],
                filters: [
                  { name: 'Log Files', extensions: ['log', 'txt'] },
                  { name: 'Email Files', extensions: ['msg', 'eml'] },
                  { name: 'All Files', extensions: ['*'] },
                ],
              });

              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('menu:files-selected', result.filePaths);
              }
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });

    // Window menu for macOS
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Sets up IPC handlers for communication with renderer process
 */
function setupIpcHandlers(): void {
  // Handle app version request
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  // Handle app name request
  ipcMain.handle('app:get-name', () => {
    return app.getName();
  });

  // Handle file dialog requests
  ipcMain.handle('dialog:open-file', async () => {
    if (mainWindow) {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Log Files', extensions: ['log', 'txt'] },
          { name: 'Email Files', extensions: ['msg', 'eml'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      return result;
    }
    return { canceled: true, filePaths: [] };
  });

  // Handle window control requests
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // Handle external link opening
  ipcMain.handle('shell:open-external', async (_, url: string) => {
    await shell.openExternal(url);
  });
}

// App event handlers

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  
  createMainWindow();
  createApplicationMenu();
  setupIpcHandlers();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS: Handle app reactivation
app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Security: Prevent new window creation from renderer
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('Blocked new window creation:', url);
    shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    
    // Allow navigation within the app
    if (parsedUrl.origin !== 'http://localhost:9000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
      console.warn('Blocked navigation to:', url);
    }
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev()) {
    // In development, ignore certificate errors for localhost
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Handle app before quit event
app.on('before-quit', () => {
  console.log('Application is about to quit');
});

// Ensure single instance of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

// Export for testing
export { createMainWindow, createApplicationMenu, setupIpcHandlers };
