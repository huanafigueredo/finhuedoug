import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, setDate as setDateFns } from "date-fns";

export interface TransactionInsert {
  date: string;
  description: string;
  type: "income" | "expense";
  category?: string;
  subcategory?: string;
  total_value: number;
  value_per_person?: number;
  is_couple?: boolean;
  paid_by?: string;
  for_who?: string;
  bank_id?: string;
  payment_method_id?: string;
  recipient_id?: string;
  receiving_bank_id?: string;
  income_origin?: string;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  installment_value?: number;
  parent_transaction_id?: string;
  is_generated_installment?: boolean;
  start_from_installment?: number; // New field for already started purchases
  // Recurring fields
  is_recurring?: boolean;
  recurring_day?: number;
  recurring_duration?: string;
  recurring_end_date?: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  date: string;
  description: string;
  type: "income" | "expense";
  category: string | null;
  subcategory: string | null;
  total_value: number;
  value_per_person: number | null;
  is_couple: boolean;
  paid_by: string | null;
  for_who: string | null;
  bank_id: string | null;
  payment_method_id: string | null;
  recipient_id: string | null;
  receiving_bank_id: string | null;
  income_origin: string | null;
  is_installment: boolean;
  installment_number: number | null;
  total_installments: number | null;
  installment_value: number | null;
  parent_transaction_id: string | null;
  is_generated_installment: boolean;
  user_id: string | null;
  // Recurring fields
  is_recurring: boolean | null;
  recurring_day: number | null;
  recurring_duration: string | null;
  recurring_end_date: string | null;
  // Joined fields
  bank_name?: string;
  payment_method_name?: string;
  recipient_name?: string;
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          banks!transactions_bank_id_fkey(name),
          payment_methods(name),
          recipients(name)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return (data || []).map((t: any) => ({
        ...t,
        bank_name: t.banks?.name || null,
        payment_method_name: t.payment_methods?.name || null,
        recipient_name: t.recipients?.name || null,
      })) as Transaction[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // If it's an installment transaction, create multiple records
      if (transaction.is_installment && transaction.total_installments && transaction.total_installments > 1) {
        const installmentValue = transaction.total_value / transaction.total_installments;
        const baseDate = new Date(transaction.date);
        const startFrom = transaction.start_from_installment || 1;
        
        // Remove start_from_installment from the data we send to the database
        const { start_from_installment, ...transactionData } = transaction;
        
        // Create the first installment (starting from startFrom)
        const { data: parentData, error: parentError } = await supabase
          .from("transactions")
          .insert({
            ...transactionData,
            user_id: user.id,
            description: `${transaction.description} (Parcela ${startFrom}/${transaction.total_installments})`,
            total_value: installmentValue,
            installment_number: startFrom,
            installment_value: installmentValue,
            is_generated_installment: false,
          })
          .select()
          .single();

        if (parentError) {
          console.error("Transaction insert error:", parentError);
          throw parentError;
        }

        // Create remaining installments (from startFrom+1 to total)
        const childInstallments = [];
        for (let i = startFrom + 1; i <= transaction.total_installments; i++) {
          // When starting from a specific installment, date offset is relative to startFrom
          const monthOffset = i - startFrom;
          const installmentDate = addMonths(baseDate, monthOffset);
          childInstallments.push({
            ...transactionData,
            user_id: user.id,
            date: installmentDate.toISOString().split("T")[0],
            description: `${transaction.description} (Parcela ${i}/${transaction.total_installments})`,
            total_value: installmentValue,
            installment_number: i,
            installment_value: installmentValue,
            parent_transaction_id: parentData.id,
            is_generated_installment: true,
          });
        }

        if (childInstallments.length > 0) {
          const { error: childError } = await supabase
            .from("transactions")
            .insert(childInstallments);

          if (childError) {
            console.error("Child installments insert error:", childError);
            throw childError;
          }
        }

        return parentData;
      }

      // If it's a recurring income transaction
      if (transaction.is_recurring && transaction.type === "income" && transaction.recurring_day) {
        const recurringDay = transaction.recurring_day;
        const duration = transaction.recurring_duration;
        
        // Determine number of months to generate
        let monthsToGenerate = 0;
        if (duration === "indefinite") {
          monthsToGenerate = 12; // Generate 12 months for indefinite
        } else {
          monthsToGenerate = parseInt(duration || "0");
        }

        if (monthsToGenerate > 0) {
          const baseDate = new Date(transaction.date);
          
          // Set the first transaction date to the recurring day of the base month
          const daysInBaseMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
          const firstDate = setDateFns(baseDate, Math.min(recurringDay, daysInBaseMonth));
          
          // Create the first (parent) recurring transaction
          const { data: parentData, error: parentError } = await supabase
            .from("transactions")
            .insert({
              ...transaction,
              user_id: user.id,
              date: firstDate.toISOString().split("T")[0],
              is_generated_installment: false,
            })
            .select()
            .single();

          if (parentError) {
            console.error("Recurring transaction insert error:", parentError);
            throw parentError;
          }

          // Create future recurring transactions for subsequent months
          const futureTransactions = [];
          for (let i = 1; i < monthsToGenerate; i++) {
            const futureMonth = addMonths(firstDate, i);
            // Set the specific day of month (handle months with fewer days)
            const daysInMonth = new Date(futureMonth.getFullYear(), futureMonth.getMonth() + 1, 0).getDate();
            const futureDate = setDateFns(futureMonth, Math.min(recurringDay, daysInMonth));
            
            futureTransactions.push({
              ...transaction,
              user_id: user.id,
              date: futureDate.toISOString().split("T")[0],
              parent_transaction_id: parentData.id,
              is_generated_installment: true,
            });
          }

          if (futureTransactions.length > 0) {
            const { error: futureError } = await supabase
              .from("transactions")
              .insert(futureTransactions);

            if (futureError) {
              console.error("Future recurring transactions insert error:", futureError);
              throw futureError;
            }
          }

          return parentData;
        }
      }

      // Single transaction (no installments or recurring)
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) {
        console.error("Transaction insert error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      updateFutureInstallments = false,
    }: {
      id: string;
      updates: Partial<TransactionInsert>;
      updateFutureInstallments?: boolean;
    }) => {
      // Update the main transaction
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // If updating future installments
      if (updateFutureInstallments && data.is_installment && data.installment_number) {
        const parentId = data.parent_transaction_id || id;
        
        // Recalculate installment value if total_value changed
        let updateData: any = {};
        
        if (updates.description) {
          // Update description pattern for future installments
          const baseDescription = updates.description.replace(/\s*\(Parcela \d+\/\d+\)$/, "");
          
          // Get all future installments
          const { data: futureInstallments } = await supabase
            .from("transactions")
            .select("id, installment_number, total_installments")
            .or(`id.eq.${parentId},parent_transaction_id.eq.${parentId}`)
            .gt("installment_number", data.installment_number);

          if (futureInstallments) {
            for (const inst of futureInstallments) {
              await supabase
                .from("transactions")
                .update({
                  ...updates,
                  description: `${baseDescription} (Parcela ${inst.installment_number}/${inst.total_installments})`,
                })
                .eq("id", inst.id);
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // ON DELETE CASCADE will handle child installments
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
