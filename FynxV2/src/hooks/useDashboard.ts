import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { DashboardData, Transaction } from '@/lib/types';

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
  });
  return query;
}

export function useTransactionHistory() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<Transaction[]>('/dashboard/transactions'),
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Transaction, 'id'>) => api.post<Transaction>('/dashboard/transactions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}