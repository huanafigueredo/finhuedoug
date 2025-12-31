import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCoupleMembers } from "./useCoupleMembers";

const DEFAULT_MEMBER_NAMES = ["Pessoa 1", "Pessoa 2"];

export function useOnboardingStatus() {
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useCoupleMembers();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
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

  const isLoading = membersLoading || profileLoading;

  const isComplete = useMemo(() => {
    // User must be authenticated
    if (!user) return false;

    // If profile has onboarding_completed_at, it's complete
    if (profile?.onboarding_completed_at) return true;

    // Fallback: check if members have personalized names
    if (!members || members.length < 2) return false;

    const member1 = members.find(m => m.position === 1);
    const member2 = members.find(m => m.position === 2);

    const hasPersonalizedNames = 
      member1 && !DEFAULT_MEMBER_NAMES.includes(member1.name.trim()) &&
      member2 && !DEFAULT_MEMBER_NAMES.includes(member2.name.trim());

    return hasPersonalizedNames;
  }, [user, members, profile]);

  return { isComplete, isLoading };
}
