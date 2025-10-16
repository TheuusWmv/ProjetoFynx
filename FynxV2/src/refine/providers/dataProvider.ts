import axios from 'axios';
import { DataProvider } from '@refinedev/core';

const API_URL = 'http://localhost:3000/api'; // URL do seu backend Express

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar autenticação no futuro (se necessário)
axiosInstance.interceptors.request.use(
  (config) => {
    // Aqui você pode adicionar tokens de autenticação no futuro
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const dataProvider: DataProvider = {
  getApiUrl: () => API_URL,
  
  // GET /api/{resource} - Lista recursos
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const url = `/${resource}`;
    
    const params: any = {};
    
    // Paginação
    if (pagination) {
      params._start = pagination.current ? (pagination.current - 1) * (pagination.pageSize || 10) : 0;
      params._end = pagination.current ? pagination.current * (pagination.pageSize || 10) : 10;
      params._limit = pagination.pageSize || 10;
      params._page = pagination.current || 1;
    }
    
    // Filtros
    if (filters) {
      filters.forEach((filter) => {
        if (filter.operator === 'eq') {
          params[filter.field] = filter.value;
        } else if (filter.operator === 'contains') {
          params[`${filter.field}_like`] = filter.value;
        }
      });
    }
    
    // Ordenação
    if (sorters && sorters.length > 0) {
      params._sort = sorters[0].field;
      params._order = sorters[0].order;
    }

    try {
      const { data } = await axiosInstance.get(url, { params });
      
      return {
        data: Array.isArray(data) ? data : data.data || [],
        total: data.total || data.length || 0,
      };
    } catch (error) {
      console.error(`Erro ao buscar ${resource}:`, error);
      throw error;
    }
  },

  // GET /api/{resource}/{id} - Busca um recurso
  getOne: async ({ resource, id }) => {
    const url = `/${resource}/${id}`;
    
    try {
      const { data } = await axiosInstance.get(url);
      return { data };
    } catch (error) {
      console.error(`Erro ao buscar ${resource} com ID ${id}:`, error);
      throw error;
    }
  },

  // POST /api/{resource} - Cria recurso
  create: async ({ resource, variables }) => {
    const url = `/${resource}`;
    
    try {
      const { data } = await axiosInstance.post(url, variables);
      return { data };
    } catch (error) {
      console.error(`Erro ao criar ${resource}:`, error);
      throw error;
    }
  },

  // PUT /api/{resource}/{id} - Atualiza recurso
  update: async ({ resource, id, variables }) => {
    const url = `/${resource}/${id}`;
    
    try {
      const { data } = await axiosInstance.put(url, variables);
      return { data };
    } catch (error) {
      console.error(`Erro ao atualizar ${resource} com ID ${id}:`, error);
      throw error;
    }
  },

  // DELETE /api/{resource}/{id} - Deleta recurso
  deleteOne: async ({ resource, id }) => {
    const url = `/${resource}/${id}`;
    
    try {
      await axiosInstance.delete(url);
      return { data: { id } as any };
    } catch (error) {
      console.error(`Erro ao deletar ${resource} com ID ${id}:`, error);
      throw error;
    }
  },

  // Para múltiplas deleções
  deleteMany: async ({ resource, ids }) => {
    try {
      const deletePromises = ids.map(id => axiosInstance.delete(`/${resource}/${id}`));
      await Promise.all(deletePromises);
      return { data: ids.map(id => ({ id })) as any };
    } catch (error) {
      console.error(`Erro ao deletar múltiplos ${resource}:`, error);
      throw error;
    }
  },

  // Para operações customizadas
  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
    try {
      const { data } = await axiosInstance({
        url,
        method,
        data: payload,
        params: query,
        headers,
      });

      return { data };
    } catch (error) {
      console.error(`Erro na operação customizada:`, error);
      throw error;
    }
  },

  // Para buscar múltiplos recursos por IDs
  getMany: async ({ resource, ids }) => {
    try {
      const promises = ids.map(id => axiosInstance.get(`/${resource}/${id}`));
      const responses = await Promise.all(promises);
      const data = responses.map(response => response.data);
      
      return { data };
    } catch (error) {
      console.error(`Erro ao buscar múltiplos ${resource}:`, error);
      throw error;
    }
  },
};