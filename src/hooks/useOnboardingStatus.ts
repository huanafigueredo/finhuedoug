import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoupleMembers } from "./useCoupleMembers";

const DEFAULT_MEMBER_NAMES = ["Pessoa 1", "Pessoa 2"];

export function useOnboardingStatus() {
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useCoupleMembers();

  const isLoading = membersLoading;

  const isComplete = useMemo(() => {
    // User must be authenticated
    if (!user) return false;

    // Must have at least 2 couple members
    if (!members || members.length < 2) return false;

    // Find the two main members by position
    const member1 = members.find(m => m.position === 1);
    const member2 = members.find(m => m.position === 2);

    // Onboarding is only complete if BOTH members have personalized names
    // (not the default "Pessoa 1" / "Pessoa 2" created by trigger)
    const hasPersonalizedNames = 
      member1 && !DEFAULT_MEMBER_NAMES.includes(member1.name.trim()) &&
      member2 && !DEFAULT_MEMBER_NAMES.includes(member2.name.trim());

    return hasPersonalizedNames;
  }, [user, members]);

  return { isComplete, isLoading };
}
