import { cookies } from "next/headers";
import { authClient } from "./auth-client"; 

export async function getSessionToken(): Promise<string | null> {
  try {
    const session = await authClient.getSession();    
    if (session?.data?.session) {
      return session.data.session.token;
    }
    return null;
  } catch (error) {
    return null;
  }
}


export async function getBetterAuthSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();     
    
    const possibleCookieNames = [
      "__Secure-better-auth.session_token", 
      "better-auth.session_token",
      "auth_session",
      "session_token"
    ];
    
    for (const cookieName of possibleCookieNames) {
      const token = cookieStore.get(cookieName);
      if (token) {
        return token.value;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}