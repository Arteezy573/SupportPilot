import { app, BrowserWindow, Menu, dialog, shell } from "electron";
import * as path from "path";
import { isDev, logger } from "./utils";
import { setupIpcHandlers } from "./ipc/handlers";

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with proper configuration
 */
function createMainWindow(): void {
    // Create the browser window
    mainWindow = new BrowserWindow({
        // Window dimensions and constraints
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        maxWidth: 2560, // Reasonable maximum for ultrawide monitors
        maxHeight: 1440, // Reasonable maximum height

        // Window behavior and appearance
        show: false, // Don't show until ready-to-show to prevent visual flash
        center: true, // Center window on screen
        resizable: true, // Allow window resizing
        minimizable: true, // Allow window minimization
        maximizable: true, // Allow window maximization
        closable: true, // Allow window closing

        // Frame and title bar configuration
        frame: true, // Show window frame with native controls
        titleBarStyle: "default", // Use system default title bar
        title: "Support Pilot", // Application title
        icon: path.join(__dirname, "../assets/icon.png"), // App icon

        // Transparency and visual effects
        transparent: false, // Disable transparency for better performance
        opacity: 1.0, // Full opacity
        hasShadow: true, // Enable window shadow on macOS

        // Focus and visibility behavior
        alwaysOnTop: false, // Don't keep window always on top
        skipTaskbar: false, // Show in taskbar
        kiosk: false, // Disable kiosk mode
        fullscreen: false, // Start in windowed mode
        fullscreenable: true, // Allow fullscreen mode

        // Background and loading
        backgroundColor: "#ffffff", // White background while loading

        // Platform-specific optimizations
        ...(process.platform === "darwin" && {
            vibrancy: "content", // macOS vibrancy effect
            visualEffectState: "active", // macOS visual effect state
            titleBarOverlay: false, // Disable title bar overlay on macOS
        }),

        ...(process.platform === "win32" && {
            thickFrame: true, // Windows thick frame for better resize experience
        }),

        // Web security and isolation settings
        webPreferences: {
            // Security: Core isolation settings
            nodeIntegration: false, // Disable Node.js integration in renderer
            contextIsolation: true, // Enable context isolation for security
            sandbox: false, // Disable sandbox to allow preload script access

            // Security: Script and content policies
            webSecurity: true, // Enable web security
            allowRunningInsecureContent: false, // Block mixed content
            experimentalFeatures: false, // Disable experimental web features

            // Preload script for secure IPC bridge
            preload: path.join(__dirname, "preload.js"),

            // Additional security settings
            nodeIntegrationInWorker: false, // Disable Node.js in web workers
            nodeIntegrationInSubFrames: false, // Disable Node.js in subframes

            // Content and navigation restrictions
            navigateOnDragDrop: false, // Prevent navigation on drag and drop
            autoplayPolicy: "user-gesture-required", // Require user gesture for autoplay

            // Development and debugging
            devTools: isDev(), // Enable DevTools only in development

            // Performance optimizations
            backgroundThrottling: false, // Disable throttling for consistent performance
            offscreen: false, // Disable offscreen rendering

            // Image and media handling
            images: true, // Enable image loading
            webgl: true, // Enable WebGL for potential future features

            // Spell checking and language features
            spellcheck: true, // Enable spell checking in text inputs

            // Zoom and scaling
            zoomFactor: 1.0, // Default zoom level
        },
    });

    // Load the application
    if (isDev()) {
        // Development: load from webpack dev server
        mainWindow.loadURL("http://localhost:9000");

        // Open DevTools in development
        mainWindow.webContents.openDevTools();
    } else {
        // Production: load from built files
        mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }

    // Show window when ready to prevent visual flash
    mainWindow.once("ready-to-show", () => {
        if (mainWindow) {
            mainWindow.show();

            // Focus on window when shown
            if (isDev()) {
                mainWindow.focus();
            }
        }
    });

    // Handle window closed
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // Handle external links - open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    // Handle unresponsive window
    mainWindow.on("unresponsive", () => {
        console.warn("Main window became unresponsive");
    });

    // Handle window restored from unresponsive state
    mainWindow.on("responsive", () => {
        logger.info("Main window became responsive again");
    });
}

/**
 * Creates and sets up the application menu with Support Pilot specific options
 */
function createApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: "File",
            submenu: [
                {
                    label: "New Session",
                    accelerator: "CmdOrCtrl+N",
                    click: () => {
                        // Send IPC message to renderer to start new session
                        if (mainWindow) {
                            mainWindow.webContents.send("menu:new-session");
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "Open Files...",
                    accelerator: "CmdOrCtrl+O",
                    click: async () => {
                        if (mainWindow) {
                            const result = await dialog.showOpenDialog(mainWindow, {
                                properties: ["openFile", "multiSelections"],
                                filters: [
                                    { name: "Log Files", extensions: ["log", "txt"] },
                                    { name: "Email Files", extensions: ["msg", "eml"] },
                                    { name: "All Files", extensions: ["*"] },
                                ],
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                mainWindow.webContents.send("menu:files-selected", result.filePaths);
                            }
                        }
                    },
                },
                {
                    label: "Open Log Directory...",
                    accelerator: "CmdOrCtrl+Shift+O",
                    click: async () => {
                        if (mainWindow) {
                            const result = await dialog.showOpenDialog(mainWindow, {
                                properties: ["openDirectory"],
                                title: "Select Log Directory",
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                // Find all log files in the selected directory
                                const fs = await import("fs/promises");
                                const path = await import("path");
                                
                                try {
                                    const dirPath = result.filePaths[0];
                                    const files = await fs.readdir(dirPath);
                                    const logFiles = files
                                        .filter(file => /\.(log|txt)$/i.test(file))
                                        .map(file => path.join(dirPath, file));
                                    
                                    if (logFiles.length > 0) {
                                        mainWindow.webContents.send("menu:files-selected", logFiles);
                                    } else {
                                        // Show info that no log files were found
                                        dialog.showMessageBox(mainWindow, {
                                            type: "info",
                                            title: "No Log Files Found",
                                            message: "No log files (.log, .txt) were found in the selected directory.",
                                            buttons: ["OK"],
                                        });
                                    }
                                } catch (error) {
                                    logger.error("Failed to read log directory:", error);
                                    dialog.showErrorBox("Error", "Failed to read the selected directory.");
                                }
                            }
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "Export Analysis...",
                    accelerator: "CmdOrCtrl+E",
                    enabled: false, // Will be enabled when there's content to export
                    click: () => {
                        // Send IPC message to renderer to export current analysis
                        if (mainWindow) {
                            mainWindow.webContents.send("menu:export-analysis");
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "Exit",
                    accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: "Edit",
            submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                {
                    label: "Focus Message Input",
                    accelerator: "CmdOrCtrl+K",
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send("menu:focus-input");
                        }
                    },
                },
                {
                    label: "Clear Chat History",
                    accelerator: "CmdOrCtrl+Shift+Delete",
                    click: () => {
                        if (mainWindow) {
                            dialog.showMessageBox(mainWindow, {
                                type: "warning",
                                title: "Clear Chat History",
                                message: "Are you sure you want to clear all chat history? This action cannot be undone.",
                                buttons: ["Cancel", "Clear History"],
                                defaultId: 0,
                                cancelId: 0,
                            }).then((result) => {
                                if (result.response === 1 && mainWindow) {
                                    mainWindow.webContents.send("menu:clear-history");
                                }
                            });
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "Theme",
                    submenu: [
                        {
                            label: "Light Theme",
                            type: "radio",
                            checked: true, // Default to light theme
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send("menu:theme-change", "light");
                                }
                            },
                        },
                        {
                            label: "Dark Theme",
                            type: "radio",
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send("menu:theme-change", "dark");
                                }
                            },
                        },
                        {
                            label: "System Theme",
                            type: "radio",
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send("menu:theme-change", "system");
                                }
                            },
                        },
                    ],
                },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        {
            label: "Window",
            submenu: [{ role: "minimize" }, { role: "close" }],
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "About Support Pilot",
                    click: () => {
                        if (mainWindow) {
                            dialog.showMessageBox(mainWindow, {
                                type: "info",
                                title: "About Support Pilot",
                                message: "Support Pilot",
                                detail: `Version: ${app.getVersion()}\n\nDesktop application for support engineers to analyze logs, emails, and create structured livesite tickets using AI assistance.\n\nBuilt with Electron, React, and TypeScript.`,
                                buttons: ["OK"],
                            });
                        }
                    },
                },
                { type: "separator" },
                {
                    label: "Keyboard Shortcuts",
                    accelerator: "CmdOrCtrl+?",
                    click: () => {
                        if (mainWindow) {
                            const shortcuts = [
                                "Ctrl+N (Cmd+N) - New Session",
                                "Ctrl+O (Cmd+O) - Open Files",
                                "Ctrl+Shift+O (Cmd+Shift+O) - Open Log Directory",
                                "Ctrl+E (Cmd+E) - Export Analysis",
                                "Ctrl+K (Cmd+K) - Focus Message Input",
                                "Ctrl+Shift+Delete (Cmd+Shift+Delete) - Clear Chat History",
                                "Ctrl+R (Cmd+R) - Reload",
                                "F12 - Toggle Developer Tools",
                                "F11 - Toggle Fullscreen",
                            ].join("\n");

                            dialog.showMessageBox(mainWindow, {
                                type: "info",
                                title: "Keyboard Shortcuts",
                                message: "Support Pilot Keyboard Shortcuts",
                                detail: shortcuts,
                                buttons: ["OK"],
                            });
                        }
                    },
                },
                {
                    label: "User Guide",
                    click: async () => {
                        // Open user guide in external browser
                        await shell.openExternal("https://docs.microsoft.com/support-pilot"); // Placeholder URL
                    },
                },
                {
                    label: "Report Issue",
                    click: async () => {
                        // Open issue reporting page in external browser
                        await shell.openExternal("https://github.com/microsoft/support-pilot/issues"); // Placeholder URL
                    },
                },
                { type: "separator" },
                {
                    label: "Developer Tools",
                    accelerator: "F12",
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    },
                },
            ],
        },
    ];

    // macOS specific menu adjustments
    if (process.platform === "darwin") {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
            ],
        });

        // Window menu for macOS (now at index 5 due to Help menu)
        template[5].submenu = [{ role: "close" }, { role: "minimize" }, { role: "zoom" }, { type: "separator" }, { role: "front" }];
        
        // Move About to app menu on macOS and remove from Help menu
        const helpMenu = template[6].submenu as Electron.MenuItemConstructorOptions[];
        helpMenu.shift(); // Remove "About Support Pilot"
        if (helpMenu[0]?.type === "separator") {
            helpMenu.shift(); // Remove separator after About
        }
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    logger.info("Electron app is ready");

    createMainWindow();
    createApplicationMenu();
    setupIpcHandlers(mainWindow);

    // macOS: Re-create window when dock icon is clicked
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// macOS: Handle app reactivation
app.on("activate", () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

// Security: Prevent new window creation from renderer
app.on("web-contents-created", (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        console.warn("Blocked new window creation:", url);
        shell.openExternal(url);
        return { action: "deny" };
    });

    contents.on("will-navigate", (event, url) => {
        const parsedUrl = new URL(url);

        // Allow navigation within the app
        if (parsedUrl.origin !== "http://localhost:9000" && parsedUrl.origin !== "file://") {
            event.preventDefault();
            console.warn("Blocked navigation to:", url);
        }
    });
});

// Handle certificate errors
app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
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
app.on("before-quit", () => {
    logger.info("Application is about to quit");
});

// Ensure single instance of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
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
export { createMainWindow, createApplicationMenu };
