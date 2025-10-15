import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AddTransactionSheet } from "@/components/AddTransactionSheet"
import { useDashboard } from "@/hooks/useDashboard"
import { useGoals } from "@/hooks/useGoals"
import { AddSpendingGoalSheet } from "@/components/AddSpendingGoalSheet"
import { 
  Eye, TrendingUp, TrendingDown, Users, 
  ArrowUpRight, ArrowDownRight, Plus, 
  MoreHorizontal, CheckCircle, Clock, AlertCircle, CalendarIcon 
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, YAxis, Tooltip, Legend } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Map overview titles to icons from lucide-react
const overviewIconMap: Record<string, React.ComponentType<any>> = {
  "Total Balance": Eye,
  "Monthly Income": TrendingUp,
  "Monthly Expenses": TrendingDown,
  "Savings Rate": Users,
}









const chartConfig = {
  receitas: {
    label: "Receitas",
    color: "#8b5cf6",
  },
  despesas: {
    label: "Despesas", 
    color: "#84cc16",
  },
} satisfies ChartConfig;

const Index = () => {
  const [chartView, setChartView] = React.useState<"income" | "expense">("income")
  const [monthlyTimeRange, setMonthlyTimeRange] = React.useState("12m")
  const [isAddTransactionOpen, setIsAddTransactionOpen] = React.useState(false)
  const dashboard = useDashboard()
  const goals = useGoals()
  const data = dashboard.data
  const goalsData = goals.data
  
  // Estados para o Daily Comparison
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      from: thirtyDaysAgo,
      to: today
    }
  })

  // Handler para o Calendar
  const handleDateRangeSelect = (range: { from: Date | undefined; to?: Date | undefined } | undefined) => {
    if (range) {
      setDateRange({
        from: range.from,
        to: range.to
      })
    }
  }

  // Backend-driven datasets
  const incomePalette = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#14b8a6", "#22c55e", "#6366f1"]
  const expensePalette = ["#ef4444", "#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#6b7280", "#eab308"]

  const incomeChartData = (data?.incomeByCategory ?? []).map((item, index) => ({
    category: item.category,
    value: item.value,
    fill: incomePalette[index % incomePalette.length],
  }))
  const expenseChartData = (data?.spendingByCategory ?? []).map((item, index) => ({
    category: item.category,
    value: item.value,
    fill: expensePalette[index % expensePalette.length],
  }))

  const dailyDataBackend = (data?.dailyPerformance ?? []).map((item) => ({
    date: item.date,
    receitas: item.income,
    despesas: item.expense,
  }))
  const monthlyDataBackend = (data?.monthlyPerformance ?? []).map((item) => ({
    month: item.month,
    receitas: item.income,
    despesas: item.expense,
  }))

  // Filtrar dados diários baseado no range de datas selecionado
  const filteredDailyData = dailyDataBackend.filter((item) => {
    if (!dateRange.from || !dateRange.to) return true
    const itemDate = new Date(item.date)
    return itemDate >= dateRange.from && itemDate <= dateRange.to
  })

  // Filtrar dados mensais para o gráfico de barras
  const filteredMonthlyData = monthlyDataBackend.filter((item, index) => {
    let monthsToShow = 12
    if (monthlyTimeRange === "6m") {
      monthsToShow = 6
    } else if (monthlyTimeRange === "3m") {
      monthsToShow = 3
    }
    return index >= monthlyDataBackend.length - monthsToShow
  })
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Overview</h1>
          <p className="text-muted-foreground">Track your financial performance</p>
        </div>
        <AddTransactionSheet 
          open={isAddTransactionOpen} 
          onOpenChange={setIsAddTransactionOpen}
        >
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Quick Create
          </Button>
        </AddTransactionSheet>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(data?.overview || []).map((item, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
                {overviewIconMap[item.title] ? (
                  React.createElement(overviewIconMap[item.title], { className: "h-5 w-5 text-muted-foreground" })
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className={`text-sm flex items-center ${
                  item.trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  {item.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {item.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Comparison Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle className="text-lg font-semibold">Comparação Diária</CardTitle>
              <CardDescription>
                Receitas e despesas diárias no período selecionado
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                     initialFocus
                     mode="range"
                     defaultMonth={dateRange.from}
                     selected={dateRange}
                     onSelect={handleDateRangeSelect}
                     numberOfMonths={2}
                   />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <AreaChart data={filteredDailyData}>
                <defs>
                  <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-receitas)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-receitas)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-despesas)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-despesas)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, '']}
                    />
                  }
                />
                <Area
                  dataKey="despesas"
                  type="natural"
                  fill="url(#fillDespesas)"
                  stroke="var(--color-despesas)"
                  stackId="a"
                />
                <Area
                  dataKey="receitas"
                  type="natural"
                  fill="url(#fillReceitas)"
                  stroke="var(--color-receitas)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">Breakdown por Categoria</CardTitle>
                <p className="text-sm text-muted-foreground">Visualize suas entradas e saídas</p>
              </div>
              <Select value={chartView} onValueChange={(value: "income" | "expense") => setChartView(value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
          <CardContent>
              <div className="relative h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartView === "income" ? incomeChartData : expenseChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="75%"
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {(chartView === "income" ? incomeChartData : expenseChartData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    {chartView === "income" ? "Total Entradas" : "Total Saídas"}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-center">
                    R$ {(chartView === "income" 
                      ? incomeChartData.reduce((sum, item) => sum + item.value, 0)
                      : expenseChartData.reduce((sum, item) => sum + item.value, 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(chartView === "income" ? incomeChartData : expenseChartData).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-muted-foreground truncate flex-1">{item.category}</span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      R$ {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="bg-primary text-primary-foreground">
                  Recent Transactions
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Past Performance
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Categories
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Recurring
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-2">
                <span>Description</span>
                <span>Type</span>
                <span>Status</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Category</span>
              </div>
              
              {/* Transaction Rows */}
              {(data?.recentTransactions ?? []).map((transaction: any) => {
                const isBackend = typeof transaction.amount === 'number'
                const normalizedStatus: 'completed' | 'pending' | 'failed' = isBackend ? transaction.status : (transaction.status.toLowerCase() as 'completed' | 'pending' | 'failed')
                const color = normalizedStatus === 'pending' ? 'warning' : (transaction.type === 'income' || transaction.type === 'Income' ? 'success' : 'destructive')
                const statusLabel = normalizedStatus === 'completed' ? 'Completed' : normalizedStatus === 'pending' ? 'Pending' : 'Failed'
                const amountStr = isBackend ? `${(transaction.type === 'income') ? '+' : ''}R$ ${Number(transaction.amount).toLocaleString()}` : transaction.amount
                const dateStr = isBackend ? format(new Date(transaction.date), 'MMM dd', { locale: ptBR }) : transaction.date
                const typeLabel = isBackend ? (transaction.type === 'income' ? 'Income' : 'Expense') : transaction.type
                return (
                  <div key={transaction.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        color === 'success' ? 'bg-success' :
                        color === 'destructive' ? 'bg-destructive' :
                        'bg-warning'
                      }`} />
                      <span className="font-medium text-foreground">{transaction.description}</span>
                    </div>
                    <span className="text-muted-foreground">{typeLabel}</span>
                    <div className="flex items-center gap-1">
                      {normalizedStatus === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : normalizedStatus === 'pending' ? (
                        <Clock className="h-4 w-4 text-warning" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-sm ${
                        normalizedStatus === 'completed' ? 'text-success' :
                        normalizedStatus === 'pending' ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <span className={`font-semibold ${
                      color === 'success' ? 'text-success' : 'text-destructive'
                    }`}>
                      {amountStr}
                    </span>
                    <span className="text-muted-foreground">{dateStr}</span>
                    <span className="text-muted-foreground">{transaction.category}</span>
                  </div>
                )
              })}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <AddTransactionSheet>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </AddTransactionSheet>
            </div>
          </CardContent>
        </Card>

        {/* Entradas e Saídas Mensais */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">Entradas e Saídas Mensais</CardTitle>
              <p className="text-sm text-muted-foreground">Visualize o fluxo de caixa mensal</p>
            </div>
            <Select value={monthlyTimeRange} onValueChange={setMonthlyTimeRange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <BarChart data={filteredMonthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, '']}
                    />
                  }
                />
                <Bar
                  dataKey="receitas"
                  fill="var(--color-receitas)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  fill="var(--color-despesas)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            
            {/* Summary */}
            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>
                  R$ {filteredMonthlyData.reduce((sum, item) => sum + item.receitas, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-lg font-bold" style={{ color: '#84cc16' }}>
                  R$ {filteredMonthlyData.reduce((sum, item) => sum + item.despesas, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metas de Gastos */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Metas de Gastos</CardTitle>
            <p className="text-sm text-muted-foreground">Defina limites de gastos por categoria e acompanhe seu progresso</p>
          </div>
          <AddSpendingGoalSheet>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Meta
            </Button>
          </AddSpendingGoalSheet>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando metas...</p>
            </div>
          ) : goals.error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Erro ao carregar metas</p>
            </div>
          ) : goalsData?.spendingGoals && goalsData.spendingGoals.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {goalsData.spendingGoals.map((goal) => {
                  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                  const isOverLimit = goal.currentAmount > goal.targetAmount;
                  
                  return (
                    <div key={goal.id} className="space-y-3 p-4 rounded-lg border border-border bg-card/50 w-64 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{goal.category}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Gasto</span>
                          <span className={`font-semibold ${
                            isOverLimit ? 'text-destructive' : 'text-foreground'
                          }`}>
                            R$ {goal.currentAmount.toLocaleString()}
                          </span>
                        </div>
                        
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 ${
                            isOverLimit ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'
                          }`}
                        />
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Limite: R$ {goal.targetAmount.toLocaleString()}</span>
                          <span className={`font-medium ${
                            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                      
                      {isOverLimit && (
                        <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 p-2 rounded">
                          <AlertCircle className="h-3 w-3" />
                          <span>Excedido em R$ {(goal.currentAmount - goal.targetAmount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total gasto este mês</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {goalsData.spendingGoals.reduce((total, goal) => total + goal.currentAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma meta de gasto encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">Adicione uma meta para começar a acompanhar seus gastos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Flutuante */}
      {!isAddTransactionOpen && (
        <Button
          onClick={() => setIsAddTransactionOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;