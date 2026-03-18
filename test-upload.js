const { createClient } = require("@supabase/supabase-js");

// 직접 넣어서 테스트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://azjxunxnpeaxthfponsj.supabase.co"; 
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_KEY_HERE"; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert...");
  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: "Test App Link",
      description: "A dummy description 10 chars at least.",
      status: "pending",
      author_id: "11111111-1111-1111-1111-111111111111",
      resource_type: "link",
      external_url: "https://example.com"
    })
    .select()
    .single();

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert succeeded:", data);
  }
}

testInsert();
