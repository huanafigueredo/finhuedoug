import { CoupleMember } from "@/hooks/useCoupleMembers";
import { AvatarWithFrame } from "@/components/shared/AvatarWithFrame";
import { useEquippedFrame } from "@/hooks/useEquippedFrame";

interface DashboardAvatarsProps {
  members: CoupleMember[];
}

export function DashboardAvatars({ members }: DashboardAvatarsProps) {
  const visibleMembers = members.filter((m) => m.show_on_dashboard);
  const { equippedFrame } = useEquippedFrame();

  if (visibleMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-6 py-3 px-5 rounded-2xl bg-muted/40 border border-border/40">
      {visibleMembers.map((member, index) => (
        <div 
          key={member.id} 
          className="flex flex-col items-center gap-1.5 animate-fade-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <AvatarWithFrame
            name={member.name}
            avatarUrl={member.avatar_url}
            size="md"
            frame={equippedFrame}
          />
          <span className="text-xs font-medium text-foreground/80">
            {member.name}
          </span>
        </div>
      ))}
    </div>
  );
}
