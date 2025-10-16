import React from 'react';
import { useShow } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, Target, Calendar, TrendingUp } from 'lucide-react';
import { SavingGoal } from '../../providers';

const SavingGoalsShow: React.FC = () => {
  const { queryResult } = useShow<SavingGoal>();
  const { data, isLoading, error } = queryResult;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando meta...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar meta</div>
      </div>
    );
  }

  const goal = data?.data;

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Meta não encontrada</div>
      </div>
    );
  }

  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Meta</h1>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                {goal.name}
              </CardTitle>
              <p className="text-muted-foreground">{goal.description}</p>
            </div>
            <Badge variant={percentage >= 100 ? 'default' : percentage >= 75 ? 'secondary' : 'outline'}>
              {percentage >= 100 ? 'Concluída' : percentage >= 75 ? 'Quase lá' : 'Em progresso'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Meta</label>
              <p className="text-2xl font-bold">R$ {goal.targetAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Economizado</label>
              <p className="text-2xl font-bold text-green-600">R$ {goal.currentAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Restante</label>
              <p className="text-2xl font-bold text-blue-600">R$ {remaining.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data Limite</label>
              <p className="text-lg font-semibold flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(goal.targetDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Progresso da Meta</span>
              <span className="text-lg font-bold">{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(percentage, 100)} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dias restantes</p>
                <p className="font-semibold">
                  {daysRemaining > 0 ? `${daysRemaining} dias` : 'Prazo vencido'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valor por dia</p>
                <p className="font-semibold">
                  {daysRemaining > 0 ? `R$ ${(remaining / daysRemaining).toFixed(2)}` : 'Meta vencida'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingGoalsShow;