import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

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

      // Update user_settings
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

  return { uploadAvatar, uploading };
}
