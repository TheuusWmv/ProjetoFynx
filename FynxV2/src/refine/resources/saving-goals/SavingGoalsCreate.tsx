import React from 'react';
import { useForm } from '@refinedev/react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus } from 'lucide-react';
import { SavingGoal } from '../../providers';

const SavingGoalsCreate: React.FC = () => {
  const {
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SavingGoal>();

  const onSubmit = (data: SavingGoal) => {
    onFinish({
      ...data,
      currentAmount: data.currentAmount || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Criar Meta de Economia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Meta de Economia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Nome da meta é obrigatório' })}
                  placeholder="Ex: Viagem para Europa, Carro novo, Casa própria"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{String(errors.name.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Valor da Meta</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  {...register('targetAmount', { 
                    required: 'Valor da meta é obrigatório',
                    min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                  })}
                  placeholder="0.00"
                />
                {errors.targetAmount && (
                  <p className="text-sm text-red-500">{String(errors.targetAmount.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">Valor Inicial (opcional)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  {...register('currentAmount', { 
                    min: { value: 0, message: 'Valor não pode ser negativo' }
                  })}
                  placeholder="0.00"
                  defaultValue="0"
                />
                {errors.currentAmount && (
                  <p className="text-sm text-red-500">{String(errors.currentAmount.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Data Limite</Label>
                <Input
                  id="targetDate"
                  type="date"
                  {...register('targetDate', { required: 'Data limite é obrigatória' })}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.targetDate && (
                  <p className="text-sm text-red-500">{String(errors.targetDate.message || 'Erro de validação')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva sua meta de economia e o que ela representa para você..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={formLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {formLoading ? 'Criando...' : 'Criar Meta'}
              </Button>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingGoalsCreate;