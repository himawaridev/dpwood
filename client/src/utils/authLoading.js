const MIN_AUTH_LOADING_MS = 500;

export const waitForAuthLoading = async (startedAt) => {
    const remaining = MIN_AUTH_LOADING_MS - (Date.now() - startedAt);
    if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }
};
