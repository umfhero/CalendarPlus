import '@testing-library/jest-dom';

// Mock window.ipcRenderer for tests
const mockStorage: Record<string, string> = {};

Object.defineProperty(window, 'ipcRenderer', {
    value: {
        invoke: async (channel: string, ...args: unknown[]) => {
            if (channel === 'save-global-setting') {
                const [key, value] = args as [string, string];
                mockStorage[key] = value;
                return true;
            }
            if (channel === 'get-global-setting') {
                const [key] = args as [string];
                return mockStorage[key] ?? null;
            }
            return null;
        },
    },
    writable: true,
});

// Helper to reset mock storage between tests
export function resetMockStorage() {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
}

// Helper to get mock storage for assertions
export function getMockStorage() {
    return { ...mockStorage };
}

// Helper to set mock storage for test setup
export function setMockStorage(key: string, value: string) {
    mockStorage[key] = value;
}
