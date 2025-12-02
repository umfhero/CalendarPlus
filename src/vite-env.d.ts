/// <reference types="vite/client" />

interface Window {
    ipcRenderer: {
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.ico' {
    const value: string;
    export default value;
}

declare module '*.csv?raw' {
    const value: string;
    export default value;
}

declare module '*.csv' {
    const value: string;
    export default value;
}
