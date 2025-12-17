import { db } from "@/server/db";
import crypto from "crypto";

/**
 * Find a user by any of their linked emails (primary or linked)
 */
export async function findUserByAnyEmail(email: string) {
  const userByPrimaryEmail = await db.user.findUnique({
    where: { email },
  });

  if (userByPrimaryEmail) {
    return userByPrimaryEmail;
  }

  const userEmail = await db.userEmail.findUnique({
    where: { email },
    include: { user: true },
  });

  return userEmail?.user ?? null;
}

/**
 * Check if an email is already linked to a user
 */
export async function isEmailLinkedToUser(
  email: string,
  userId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Check if it's the user's primary email
  if (user?.email === email) {
    return true;
  }

  // Check if it's in their linked emails
  const linkedEmail = await db.userEmail.findFirst({
    where: {
      email,
      userId,
    },
  });

  return !!linkedEmail;
}

/**
 * Check if an email is linked to ANY user (for preventing duplicates)
 */
export async function isEmailLinkedToAnyUser(email: string): Promise<boolean> {
  const user = await findUserByAnyEmail(email);
  return !!user;
}

/**
 * Link a new email to a user account
 */
export async function linkEmailToUser(
  email: string,
  userId: string,
  verified: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  try {
    const alreadyLinked = await isEmailLinkedToUser(email, userId);
    if (alreadyLinked) {
      return { success: false, error: "Email is already linked to your account" };
    }

    const linkedToAnother = await isEmailLinkedToAnyUser(email);
    if (linkedToAnother) {
      return {
        success: false,
        error: "This email is already linked to another account",
      };
    }

    await db.userEmail.create({
      data: {
        userId,
        email,
        verified,
        isPrimary: false, 
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error linking email:", error);
    return { success: false, error: "Failed to link email" };
  }
}

/**
 * Generate a verification code for email linking
 * Returns a 6-digit code
 */
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create an email link verification code
 * Stores in the Verification table with 10-minute expiration
 */
export async function createEmailLinkVerification(
  email: string,
): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store verification code in database
  await db.verification.create({
    data: {
      identifier: `email-link:${email}`,
      value: code,
      expiresAt,
    },
  });

  return code;
}

/**
 * Verify an email link code
 */
export async function verifyEmailLinkCode(
  email: string,
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const verification = await db.verification.findFirst({
      where: {
        identifier: `email-link:${email}`,
        value: code,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return { valid: false, error: "Invalid or expired verification code" };
    }

    await db.verification.delete({
      where: { id: verification.id },
    });

    return { valid: true };
  } catch (error) {
    console.error("Error verifying code:", error);
    return { valid: false, error: "Failed to verify code" };
  }
}


export async function getUserEmails(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emails: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  const emails = [];

  if (user.email) {
    emails.push({
      email: user.email,
      isPrimary: true,
      verified: true,
      createdAt: new Date(),
    });
  }

  emails.push(
    ...user.emails.map((e) => ({
      email: e.email,
      isPrimary: e.isPrimary,
      verified: e.verified,
      createdAt: e.createdAt,
    })),
  );

  return emails;
}

/**
 * Set the primary email for a user
 * This updates the user.email field
 */
export async function setPrimaryEmail(
  userId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const isLinked = await isEmailLinkedToUser(email, userId);
    if (!isLinked) {
      return { success: false, error: "Email is not linked to your account" };
    }

    await db.user.update({
      where: { id: userId },
      data: { email },
    });

    await db.$transaction([
      db.userEmail.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      db.userEmail.updateMany({
        where: { userId, email },
        data: { isPrimary: true },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error setting primary email:", error);
    return { success: false, error: "Failed to set primary email" };
  }
}
