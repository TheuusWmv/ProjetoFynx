import React from 'react';
import { useForm } from '@refinedev/react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { SpendingLimit } from '../../providers';

const SpendingLimitsEdit: React.FC = () => {
  const {
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SpendingLimit>();

  const onSubmit = (data: SpendingLimit) => {
    onFinish(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Editar Limite de Gastos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Limite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  {...register('category', { required: 'Categoria é obrigatória' })}
                  placeholder="Ex: Alimentação"
                />
                {errors.category && (
                  <p className="text-sm text-red-500">{String(errors.category.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limitAmount">Valor do Limite</Label>
                <Input
                  id="limitAmount"
                  type="number"
                  step="0.01"
                  {...register('limitAmount', { 
                    required: 'Valor do limite é obrigatório',
                    min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                  })}
                  placeholder="0.00"
                />
                {errors.limitAmount && (
                  <p className="text-sm text-red-500">{String(errors.limitAmount.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select onValueChange={(value) => setValue('period', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.period && (
                  <p className="text-sm text-red-500">{String(errors.period.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">Valor Atual Gasto</Label>
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

export default SpendingLimitsEdit;