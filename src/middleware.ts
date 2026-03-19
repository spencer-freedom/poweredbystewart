import { clerkMiddleware } from "@clerk/nextjs/server";

// Let Clerk set up session cookies but don't block any routes server-side.
// Auth protection is handled client-side in the dashboard layout.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
