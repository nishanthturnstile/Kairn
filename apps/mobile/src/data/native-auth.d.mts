export function initializeNativeAuth(baseUrl: string): void;
export function nativeCookie(): Promise<string>;
export function nativeAuthRequest(path: string, body?: unknown): Promise<unknown>;
export function retryNativeStorage(): Promise<void>;
export function nativeOrigin(): string | undefined;

export function setNativeInvalidator(callback: () => void): void;
