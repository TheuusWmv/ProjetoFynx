import React from 'react';
import { useForm } from '@refinedev/react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { SavingGoal } from '../../providers';

const SavingGoalsEdit: React.FC = () => {
  const {
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SavingGoal>();

  const onSubmit = (data: SavingGoal) => {
    onFinish(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Editar Meta de Economia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Meta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Nome da meta é obrigatório' })}
                  placeholder="Ex: Viagem para Europa"
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
                <Label htmlFor="currentAmount">Valor Atual</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  {...register('currentAmount', { 
                    min: { value: 0, message: 'Valor não pode ser negativo' }
                  })}
                  placeholder="0.00"
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
                placeholder="Descreva sua meta de economia..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={formLoading}>
                <Save className="w-4 h-4 mr-2" />
                {formLoading ? 'Salvando...' : 'Salvar Alterações'}
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

export default SavingGoalsEdit;