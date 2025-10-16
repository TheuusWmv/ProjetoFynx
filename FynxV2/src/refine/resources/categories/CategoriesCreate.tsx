import React from 'react';
import { useForm } from '@refinedev/react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { Category } from '../../providers';

const CategoriesCreate: React.FC = () => {
  const {
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Category>();

  const onSubmit = (data: Category) => {
    onFinish(data);
  };

  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#6b7280'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Nova Categoria</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  placeholder="Ex: Alimentação"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{String(errors.name.message || 'Erro de validação')}</p>
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
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-9 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      watch('color') === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione uma cor para identificar esta categoria
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva esta categoria..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {formLoading ? 'Criando...' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesCreate;