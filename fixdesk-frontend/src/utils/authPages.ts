export const AUTH_PAGES = [
    '/login',
    '/auth/register/external',
    '/auth/register/internal',
    '/auth/register/invite',
    '/send-invite',
    '/forgot-password',
    '/reset-password',
    '/auth/oauth-success'
];

export const isAuthPage = (pathname: string): boolean => {
    return AUTH_PAGES.includes(pathname);
};

export const shouldShowLayout = (pathname: string): boolean => {
    return !isAuthPage(pathname);
}; 