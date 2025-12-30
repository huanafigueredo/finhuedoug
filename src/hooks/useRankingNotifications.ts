import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePersonNames } from "./useUserSettings";

interface RankingData {
  person1Expenses: number;
  person2Expenses: number;
  person1Savings: number;
  person2Savings: number;
  person1Balance: number;
  person2Balance: number;
}

interface RankingNotificationsOptions {
  enabled?: boolean;
}

export function useRankingNotifications(
  currentData: RankingData | null,
  options: RankingNotificationsOptions = {}
) {
  const { enabled = true } = options;
  const { toast } = useToast();
  const { person1, person2 } = usePersonNames();
  const previousDataRef = useRef<RankingData | null>(null);
  const hasShownInitialToast = useRef(false);

  const determineWinners = useCallback((data: RankingData) => {
    const spendingWinner = data.person1Expenses < data.person2Expenses
      ? "person1"
      : data.person2Expenses < data.person1Expenses
        ? "person2"
        : "tie";

    const savingsWinner = data.person1Savings > data.person2Savings
      ? "person1"
      : data.person2Savings > data.person1Savings
        ? "person2"
        : "tie";

    const balanceWinner = data.person1Balance > data.person2Balance
      ? "person1"
      : data.person2Balance > data.person1Balance
        ? "person2"
        : "tie";

    const person1Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person1").length;
    const person2Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person2").length;
    
    const overallWinner = person1Wins > person2Wins
      ? "person1"
      : person2Wins > person1Wins
        ? "person2"
        : "tie";

    return { spendingWinner, savingsWinner, balanceWinner, overallWinner };
  }, []);

  const getPersonName = useCallback((person: string) => {
    return person === "person1" ? person1 : person2;
  }, [person1, person2]);

  useEffect(() => {
    if (!enabled || !currentData) return;

    const previousData = previousDataRef.current;
    
    // Skip if no previous data (first load)
    if (!previousData) {
      previousDataRef.current = currentData;
      return;
    }

    const prevWinners = determineWinners(previousData);
    const currWinners = determineWinners(currentData);

    // Check if overall winner changed
    if (prevWinners.overallWinner !== currWinners.overallWinner) {
      if (currWinners.overallWinner === "tie") {
        toast({
          title: "🤝 Empate no Ranking!",
          description: `${person1} e ${person2} estão equilibrados este mês.`,
          duration: 5000,
        });
      } else if (currWinners.overallWinner !== "tie") {
        const newLeader = getPersonName(currWinners.overallWinner);
        const previousLeader = prevWinners.overallWinner !== "tie" 
          ? getPersonName(prevWinners.overallWinner)
          : null;
        
        if (previousLeader && previousLeader !== newLeader) {
          toast({
            title: "👑 Mudança na Liderança!",
            description: `${newLeader} ultrapassou ${previousLeader} no ranking financeiro!`,
            duration: 5000,
          });
        } else if (!previousLeader) {
          toast({
            title: "🎉 Nova Liderança!",
            description: `${newLeader} assumiu a liderança do ranking financeiro!`,
            duration: 5000,
          });
        }
      }
    }

    // Check individual category changes
    const categoryChanges: string[] = [];

    if (prevWinners.spendingWinner !== currWinners.spendingWinner && currWinners.spendingWinner !== "tie") {
      categoryChanges.push(`📉 ${getPersonName(currWinners.spendingWinner)} agora gasta menos`);
    }

    if (prevWinners.savingsWinner !== currWinners.savingsWinner && currWinners.savingsWinner !== "tie") {
      categoryChanges.push(`💰 ${getPersonName(currWinners.savingsWinner)} agora poupa mais`);
    }

    if (prevWinners.balanceWinner !== currWinners.balanceWinner && currWinners.balanceWinner !== "tie") {
      categoryChanges.push(`✨ ${getPersonName(currWinners.balanceWinner)} tem o melhor saldo`);
    }

    // Show category changes if overall winner didn't change
    if (categoryChanges.length > 0 && prevWinners.overallWinner === currWinners.overallWinner) {
      toast({
        title: "📊 Atualização no Ranking",
        description: categoryChanges.join(" • "),
        duration: 4000,
      });
    }

    previousDataRef.current = currentData;
  }, [currentData, enabled, determineWinners, getPersonName, toast, person1, person2]);

  // Function to manually trigger a check (useful after transactions)
  const checkForChanges = useCallback((newData: RankingData) => {
    if (!previousDataRef.current) {
      previousDataRef.current = newData;
      return;
    }

    const prevWinners = determineWinners(previousDataRef.current);
    const currWinners = determineWinners(newData);

    if (prevWinners.overallWinner !== currWinners.overallWinner) {
      if (currWinners.overallWinner !== "tie") {
        const newLeader = getPersonName(currWinners.overallWinner);
        toast({
          title: "🏆 Ranking Atualizado!",
          description: `${newLeader} está liderando o ranking financeiro!`,
          duration: 5000,
        });
      }
    }

    previousDataRef.current = newData;
  }, [determineWinners, getPersonName, toast]);

  return { checkForChanges };
}
