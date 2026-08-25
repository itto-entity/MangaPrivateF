const BACKEND_CONFIG_URL =
    "https://raw.githubusercontent.com/itto-entity/MangawebFBackend/main/backend-url.json";

let API_URL = null;
let initPromise = null;
console.log(API_URL);
export function initApi() {
    if (API_URL) {
        return Promise.resolve(API_URL);
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const response = await fetch(
            `${BACKEND_CONFIG_URL}?t=${Date.now()}`,
            {
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch backend config: ${response.status}`
            );
        }

        const config = await response.json();

        if (typeof config.api_url !== "string" || !config.api_url.trim()) {
            throw new Error("Backend API URL is empty.");
        }

        const parsedUrl = new URL(config.api_url.trim());
        if (!/^https?:$/.test(parsedUrl.protocol)) {
            throw new Error("Backend API URL must use HTTP or HTTPS.");
        }

        API_URL = parsedUrl.href.replace(/\/+$/, "");

        console.log("Backend:", API_URL);
        return API_URL;
    })().catch((error) => {
        // Allow a later request to retry if the config endpoint was temporarily unavailable.
        initPromise = null;
        throw error;
    });

    return initPromise;
}

export function getApiUrl() {
    if (!API_URL) {
        throw new Error("API URL has not been initialized.");
    }

    return API_URL;
}

export async function apiFetch(path, options = {}) {
    await initApi();
    return fetch(`${getApiUrl()}${path}`, options);
}
