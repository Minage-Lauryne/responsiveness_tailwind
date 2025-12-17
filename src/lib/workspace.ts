/**
 * Workspace utilities for handling personal and organization workspaces
 */

export type WorkspaceType = "personal" | "organization";

export interface WorkspaceContext {
  type: WorkspaceType;
  organizationId: string | null;
  userId: string;
}

/**
 * Determines if the current context is a personal workspace
 * @param organizationId - The active organization ID from session
 * @returns true if in personal workspace (organizationId is null/undefined)
 */
export function isPersonalWorkspace(
  organizationId: string | null | undefined,
): boolean {
  return !organizationId;
}

/**
 * Gets the workspace context based on session data
 * @param userId - The current user's ID
 * @param organizationId - The active organization ID from session
 * @returns WorkspaceContext object
 */
export function getWorkspaceContext(
  userId: string,
  organizationId: string | null | undefined,
): WorkspaceContext {
  return {
    type: isPersonalWorkspace(organizationId) ? "personal" : "organization",
    organizationId: organizationId || null,
    userId,
  };
}

/**
 * Creates a where clause for querying user's data in the current workspace
 * For personal workspace: userId matches and organizationId is null
 * For organization workspace: organizationId matches
 * @param context - The workspace context
 */
export function getWorkspaceWhereClause(context: WorkspaceContext) {
  if (context.type === "personal") {
    return {
      userId: context.userId,
      organizationId: null,
    };
  }
  
  return {
    organizationId: context.organizationId,
  };
}

/**
 * Creates a where clause for creating data in the current workspace
 * @param context - The workspace context
 */
export function getWorkspaceDataClause(context: WorkspaceContext) {
  if (context.type === "personal") {
    return {
      userId: context.userId,
      organizationId: null,
    };
  }
  
  return {
    organizationId: context.organizationId!,
  };
}

/**
 * Validates that a user has access to a resource in the current workspace
 * @param resource - The resource with userId and organizationId
 * @param context - The workspace context
 * @throws Error if user doesn't have access
 */
export function validateWorkspaceAccess(
  resource: { userId?: string; organizationId?: string | null },
  context: WorkspaceContext,
): void {
  if (context.type === "personal") {
    if (resource.userId !== context.userId || resource.organizationId !== null) {
      throw new Error("Access denied: Resource does not belong to your personal workspace");
    }
  } else {
    if (resource.organizationId !== context.organizationId) {
      throw new Error("Access denied: Resource does not belong to this organization");
    }
  }
}

/**
 * Gets a display name for the current workspace
 * @param context - The workspace context
 * @param organizationName - Optional organization name for display
 */
export function getWorkspaceDisplayName(
  context: WorkspaceContext,
  organizationName?: string,
): string {
  if (context.type === "personal") {
    return "Personal Workspace";
  }
  return organizationName || "Organization Workspace";
}

/**
 * Constants for personal workspace
 */
export const PERSONAL_WORKSPACE_ID = null;
export const PERSONAL_WORKSPACE_LABEL = "Personal";
