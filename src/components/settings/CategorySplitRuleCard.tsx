import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategorySplit } from "@/hooks/useCategorySplits";
import { useCoupleMembers } from "@/hooks/useCoupleMembers";

interface CategorySplitRuleCardProps {
  rule: CategorySplit;
  onEdit: (rule: CategorySplit) => void;
  onDelete: (rule: CategorySplit) => void;
}

export function CategorySplitRuleCard({
  rule,
  onEdit,
  onDelete,
}: CategorySplitRuleCardProps) {
  const { data: members = [] } = useCoupleMembers();

  const person1 = members.find((m) => m.position === 1);
  const person2 = members.find((m) => m.position === 2);
  const person1Name = person1?.name || "Pessoa 1";
  const person2Name = person2?.name || "Pessoa 2";

  const getSplitDescription = () => {
    if (rule.person1_percentage === 100) {
      return `${person1Name} paga 100%`;
    }
    if (rule.person2_percentage === 100) {
      return `${person2Name} paga 100%`;
    }
    if (rule.person1_percentage === 0) {
      return `${person2Name} paga tudo`;
    }
    if (rule.person2_percentage === 0) {
      return `${person1Name} paga tudo`;
    }
    return `${person1Name} ${rule.person1_percentage}% / ${person2Name} ${rule.person2_percentage}%`;
  };

  return (
    <Card className="p-3 flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {rule.category_name}
          {rule.subcategory_name && (
            <span className="text-muted-foreground"> › {rule.subcategory_name}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{getSplitDescription()}</p>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(rule)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(rule)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
