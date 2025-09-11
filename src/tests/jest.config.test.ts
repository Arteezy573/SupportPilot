/**
 * Example test file to verify Jest configuration
 * This file demonstrates the testing setup and can be used as a template
 */

describe("Jest Configuration Test", () => {
    test("should run basic test", () => {
        expect(1 + 1).toBe(2);
    });

    test("should have access to Jest DOM matchers", () => {
        const element = document.createElement("div");
        element.textContent = "Hello World";
        document.body.appendChild(element);

        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent("Hello World");
    });

    test("should have Electron mocks available", () => {
        expect((window as any).electron).toBeDefined();
        expect((window as any).electron.ipcRenderer).toBeDefined();
        expect(typeof (window as any).electron.ipcRenderer.invoke).toBe("function");
    });

    test("should have File and FileReader mocks", () => {
        expect(File).toBeDefined();
        expect(FileReader).toBeDefined();

        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        expect(file.name).toBe("test.txt");
        expect(file.type).toBe("text/plain");
    });
});
