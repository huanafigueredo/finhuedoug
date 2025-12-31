import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useOnboardingStatus() {
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Onboarding is complete ONLY when onboarding_completed_at is set
  // This is set at the END of onboarding after all steps are done
  const isComplete = !!profile?.onboarding_completed_at;

  return { isComplete, isLoading };
}
