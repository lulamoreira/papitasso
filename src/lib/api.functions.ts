import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*, favorite_team:teams(*)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }: any) => {
    const validated = z.object({
      name: z.string().min(1).optional(),
      favorite_team_id: z.string().uuid().optional(),
      avatar_url: z.string().url().optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(validated)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const getTeams = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("teams")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  });

export const getNextMatch = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .gte("kickoff_at", new Date().toISOString())
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  });

export const createPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }: any) => {
    const validated = z.object({
      name: z.string().min(3),
      type: z.enum(['simple', 'advanced']),
      scope_type: z.string(),
      scope_config: z.any().optional(),
      scoring_config: z.any(),
      modes_enabled: z.array(z.string()).optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .insert({
        name: validated.name,
        type: validated.type,
        scope_type: validated.scope_type,
        scope_config: validated.scope_config,
        scoring_config: validated.scoring_config,
        modes_enabled: validated.modes_enabled,
        invite_code,
        owner_id: userId
      })
      .select()
      .single();

    if (poolError) throw poolError;

    const { error: memberError } = await supabase
      .from("pool_members")
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) throw memberError;

    return pool;
  });

export const getMyPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pool_members")
      .select("pool_id, pools(*)")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data.map((item: any) => item.pools);
  });

export const getPoolById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: id, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("pools")
      .select("*, owner:profiles(*)")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  });

export const getPoolByInviteCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: code, context }: any) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pools")
      .select("*, owner:profiles(*)")
      .eq("invite_code", code.toUpperCase())
      .single();
    
    if (error) throw error;
    return data;
  });

export const joinPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: code, context }: any) => {
    const { supabase, userId } = context;
    
    // First find pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single();
    
    if (poolError) throw poolError;

    const { error: memberError } = await supabase
      .from("pool_members")
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'member'
      });
    
    if (memberError) {
      if (memberError.code === '23505') return { pool_id: pool.id }; // Already a member
      throw memberError;
    }
    
    return { pool_id: pool.id };
  });
