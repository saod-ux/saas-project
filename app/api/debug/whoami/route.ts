import { verifyIdToken } from "@/lib/firebase/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    let email = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(idToken);
        userId = decodedToken.uid;
        email = decodedToken.email;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    return Response.json({
      ok: true,
      firebase: { userId, email },
      platformAdmin: null, // TODO: Implement platform admin check
      envDev: process.env.NODE_ENV,
      devSuperAdminTarget: process.env.DEV_SUPER_ADMIN_EMAIL ?? null,
    });
  } catch (error) {
    console.error('Whoami error:', error);
    return Response.json({
      ok: false,
      error: 'Failed to get user info',
      firebase: { userId: null, email: null },
      platformAdmin: null,
      envDev: process.env.NODE_ENV,
      devSuperAdminTarget: process.env.DEV_SUPER_ADMIN_EMAIL ?? null,
    });
  }
}
