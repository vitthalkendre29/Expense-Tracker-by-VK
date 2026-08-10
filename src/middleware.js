export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/expenses/:path*', '/calendar/:path*', '/analytics/:path*', '/settings/:path*'],
};
