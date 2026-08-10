import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Returns the authenticated user's id, or null. Every API route MUST use
// this to scope database queries — never trust a userId sent from the client.
export async function getAuthUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}
