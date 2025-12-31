import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useCoupleMembers } from "@/hooks/useCoupleMembers";
import { useIsMobile } from "@/hooks/use-mobile";
import { CategorySplit, CategorySplitInput } from "@/hooks/useCategorySplits";

interface CategorySplitRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: CategorySplit | null;
  onSave: (input: CategorySplitInput) => void;
  isPending: boolean;
}

type SplitType = "custom" | "person1" | "person2";

export function CategorySplitRuleModal({
  open,
  onOpenChange,
  editingRule,
  onSave,
  isPending,
}: CategorySplitRuleModalProps) {
  const isMobile = useIsMobile();
  const { data: categories = [] } = useCategories();
  const { data: allSubcategories = [] } = useSubcategories();
  const { data: members = [] } = useCoupleMembers();

  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");
  const [splitType, setSplitType] = useState<SplitType>("custom");
  const [person1Percentage, setPerson1Percentage] = useState(50);

  const person1 = members.find((m) => m.position === 1);
  const person2 = members.find((m) => m.position === 2);
  const person1Name = person1?.name || "Pessoa 1";
  const person2Name = person2?.name || "Pessoa 2";

  // Filter to expense categories only
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Get subcategories for selected category
  const selectedCategory = categories.find((c) => c.name === categoryName);
  const subcategories = selectedCategory
    ? allSubcategories.filter((s) => s.category_id === selectedCategory.id)
    : [];

  useEffect(() => {
    if (editingRule) {
      setCategoryName(editingRule.category_name);
      setSubcategoryName(editingRule.subcategory_name || "");
      if (editingRule.person1_percentage === 100) {
        setSplitType("person1");
        setPerson1Percentage(100);
      } else if (editingRule.person2_percentage === 100) {
        setSplitType("person2");
        setPerson1Percentage(0);
      } else {
        setSplitType("custom");
        setPerson1Percentage(editingRule.person1_percentage);
      }
    } else {
      setCategoryName("");
      setSubcategoryName("");
      setSplitType("custom");
      setPerson1Percentage(50);
    }
  }, [editingRule, open]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!editingRule || categoryName !== editingRule.category_name) {
      setSubcategoryName("");
    }
  }, [categoryName, editingRule]);

  const handleSave = () => {
    let p1 = person1Percentage;
    let p2 = 100 - person1Percentage;

    if (splitType === "person1") {
      p1 = 100;
      p2 = 0;
    } else if (splitType === "person2") {
      p1 = 0;
      p2 = 100;
    }

    onSave({
      category_name: categoryName,
      subcategory_name: subcategoryName || null,
      person1_percentage: p1,
      person2_percentage: p2,
    });
  };

  const getPreviewText = () => {
    if (splitType === "person1") {
      return `${person1Name} paga 100% desta ${subcategoryName ? "subcategoria" : "categoria"}`;
    }
    if (splitType === "person2") {
      return `${person2Name} paga 100% desta ${subcategoryName ? "subcategoria" : "categoria"}`;
    }
    return `${person1Name} paga ${person1Percentage}%, ${person2Name} paga ${100 - person1Percentage}%`;
  };

  const content = (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoryName} onValueChange={setCategoryName}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categoryName && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategoria (opcional)</Label>
          <Select value={subcategoryName} onValueChange={setSubcategoryName}>
            <SelectTrigger>
              <SelectValue placeholder="Aplicar a toda categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aplicar a toda categoria</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.name}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <Label>Tipo de divisão</Label>
        <RadioGroup
          value={splitType}
          onValueChange={(v) => setSplitType(v as SplitType)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="font-normal cursor-pointer">
              Divisão personalizada
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="person1" id="person1" />
            <Label htmlFor="person1" className="font-normal cursor-pointer">
              {person1Name} paga 100%
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="person2" id="person2" />
            <Label htmlFor="person2" className="font-normal cursor-pointer">
              {person2Name} paga 100%
            </Label>
          </div>
        </RadioGroup>
      </div>

      {splitType === "custom" && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{person1Name}: {person1Percentage}%</span>
            <span>{person2Name}: {100 - person1Percentage}%</span>
          </div>
          <Slider
            value={[person1Percentage]}
            onValueChange={([v]) => setPerson1Percentage(v)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      )}

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{getPreviewText()}</p>
      </div>
    </div>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={!categoryName || isPending}>
        {editingRule ? "Salvar" : "Adicionar"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingRule ? "Editar Regra" : "Nova Regra de Divisão"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter className="flex-row gap-2">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Editar Regra" : "Nova Regra de Divisão"}
          </DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
