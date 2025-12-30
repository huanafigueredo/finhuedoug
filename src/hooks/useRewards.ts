import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "./useGamification";

export interface Reward {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "theme" | "avatar_frame" | "badge" | "emoji_pack";
  xp_required: number;
  level_required: number;
  preview_data: {
    primary?: string;
    background?: string;
    border?: string;
    glow?: boolean;
    animated?: boolean;
    icon?: string;
    color?: string;
  };
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  unlocked_at: string;
  is_equipped: boolean;
  reward?: Reward;
}

export function useRewards() {
  const { user } = useAuth();
  const { gamification } = useGamification();
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("xp_required", { ascending: true });

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!user?.id,
  });

  const { data: userRewards = [], isLoading: isLoadingUserRewards } = useQuery({
    queryKey: ["user-rewards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_rewards")
        .select("*, reward:rewards(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as (UserReward & { reward: Reward })[];
    },
    enabled: !!user?.id,
  });

  const unlockRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user?.id) return;

      // Check if already unlocked
      const existing = userRewards.find((ur) => ur.reward_id === rewardId);
      if (existing) return null;

      const { data, error } = await supabase
        .from("user_rewards")
        .insert({
          user_id: user.id,
          reward_id: rewardId,
        })
        .select("*, reward:rewards(*)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
    },
  });

  const equipRewardMutation = useMutation({
    mutationFn: async ({ rewardId, type }: { rewardId: string; type: string }) => {
      if (!user?.id) return;

      // First, unequip all rewards of the same type
      const sameTypeRewards = userRewards.filter(
        (ur) => ur.reward?.type === type && ur.is_equipped
      );

      for (const ur of sameTypeRewards) {
        await supabase
          .from("user_rewards")
          .update({ is_equipped: false })
          .eq("id", ur.id);
      }

      // Then equip the new one
      const { error } = await supabase
        .from("user_rewards")
        .update({ is_equipped: true })
        .eq("reward_id", rewardId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update user_gamification with equipped theme/frame
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward) {
        const updateData: Record<string, string> = {};
        if (reward.type === "theme") {
          updateData.equipped_theme = reward.code;
        } else if (reward.type === "avatar_frame") {
          updateData.equipped_frame = reward.code;
        }

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from("user_gamification")
            .update(updateData)
            .eq("user_id", user.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
    },
  });

  // Check which rewards can be unlocked based on XP and level
  const availableToUnlock = rewards.filter((reward) => {
    const alreadyUnlocked = userRewards.some((ur) => ur.reward_id === reward.id);
    if (alreadyUnlocked) return false;

    const hasEnoughXp = (gamification?.xp || 0) >= reward.xp_required;
    const hasEnoughLevel = (gamification?.level || 1) >= reward.level_required;

    return hasEnoughXp && hasEnoughLevel;
  });

  const unlockedRewardIds = new Set(userRewards.map((ur) => ur.reward_id));

  const themes = rewards.filter((r) => r.type === "theme");
  const frames = rewards.filter((r) => r.type === "avatar_frame");
  const badges = rewards.filter((r) => r.type === "badge");

  const equippedTheme = userRewards.find(
    (ur) => ur.reward?.type === "theme" && ur.is_equipped
  )?.reward;

  const equippedFrame = userRewards.find(
    (ur) => ur.reward?.type === "avatar_frame" && ur.is_equipped
  )?.reward;

  return {
    rewards,
    userRewards,
    themes,
    frames,
    badges,
    availableToUnlock,
    unlockedRewardIds,
    equippedTheme,
    equippedFrame,
    isLoading: isLoadingRewards || isLoadingUserRewards,
    unlockReward: unlockRewardMutation.mutateAsync,
    equipReward: equipRewardMutation.mutateAsync,
  };
}
