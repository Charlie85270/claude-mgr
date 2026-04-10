// build/lib/schemas.ts
import { z } from "zod";

export const ThemeYamlSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  hierarchy_model: z.enum(["flat-peer", "council-with-subordinates", "command-chain", "ensemble"]),
  tags: z.array(z.string()).min(3),
  expansion: z
    .object({
      bundled_themes: z.array(z.string()).optional(),
    })
    .optional(),
  characters: z.array(z.string()).min(1),
});

export const ArchetypeYamlSchema = z.object({
  name: z.string(),
  display_name: z.string(),
  tier: z.enum(["medium", "large", "enterprise"]),
  canonical_source: z.string(),
  role_summary: z.string(),
  primary_responsibilities: z.array(z.string()),
  inputs: z.array(z.any()),
  outputs: z.array(z.any()),
  single_role: z.boolean(),
  secondary_roles_allowed: z.array(z.string()),
});

export const CapabilitiesYamlSchema = z.object({
  required_capabilities: z.array(z.string()),
  forbidden_capabilities: z.array(z.string()).optional(),
});

export const REQUIRED_CHARACTER_FILES = [
  "SOUL.md",
  "AGENTS.md",
  "HEARTBEAT.md",
  "MEMORY.seed.md",
] as const;
