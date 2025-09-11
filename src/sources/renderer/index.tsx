/**
 * React app entry point with FluentProvider and theme setup
 * Main entry point for the Support Pilot renderer process
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { getTheme, useThemeDetection, ThemeMode } from "./styles/theme";
import { App } from "./App";

// Main app component with FluentProvider and theme management
const SupportPilotApp: React.FC = () => {
    const [themeMode] = React.useState<ThemeMode>("light");
    const systemPrefersDark = useThemeDetection();

    // Get current theme configuration
    const themeConfig = getTheme(themeMode, systemPrefersDark);

    return (
        <FluentProvider theme={themeConfig.theme}>
            <App />
        </FluentProvider>
    );
};

// Initialize React app with FluentProvider
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<SupportPilotApp />);
} else {
    throw new Error("Root element not found. Make sure the HTML template has a div with id='root'");
}
