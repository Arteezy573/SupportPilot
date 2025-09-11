/**
 * React app entry point with FluentProvider and theme setup
 * Main entry point for the Support Pilot renderer process
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { useAppStyles } from "./index.styles";
import { 
    getTheme, 
    useThemeDetection, 
    ThemeMode 
} from "./styles/theme";

// Temporary App component until App.tsx is implemented in task 3.4
const SupportPilotApp: React.FC = () => {
    const [themeMode, setThemeMode] = React.useState<ThemeMode>("light");
    const [count, setCount] = React.useState(0);
    const styles = useAppStyles();
    const systemPrefersDark = useThemeDetection();

    // Get current theme configuration
    const themeConfig = getTheme(themeMode, systemPrefersDark);

    const toggleTheme = () => {
        setThemeMode(prevMode => {
            switch (prevMode) {
                case "light":
                    return "dark";
                case "dark":
                    return "teams-light";
                case "teams-light":
                    return "teams-dark";
                case "teams-dark":
                    return "auto";
                case "auto":
                default:
                    return "light";
            }
        });
    };

    const getThemeDisplayName = (mode: ThemeMode): string => {
        switch (mode) {
            case "light":
                return "Light";
            case "dark":
                return "Dark";
            case "teams-light":
                return "Teams Light";
            case "teams-dark":
                return "Teams Dark";
            case "auto":
                return `Auto (${systemPrefersDark ? "Dark" : "Light"})`;
            default:
                return "Unknown";
        }
    };

    return (
        <FluentProvider theme={themeConfig.theme}>
            <div className={styles.container}>
                <h1 className={styles.title}>Support Pilot - Fluent UI Ready ✅</h1>
                <p className={styles.description}>FluentProvider is configured with custom theme. Live development mode enabled!</p>
                <div className={styles.buttonContainer}>
                    <button onClick={() => setCount(count + 1)} className={styles.primaryButton}>
                        Count: {count}
                    </button>
                    <button onClick={toggleTheme} className={styles.secondaryButton}>
                        Theme: {getThemeDisplayName(themeMode)}
                    </button>
                </div>
                <p className={styles.statusText}>
                    Current theme: {getThemeDisplayName(themeMode)} • Theme tokens are working! • System prefers: {systemPrefersDark ? "Dark" : "Light"}
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
