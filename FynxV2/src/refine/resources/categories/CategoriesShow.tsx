import React from 'react';
import { useShow } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import { Category } from '../../providers';

const CategoriesShow: React.FC = () => {
  const { queryResult } = useShow<Category>();
  const { data, isLoading, error } = queryResult;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando categoria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar categoria</div>
      </div>
    );
  }

  const category = data?.data;

  if (!category) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Categoria não encontrada</div>
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
          <h1 className="text-3xl font-bold">Detalhes da Categoria</h1>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color || '#6b7280' }}
              />
              <CardTitle className="text-2xl">{category.name}</CardTitle>
            </div>
            <Badge variant={category.type === 'income' ? 'default' : 'destructive'}>
              {category.type === 'income' ? 'Receita' : 'Despesa'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-lg">{category.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p className="text-lg">{category.type === 'income' ? 'Receita' : 'Despesa'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cor</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: category.color || '#6b7280' }}
                />
                <p className="text-lg">{category.color || '#6b7280'}</p>
              </div>
            </div>
          </div>
          
          {category.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-lg mt-1">{category.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesShow;