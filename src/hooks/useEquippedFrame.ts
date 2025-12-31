import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FrameType } from "@/components/shared/AvatarWithFrame";

export function useEquippedFrame() {
  const { user } = useAuth();

  const { data: gamificationData, isLoading } = useQuery({
    queryKey: ["user-gamification-frame", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_gamification")
        .select("equipped_frame")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Map the equipped_frame code to a valid FrameType
  const mapFrameCode = (code: string | null | undefined): FrameType => {
    const frameMap: Record<string, FrameType> = {
      frame_default: "default",
      frame_bronze: "bronze",
      frame_silver: "silver",
      frame_gold: "gold",
      frame_diamond: "diamond",
      frame_couple_heart: "couple_heart",
      frame_champion: "champion",
    };
    return frameMap[code || "frame_default"] || "default";
  };

  return {
    equippedFrame: mapFrameCode(gamificationData?.equipped_frame),
    equippedFrameCode: gamificationData?.equipped_frame || "frame_default",
    isLoading,
  };
}
