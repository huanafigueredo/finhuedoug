import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoupleMembers } from "./useCoupleMembers";
import { useSplitSettings } from "./useSplitSettings";

export function useOnboardingStatus() {
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useCoupleMembers();
  const { data: splitSettings, isLoading: splitLoading } = useSplitSettings();

  const isLoading = membersLoading || splitLoading;

  const isComplete = useMemo(() => {
    // User must be authenticated
    if (!user) return false;

    // Must have at least 2 couple members configured
    if (!members || members.length < 2) return false;

    // Must have split settings configured
    if (!splitSettings) return false;

    return true;
  }, [user, members, splitSettings]);

  return { isComplete, isLoading };
}
