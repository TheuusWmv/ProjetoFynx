import React from 'react';
import { useList } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Tag } from 'lucide-react';
import { Category } from '../../providers';

const CategoriesList: React.FC = () => {
  const { data, isLoading, error } = useList<Category>({
    resource: 'categories',
    pagination: {
      pageSize: 20,
    },
    sorters: [
      {
        field: 'name',
        order: 'asc',
      },
    ],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar categorias</div>
      </div>
    );
  }

  const categories = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorias</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </div>
                <Badge variant={category.type === 'income' ? 'default' : 'destructive'}>
                  {category.type === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
              
              {category.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>Categoria</span>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhuma categoria encontrada</p>
              <p>Comece criando sua primeira categoria para organizar suas transações</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CategoriesList;