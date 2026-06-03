import React from 'react';
import { useShow } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import { Transaction } from '../../providers';

const TransactionsShow: React.FC = () => {
  const { queryResult } = useShow<Transaction>();
  const { data, isLoading, error } = queryResult;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando transação...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar transação</div>
      </div>
    );
  }

  const transaction = data?.data;

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Transação não encontrada</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Transação</h1>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{transaction.description}</CardTitle>
            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor</label>
              <p className={`text-3xl font-bold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data</label>
              <p className="text-lg">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoria</label>
              <p className="text-lg">{transaction.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p className="text-lg">{transaction.type === 'income' ? 'Receita' : 'Despesa'}</p>
            </div>
          </div>
          
          {transaction.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observações</label>
              <p className="text-lg mt-1">{transaction.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsShow;