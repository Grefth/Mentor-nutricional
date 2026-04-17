const HEALTH_API_PUBLIC_ORIGIN =
    'https://health-api-theta.vercel.app';

/** En desarrollo usa el proxy de Vite (mismo origen → sin CORS). En build, la URL pública. */
export function healthApiUrl(path: string): string {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    const apiPath = `/api${suffix}`;
    if (import.meta.env.DEV) {
        return `/api-health${apiPath}`;
    }
    return `${HEALTH_API_PUBLIC_ORIGIN}${apiPath}`;
}
