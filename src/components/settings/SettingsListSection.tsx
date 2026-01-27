import { Plus, Trash2, GripVertical, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfigItem {
    id: string;
    name: string;
    color?: string | null;
    icon?: React.ReactNode;
    [key: string]: any;
}

interface SettingsListSectionProps {
    items: ConfigItem[];
    isLoading: boolean;
    onAdd: () => void;
    onEdit: (item: ConfigItem) => void;
    onDelete: (item: ConfigItem) => void;
    renderExtraInfo?: (item: ConfigItem) => React.ReactNode;
}

export function SettingsListSection({
    items,
    isLoading,
    onAdd,
    onEdit,
    onDelete,
    renderExtraInfo,
}: SettingsListSectionProps) {
    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                className="w-full sm:w-auto"
            >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
            </Button>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 w-full bg-muted/30 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-muted">
                    <p className="text-sm">Nenhum item cadastrado.</p>
                </div>
            ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onEdit(item)}
                            className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <GripVertical
                                    className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {item.icon && (
                                    <div className="flex-shrink-0 text-muted-foreground">
                                        {item.icon}
                                    </div>
                                )}

                                {item.color && (
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                )}

                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                                    {renderExtraInfo && renderExtraInfo(item)}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item);
                                    }}
                                    className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
