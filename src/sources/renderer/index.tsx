/**
 * React app entry point with FluentProvider and theme setup
 * Main entry point for the Support Pilot renderer process
 */

import React from "react";
import { createRoot } from "react-dom/client";
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    Theme,
} from "@fluentui/react-components";
import { useAppStyles } from "./index.styles";

// Theme configuration for Support Pilot
const supportPilotTheme: Theme = {
    ...webLightTheme,
    colorBrandBackground: "#0078d4",
    colorBrandForeground1: "#0078d4",
    colorBrandForeground2: "#106ebe",
};

// Temporary App component until App.tsx is implemented in task 3.4
const SupportPilotApp: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [count, setCount] = React.useState(0);
    const styles = useAppStyles();

    const currentTheme = isDarkMode ? webDarkTheme : supportPilotTheme;

    return (
        <FluentProvider theme={currentTheme}>
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Support Pilot - Fluent UI Ready ✅
                </h1>
                <p className={styles.description}>
                    FluentProvider is configured with custom theme. Hot reload is working!
                </p>
                <div className={styles.buttonContainer}>
                    <button
                        onClick={() => setCount(count + 1)}
                        className={styles.primaryButton}
                    >
                        Count: {count}
                    </button>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={styles.secondaryButton}
                    >
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                </div>
                <p className={styles.statusText}>
                    FluentProvider theme: {isDarkMode ? "Dark" : "Light"} • Theme tokens are working!
                </p>
            </div>
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
