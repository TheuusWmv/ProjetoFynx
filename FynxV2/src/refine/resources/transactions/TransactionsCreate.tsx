import React from 'react';
import { useForm } from '@refinedev/react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { Transaction } from '../../providers';

const TransactionsCreate: React.FC = () => {
  const {
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Transaction>();

  const onSubmit = (data: Transaction) => {
    onFinish(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Nova Transação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  placeholder="Ex: Compra no supermercado"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{String(errors.description.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { 
                    required: 'Valor é obrigatório',
                    min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                  })}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{String(errors.amount.message || 'Erro de validação')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value as 'income' | 'expense')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{String(errors.type.message || 'Erro de validação')}</p>
                )}
              </div>

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
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', { required: 'Data é obrigatória' })}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{String(errors.date.message || 'Erro de validação')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Adicione observações sobre esta transação..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {formLoading ? 'Criando...' : 'Criar Transação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsCreate;