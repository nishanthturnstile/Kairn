export function initializeNativeAuth(baseUrl: string): void;
export function nativeCookie(): Promise<string>;
export function nativeAuthRequest(path: string, body?: unknown): Promise<unknown>;
export function nativeStorageFailed(): boolean;
export function retryNativeStorage(): Promise<void>;
export function nativeOrigin(): string | undefined;

export function setNativeInvalidator(callback: (reason: "storage" | "session") => void): void;
