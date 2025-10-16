import React from 'react';
import { useList } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Transaction } from '../../providers';

const TransactionsList: React.FC = () => {
  const { data, isLoading, error } = useList<Transaction>({
    resource: 'transactions',
    pagination: {
      pageSize: 10,
    },
    sorters: [
      {
        field: 'date',
        order: 'desc',
      },
    ],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando transações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar transações</div>
      </div>
    );
  }

  const transactions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transações</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="grid gap-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{transaction.description}</h3>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Nenhuma transação encontrada</p>
              <p>Comece criando sua primeira transação</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransactionsList;