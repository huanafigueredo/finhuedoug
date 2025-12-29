import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // New: Upload avatar for a couple member by ID
  const uploadAvatarForMember = async (file: File, memberId: string) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para fazer upload");
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `member_${memberId}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update couple_members table
      const { error } = await supabase
        .from("couple_members")
        .update({ avatar_url: avatarUrl })
        .eq("id", memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["couple-members"] });
      toast.success("Avatar atualizado com sucesso!");
      return avatarUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Legacy: Upload avatar by person number (backwards compatibility)
  const uploadAvatar = async (file: File, personNumber: 1 | 2) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para fazer upload");
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `person_${personNumber}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Try to update couple_members first (new system)
      const { data: members } = await supabase
        .from("couple_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("position", personNumber)
        .maybeSingle();

      if (members) {
        const { error } = await supabase
          .from("couple_members")
          .update({ avatar_url: avatarUrl })
          .eq("id", members.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["couple-members"] });
      } else {
        // Fallback to user_settings (old system)
        const columnName = personNumber === 1 ? "person_1_avatar_url" : "person_2_avatar_url";
        
        const { data: existing } = await supabase
          .from("user_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("user_settings")
            .update({ [columnName]: avatarUrl })
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_settings")
            .insert({ user_id: user.id, [columnName]: avatarUrl });
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      }

      toast.success("Avatar atualizado com sucesso!");
      return avatarUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploadAvatarForMember, uploading };
}
