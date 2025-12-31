import { CoupleMember } from "@/hooks/useCoupleMembers";
import { AvatarWithFrame } from "@/components/shared/AvatarWithFrame";

interface DashboardAvatarsProps {
  members: CoupleMember[];
}

export function DashboardAvatars({ members }: DashboardAvatarsProps) {
  const visibleMembers = members.filter((m) => m.show_on_dashboard);

  if (visibleMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {visibleMembers.map((member) => (
        <div key={member.id} className="relative group">
          <AvatarWithFrame
            name={member.name}
            avatarUrl={member.avatar_url}
            size="sm"
            frame="default"
          />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {member.name}
          </span>
        </div>
      ))}
    </div>
  );
}
