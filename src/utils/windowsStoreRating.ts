/**
 * Windows Store Native Rating API
 * 
 * IMPORTANT: This code is non-functional because NodeRT is abandoned (last update 2018).
 * NodeRT does not work with Node.js 24+ or modern build tools.
 * 
 * This file remains as reference code showing how the native dialog WOULD work
 * if NodeRT were available. In practice, the custom UI is always used.
 * 
 * The native Windows Store rating dialog (RequestRateAndReviewAppAsync) requires
 * Windows Runtime (WinRT) bindings for Node.js, which were provided by NodeRT.
 * Since NodeRT is abandoned and incompatible with modern Node.js, there is no
 * way to access WinRT APIs from Electron.
 * 
 * See docs/ENABLE_NATIVE_RATING.md for full technical details.
 * 
 * Current behavior: Always returns null, triggering fallback to custom UI.
 */

export interface RatingResult {
    success: boolean;
    usedNativeDialog: boolean;
    status?: 'succeeded' | 'canceled' | 'networkError' | 'error';
    error?: string;
}

/**
 * Attempt to show the native Windows Store rating dialog
 * Returns null if WinRT APIs are not available (fallback to custom UI)
 */
export async function showNativeStoreRating(): Promise<RatingResult | null> {
    try {
        // Check if we're running as an APPX package (Windows Store)
        // @ts-ignore
        const isWindowsStore = process.windowsStore || false;

        if (!isWindowsStore) {
            console.log('[Rating] Not running as Windows Store app, using custom UI');
            return null;
        }

        // Try to load NodeRT bindings for Windows.Services.Store
        // This will only work if the app is packaged as APPX and NodeRT is available
        let StoreContext: any;
        try {
            // Dynamic require to avoid bundling issues
            const windowsServicesStore = require('windows.services.store');
            StoreContext = windowsServicesStore.StoreContext;
        } catch (requireError) {
            console.log('[Rating] NodeRT not available, using custom UI');
            return null;
        }

        if (!StoreContext) {
            console.log('[Rating] StoreContext not available, using custom UI');
            return null;
        }

        console.log('[Rating] Attempting to show native Windows Store rating dialog...');

        // Get the StoreContext for the current app
        const storeContext = StoreContext.getDefault();

        // Request the rating and review dialog
        // This shows the official Windows Store UI
        const result = await new Promise((resolve, reject) => {
            storeContext.requestRateAndReviewAppAsync((error: any, storeResult: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(storeResult);
                }
            });
        });

        // Parse the result
        const storeResult = result as any;

        console.log('[Rating] Native dialog result:', {
            status: storeResult.status,
            extendedError: storeResult.extendedError,
            updatedExisting: storeResult.updatedExistingRatingOrReview
        });

        // Map WinRT status to our result format
        let status: 'succeeded' | 'canceled' | 'networkError' | 'error';

        switch (storeResult.status) {
            case 0: // StoreRateAndReviewStatus.Succeeded
                status = 'succeeded';
                break;
            case 1: // StoreRateAndReviewStatus.CanceledByUser
                status = 'canceled';
                break;
            case 2: // StoreRateAndReviewStatus.NetworkError
                status = 'networkError';
                break;
            default: // StoreRateAndReviewStatus.Error or unknown
                status = 'error';
                break;
        }

        return {
            success: status === 'succeeded',
            usedNativeDialog: true,
            status
        };

    } catch (error: any) {
        console.error('[Rating] Error showing native dialog:', error);

        // If there's an error, fall back to custom UI
        return null;
    }
}

/**
 * Check if native Windows Store rating is available
 */
export function isNativeRatingAvailable(): boolean {
    try {
        // @ts-ignore
        const isWindowsStore = process.windowsStore || false;

        if (!isWindowsStore) {
            return false;
        }

        // Try to load NodeRT
        try {
            require('windows.services.store');
            return true;
        } catch {
            return false;
        }
    } catch {
        return false;
    }
}
