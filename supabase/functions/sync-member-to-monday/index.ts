import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_BOARD_ID = "5101164938";
const MONDAY_GROUP_ID = "topics";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function labelGender(value: string) {
  return ({ male: "גבר", female: "אישה", other: "אחר" } as Record<string, string>)[value] || value;
}

function labelRole(value: string) {
  return ({ fighter: "לוחם", support: 'תומכ"ל' } as Record<string, string>)[value] || value;
}

function inferPhoneCountry(phone: string, country: string) {
  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const normalizedCountry = country.trim().toLowerCase();
  const countryNames: Record<string, string> = {
    "ישראל": "IL",
    israel: "IL",
    "ארצות הברית": "US",
    "united states": "US",
    usa: "US",
    "בריטניה": "GB",
    "united kingdom": "GB",
    uk: "GB",
    "צרפת": "FR",
    france: "FR",
    "גרמניה": "DE",
    germany: "DE",
    "קנדה": "CA",
    canada: "CA",
  };

  if (countryNames[normalizedCountry]) return countryNames[normalizedCountry];
  if (normalizedPhone.startsWith("+1")) return "US";
  if (normalizedPhone.startsWith("+44")) return "GB";
  if (normalizedPhone.startsWith("+33")) return "FR";
  if (normalizedPhone.startsWith("+49")) return "DE";
  return "IL";
}

function buildColumnValues(profile: Record<string, unknown>) {
  const text = (key: string) => String(profile[key] || "");
  const values: Record<string, unknown> = {
    date4: { date: new Date().toISOString().slice(0, 10) },
    phone_mm5p5wtq: {
      phone: text("phone"),
      countryShortName: inferPhoneCountry(text("phone"), text("country")),
    },
    email_mm5pgdq2: {
      email: text("email"),
      text: text("email"),
    },
    text_mm5pa97s: labelGender(text("gender")),
    text_mm5p1dr: text("unit_join_year"),
    text_mm5p70n2: text("country"),
    text_mm5pax1j: text("address"),
    text_mm5p1g0n: text("city"),
    text_mm5p7ne2: text("zip"),
    text_mm5pc9p5: text("occupation"),
    text_mm5pz9dr: text("workplace_he"),
    text_mm5pt3e2: text("workplace_en"),
    text_mm5pfc7e: text("academic_institution"),
    text_mm5pgwsb: text("study_status"),
    text_mm5p9gpt: labelRole(text("role")),
    text_mm5p18e9: text("company"),
    text_mm5p6pxt: text("volunteer_area"),
    text_mm5p5kwz: text("volunteer_area_details"),
    text_mm5pkmkw: text("has_vehicle_details"),
    text_mm5py14a: text("event_business_details"),
    text_mm5p94je: text("artist_details"),
  };

  if (profile.birth_date) {
    values.date_mm5pensf = { date: text("birth_date") };
  }

  return values;
}

async function mondayRequest(token: string, query: string, variables: Record<string, unknown>) {
  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (!response.ok || result.errors?.length) {
    const message = result.errors?.map((error: { message?: string }) => error.message).join("; ")
      || `Monday API returned HTTP ${response.status}`;
    throw new Error(message);
  }
  return result.data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!accessToken) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mondayToken = Deno.env.get("MONDAY_API_TOKEN");
    if (!supabaseUrl || !serviceRoleKey || !mondayToken) {
      throw new Error("Required server configuration is missing");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !authData.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: profile, error: profileError } = await admin
      .from("member_profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();
    if (profileError) throw profileError;
    if (!profile.registration_completed) {
      return jsonResponse({ error: "Registration is not complete" }, 409);
    }

    const columnValues = JSON.stringify(buildColumnValues(profile));
    let itemId = profile.monday_item_id ? String(profile.monday_item_id) : "";

    if (itemId) {
      await mondayRequest(
        mondayToken,
        `mutation UpdateMember($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) { id }
        }`,
        {
          boardId: MONDAY_BOARD_ID,
          itemId,
          columnValues,
        },
      );
    } else {
      const data = await mondayRequest(
        mondayToken,
        `mutation CreateMember(
          $boardId: ID!,
          $groupId: String!,
          $itemName: String!,
          $columnValues: JSON!
        ) {
          create_item(
            board_id: $boardId,
            group_id: $groupId,
            item_name: $itemName,
            column_values: $columnValues
          ) { id }
        }`,
        {
          boardId: MONDAY_BOARD_ID,
          groupId: MONDAY_GROUP_ID,
          itemName: profile.full_name || profile.email,
          columnValues,
        },
      );
      itemId = String(data.create_item.id);
    }

    const { error: updateError } = await admin
      .from("member_profiles")
      .update({
        monday_item_id: itemId,
        monday_synced_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id);
    if (updateError) throw updateError;

    return jsonResponse({ success: true, itemId });
  } catch (error) {
    console.error("Monday member sync failed", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Monday synchronization failed" },
      500,
    );
  }
});
