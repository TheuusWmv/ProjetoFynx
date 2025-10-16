import React from 'react';
import { useList } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Eye, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { SpendingLimit } from '../../providers';

const SpendingLimitsList: React.FC = () => {
  const { data, isLoading, error } = useList<SpendingLimit>({
    resource: 'spending-limits',
    pagination: {
      pageSize: 10,
    },
    sorters: [
      {
        field: 'category',
        order: 'asc',
      },
    ],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando limites de gastos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar limites de gastos</div>
      </div>
    );
  }

  const spendingLimits = data?.data || [];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (percentage >= 90) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Limites de Gastos</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Limite
        </Button>
      </div>

      <div className="grid gap-4">
        {spendingLimits.map((limit) => {
          const percentage = (limit.currentAmount / limit.limitAmount) * 100;
          
          return (
            <Card key={limit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{limit.category}</h3>
                      {getStatusIcon(percentage)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Período: {limit.period}
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

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      R$ {limit.currentAmount.toFixed(2)} de R$ {limit.limitAmount.toFixed(2)}
                    </span>
                    <Badge variant={percentage >= 90 ? 'destructive' : percentage >= 75 ? 'secondary' : 'default'}>
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Restante: R$ {Math.max(0, limit.limitAmount - limit.currentAmount).toFixed(2)}</span>
                    <span>
                      {percentage >= 100 ? 'Limite excedido!' : 
                       percentage >= 90 ? 'Próximo do limite' : 
                       'Dentro do limite'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {spendingLimits.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum limite de gastos encontrado</p>
              <p>Defina limites para controlar melhor seus gastos por categoria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpendingLimitsList;