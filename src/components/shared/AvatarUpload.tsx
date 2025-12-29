import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

interface AvatarUploadProps {
  name: string;
  avatar?: string | null;
  personNumber: 1 | 2;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export function AvatarUpload({ 
  name, 
  avatar, 
  personNumber, 
  size = "lg",
  editable = true 
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, uploading } = useAvatarUpload();

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    await uploadAvatar(file, personNumber);
  };

  return (
    <div className="relative group">
      <div 
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-display font-bold text-primary overflow-hidden ring-4 ring-card shadow-lg transition-all duration-300",
          sizeClasses[size],
          editable && "cursor-pointer group-hover:ring-primary/50"
        )}
        onClick={() => editable && inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {editable && !uploading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
