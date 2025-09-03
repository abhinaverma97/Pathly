// Type definitions for requestIdleCallback
// This polyfills the global requestIdleCallback and cancelIdleCallback APIs

interface Window {
    requestIdleCallback: (
        callback: (deadline: IdleDeadline) => void,
        options?: IdleRequestOptions
    ) => number;

    cancelIdleCallback: (handle: number) => void;
}

interface IdleDeadline {
    didTimeout: boolean;
    timeRemaining: () => number;
}

interface IdleRequestOptions {
    timeout?: number;
}
