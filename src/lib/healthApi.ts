const HEALTH_API_PUBLIC_ORIGIN =
    'https://health-dip521ip3-grefth23-gmailcoms-projects.vercel.app';

/** En desarrollo usa el proxy de Vite (mismo origen → sin CORS). En build, la URL pública. */
export function healthApiUrl(path: string): string {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    if (import.meta.env.DEV) {
        return `/api-health${suffix}`;
    }
    return `${HEALTH_API_PUBLIC_ORIGIN}${suffix}`;
}
