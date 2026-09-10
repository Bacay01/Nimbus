export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/transfer/:path*", "/transactions/:path*"],
};