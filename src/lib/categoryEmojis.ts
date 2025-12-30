export const categoryEmojis: Record<string, string> = {
  // Despesas
  "Moradia": "🏠",
  "Alimentação": "🍽️",
  "Transporte": "🚗",
  "Saúde": "💊",
  "Educação": "📚",
  "Lazer": "🎮",
  "Assinaturas": "📺",
  "Streaming": "📺",
  "Vestuário": "👕",
  "Pets": "🐾",
  "Beleza": "💅",
  "Compras": "🛒",
  "Supermercado": "🛒",
  "Farmácia": "💊",
  "Restaurante": "🍴",
  "Delivery": "🍕",
  "Combustível": "⛽",
  "Estacionamento": "🅿️",
  "Internet": "📶",
  "Telefone": "📱",
  "Energia": "💡",
  "Água": "💧",
  "Gás": "🔥",
  "Aluguel": "🏠",
  "Condomínio": "🏢",
  "IPTU": "📋",
  "Seguro": "🛡️",
  "Academia": "🏋️",
  "Viagem": "✈️",
  "Presente": "🎁",
  "Outros": "📦",
  
  // Receitas
  "Salário": "💼",
  "Freelancer": "💻",
  "Freelance": "💻",
  "Investimentos": "📈",
  "Pix": "💸",
  "Juros": "🏦",
  "Cashback": "🔄",
  "Presentes": "🎁",
  "Reembolso": "↩️",
  "Outros Rendimentos": "💰",
};

export function getCategoryEmoji(category: string | null | undefined): string {
  if (!category) return "💳";
  return categoryEmojis[category] || "💳";
}

export function getUrgencyInfo(daysUntilDue: number): { 
  label: string; 
  emoji: string; 
  variant: "destructive" | "warning" | "success" | "secondary" 
} {
  if (daysUntilDue < 0) {
    return { label: "Atrasada", emoji: "🚨", variant: "destructive" };
  }
  if (daysUntilDue === 0) {
    return { label: "Vence hoje", emoji: "⚠️", variant: "warning" };
  }
  if (daysUntilDue <= 3) {
    return { label: `${daysUntilDue}d`, emoji: "⏰", variant: "warning" };
  }
  if (daysUntilDue <= 7) {
    return { label: `${daysUntilDue}d`, emoji: "📆", variant: "secondary" };
  }
  return { label: `${daysUntilDue}d`, emoji: "📅", variant: "success" };
}
