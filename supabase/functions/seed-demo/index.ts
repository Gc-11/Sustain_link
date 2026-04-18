import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoUser { email: string; name: string; role: "manufacturer" | "supplier" | "expert" | "admin"; }

const DEMO_USERS: DemoUser[] = [
  { email: "manufacturer@demo.sustainlink.app", name: "Mira Manufacturer", role: "manufacturer" },
  { email: "supplier@demo.sustainlink.app", name: "Sven Supplier", role: "supplier" },
  { email: "expert@demo.sustainlink.app", name: "Dr. Eli Expert", role: "expert" },
  { email: "admin@demo.sustainlink.app", name: "Ada Admin", role: "admin" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const log: string[] = [];
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const userIds: Record<string, string> = {};

    for (const u of DEMO_USERS) {
      // Try to create; if exists, fetch existing
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: "demo1234!",
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      let id = created?.user?.id;
      if (error && !id) {
        // user likely exists - find them
        const { data: list } = await supabase.auth.admin.listUsers();
        id = list.users.find((x) => x.email === u.email)?.id;
      }
      if (!id) { log.push(`Failed: ${u.email}`); continue; }
      userIds[u.role] = id;
      log.push(`✓ user ${u.email}`);

      // ensure role row
      await supabase.from("user_roles").upsert({ user_id: id, role: u.role }, { onConflict: "user_id,role" });
      // ensure profile
      await supabase.from("profiles").upsert({ id, full_name: u.name });
    }

    // Supplier company
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", userIds.supplier)
      .maybeSingle();

    let supplierId = existingSupplier?.id;
    if (!supplierId) {
      const { data: sup } = await supabase
        .from("suppliers")
        .insert({
          user_id: userIds.supplier,
          company_name: "NordicGreen Metals",
          description: "Closed-loop aluminum & steel from renewable-powered Nordic mills.",
          country: "Sweden",
          website: "https://nordicgreen.example",
        })
        .select("id")
        .single();
      supplierId = sup?.id;
      log.push("✓ supplier company");
    }

    // Sample products
    const sampleProducts = [
      {
        name: "Recycled Aluminum Sheet 2mm",
        description: "100% post-consumer recycled aluminum, smelted with hydroelectric power.",
        materials: ["Recycled Aluminum", "Hydropower"],
        sustainability_claims: "98% lower CO2 vs virgin aluminum. Cradle-to-gate verified.",
        category: "Metals",
      },
      {
        name: "Bio-PET Resin Pellets",
        description: "Plant-derived PET pellets from sugarcane ethanol — drop-in replacement.",
        materials: ["Bio-PET", "Sugarcane"],
        sustainability_claims: "Carbon-negative feedstock. ISCC PLUS certified.",
        category: "Polymers",
      },
      {
        name: "Hempcrete Insulation Block",
        description: "Carbon-sequestering hemp + lime composite for low-energy construction.",
        materials: ["Hemp Hurd", "Lime Binder"],
        sustainability_claims: "Stores 130 kg CO2 per m³ over its lifecycle.",
        category: "Construction",
      },
    ];

    for (const p of sampleProducts) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("supplier_id", supplierId)
        .eq("name", p.name)
        .maybeSingle();

      let pid = existing?.id;
      if (!pid) {
        const { data: prod } = await supabase
          .from("products")
          .insert({ ...p, supplier_id: supplierId })
          .select("id")
          .single();
        pid = prod?.id;
        log.push(`✓ product ${p.name}`);

        // Add a certification
        await supabase.from("certifications").insert({
          product_id: pid,
          name: "ISO 14001 Environmental",
          issuer: "Bureau Veritas",
        });

        // Add an expert review (approval)
        await supabase.from("expert_reviews").insert({
          product_id: pid,
          expert_id: userIds.expert,
          status: "approved",
          comments: "Documentation verified. Claims match certification scope.",
        });
      }
    }

    // Manufacturer saves a supplier
    if (supplierId) {
      await supabase.from("saved_suppliers").upsert(
        { user_id: userIds.manufacturer, supplier_id: supplierId },
        { onConflict: "user_id,supplier_id" }
      );
    }

    log.push("✅ Seed complete");
    return new Response(JSON.stringify({ log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.push("ERROR: " + (e as Error).message);
    return new Response(JSON.stringify({ log, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
