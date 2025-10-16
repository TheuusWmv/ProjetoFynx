import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { DashboardData, Transaction } from '@/lib/types';

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
    refetchOnWindowFocus: false,
  });
  return query;
}

export function useTransactionHistory() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<Transaction[]>('/dashboard/transactions'),
    refetchOnWindowFocus: false,
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

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      api.delete<{ data: { id: number | string } }>(`/transactions/${id}?userId=1`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}