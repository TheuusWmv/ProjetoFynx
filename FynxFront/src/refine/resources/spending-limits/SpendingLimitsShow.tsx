import React from 'react';
import { useShow } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { SpendingLimit } from '../../providers';

const SpendingLimitsShow: React.FC = () => {
  const { queryResult } = useShow<SpendingLimit>();
  const { data, isLoading, error } = queryResult;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando limite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar limite</div>
      </div>
    );
  }

  const limit = data?.data;

  if (!limit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Limite não encontrado</div>
      </div>
    );
  }

  const percentage = (limit.currentAmount / limit.limitAmount) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Detalhes do Limite</h1>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{limit.category}</CardTitle>
            <Badge variant={percentage >= 90 ? 'destructive' : percentage >= 75 ? 'secondary' : 'default'}>
              {percentage.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Limite Definido</label>
              <p className="text-2xl font-bold">R$ {limit.limitAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Gasto</label>
              <p className="text-2xl font-bold text-red-600">R$ {limit.currentAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <p className="text-lg">{limit.period}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Restante</label>
              <p className="text-lg font-semibold text-green-600">
                R$ {Math.max(0, limit.limitAmount - limit.currentAmount).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {percentage >= 100 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : 
               percentage >= 90 ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : 
               <CheckCircle className="w-5 h-5 text-green-500" />}
              <span className="font-medium">
                {percentage >= 100 ? 'Limite excedido!' : 
                 percentage >= 90 ? 'Próximo do limite' : 
                 'Dentro do limite'}
              </span>
            </div>
            <Progress value={Math.min(percentage, 100)} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingLimitsShow;