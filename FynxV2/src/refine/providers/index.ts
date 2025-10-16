// Exportações centralizadas dos providers do Refine
export { dataProvider } from './dataProvider';

// Placeholder para authProvider (implementar no futuro quando necessário)
// export { authProvider } from './authProvider';

// Tipos para os recursos
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  type: 'income' | 'expense';
  userId: string;
}

export interface SpendingLimit {
  id: string;
  category: string;
  limitAmount: number;
  currentAmount: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  userId: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  userId: string;
}

// Configurações dos recursos para o Refine
export const resourcesConfig = [
  {
    name: "dashboard",
    list: "/dashboard",
    meta: { 
      label: "Dashboard",
      icon: "🏠"
    }
  },
  {
    name: "overview",
    list: "/overview",
    meta: {
      label: "Overview",
      icon: "📈"
    }
  },
  {
    name: "transactions", 
    list: "/transactions",
    create: "/transactions/create",
    edit: "/transactions/edit/:id",
    show: "/transactions/show/:id",
    meta: { 
      label: "Transações",
      icon: "💰"
    }
  },
  {
    name: "categories",
    list: "/categories", 
    create: "/categories/create",
    edit: "/categories/edit/:id",
    show: "/categories/show/:id",
    meta: { 
      label: "Categorias",
      icon: "📂"
    }
  },
  {
    name: "spending-limits",
    list: "/spending-limits",
    create: "/spending-limits/create", 
    edit: "/spending-limits/edit/:id",
    show: "/spending-limits/show/:id",
    meta: { 
      label: "Limites de Gastos",
      icon: "🚫"
    }
  },
  {
    name: "saving-goals",
    list: "/saving-goals",
    create: "/saving-goals/create",
    edit: "/saving-goals/edit/:id", 
    show: "/saving-goals/show/:id",
    meta: { 
      label: "Metas de Economia",
      icon: "🎯"
    }
  }
];