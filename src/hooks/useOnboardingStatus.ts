import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoupleMembers } from "./useCoupleMembers";

export function useOnboardingStatus() {
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useCoupleMembers();

  const isLoading = membersLoading;

  const isComplete = useMemo(() => {
    // User must be authenticated
    if (!user) return false;

    // Onboarding is complete if user has at least 2 couple members configured
    // split_settings is optional - defaults to 50-50 if not set
    if (!members || members.length < 2) return false;

    return true;
  }, [user, members]);

  return { isComplete, isLoading };
}
