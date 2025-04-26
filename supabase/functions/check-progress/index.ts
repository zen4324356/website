import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maintain progress state globally for this function instance
const progressState = {
  status: 'Initializing search...',
  total: 0,
  current: 0,
  lastUpdated: new Date()
};

// Function to update progress
export function updateProgress(status: string, current: number, total: number) {
  progressState.status = status;
  progressState.current = current;
  progressState.total = total;
  progressState.lastUpdated = new Date();
  
  console.log(`Progress updated: ${status}, ${current}/${total}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request to get the search email
    const { searchEmail } = await req.json();
    
    return new Response(
      JSON.stringify({ 
        progress: progressState,
        lastUpdated: progressState.lastUpdated.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in check-progress function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        progress: null
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}); 