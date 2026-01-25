// RLS Policy Types

export type PolicyCommand = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";

export interface RLSPolicy {
  policy_name: string;
  table_name: string;
  table_schema: string;
  command: PolicyCommand;
  is_permissive: boolean;
  roles: string[];
  using_expression: string | null;
  check_expression: string | null;
}

export interface TableWithRLS {
  table_name: string;
  table_schema: string;
  rls_enabled: boolean;
  policies: RLSPolicy[];
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  command: PolicyCommand;
  using_expression: string;
  check_expression: string | null;
  roles: string[];
  requires_user_id_column: boolean;
  icon: string;
}

export interface CreatePolicyRequest {
  table_name: string;
  policy_name: string;
  command: PolicyCommand;
  is_permissive: boolean;
  roles: string[];
  using_expression: string;
  check_expression: string | null;
}

export interface DeletePolicyRequest {
  table_name: string;
  policy_name: string;
}

export interface ToggleRLSRequest {
  table_name: string;
  enable: boolean;
}

// Policy templates with common patterns
export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "owner_only",
    name: "Owner Only",
    description: "Users can only access their own records (requires user_id column)",
    command: "ALL",
    using_expression: "auth.uid() = user_id",
    check_expression: "auth.uid() = user_id",
    roles: ["authenticated"],
    requires_user_id_column: true,
    icon: "user",
  },
  {
    id: "public_read",
    name: "Public Read",
    description: "Anyone can read, only owner can modify",
    command: "SELECT",
    using_expression: "true",
    check_expression: null,
    roles: ["public"],
    requires_user_id_column: false,
    icon: "eye",
  },
  {
    id: "authenticated_read",
    name: "Authenticated Read",
    description: "Only authenticated users can read",
    command: "SELECT",
    using_expression: "auth.role() = 'authenticated'",
    check_expression: null,
    roles: ["authenticated"],
    requires_user_id_column: false,
    icon: "lock",
  },
  {
    id: "admin_only",
    name: "Admin Only",
    description: "Only users with admin role can access",
    command: "ALL",
    using_expression: "auth.jwt() ->> 'role' = 'admin'",
    check_expression: "auth.jwt() ->> 'role' = 'admin'",
    roles: ["authenticated"],
    requires_user_id_column: false,
    icon: "shield",
  },
  {
    id: "owner_insert",
    name: "Owner Insert",
    description: "Users can insert records with their own user_id",
    command: "INSERT",
    using_expression: "true",
    check_expression: "auth.uid() = user_id",
    roles: ["authenticated"],
    requires_user_id_column: true,
    icon: "plus",
  },
  {
    id: "owner_update",
    name: "Owner Update",
    description: "Users can only update their own records",
    command: "UPDATE",
    using_expression: "auth.uid() = user_id",
    check_expression: "auth.uid() = user_id",
    roles: ["authenticated"],
    requires_user_id_column: true,
    icon: "pencil",
  },
  {
    id: "owner_delete",
    name: "Owner Delete",
    description: "Users can only delete their own records",
    command: "DELETE",
    using_expression: "auth.uid() = user_id",
    check_expression: null,
    roles: ["authenticated"],
    requires_user_id_column: true,
    icon: "trash",
  },
  {
    id: "service_role_only",
    name: "Service Role Only",
    description: "Only service role can access (backend only)",
    command: "ALL",
    using_expression: "auth.role() = 'service_role'",
    check_expression: "auth.role() = 'service_role'",
    roles: ["service_role"],
    requires_user_id_column: false,
    icon: "server",
  },
];

// Helper to get readable command description
export function getCommandDescription(command: PolicyCommand): string {
  const descriptions: Record<PolicyCommand, string> = {
    SELECT: "Read records",
    INSERT: "Create new records",
    UPDATE: "Modify existing records",
    DELETE: "Remove records",
    ALL: "All operations",
  };
  return descriptions[command];
}

// Helper to parse policy expression for display
export function parseExpression(expression: string | null): {
  readable: string;
  type: "auth" | "custom" | "none";
} {
  if (!expression) {
    return { readable: "No condition", type: "none" };
  }

  if (expression === "true") {
    return { readable: "Always allowed", type: "custom" };
  }

  if (expression === "false") {
    return { readable: "Always denied", type: "custom" };
  }

  if (expression.includes("auth.uid()") && expression.includes("user_id")) {
    return { readable: "Owner only (user_id matches)", type: "auth" };
  }

  if (expression.includes("auth.role()")) {
    const roleMatch = expression.match(/auth\.role\(\)\s*=\s*'(\w+)'/);
    if (roleMatch) {
      return { readable: `Role: ${roleMatch[1]}`, type: "auth" };
    }
  }

  if (expression.includes("auth.jwt()")) {
    return { readable: "JWT claim check", type: "auth" };
  }

  return { readable: expression, type: "custom" };
}
