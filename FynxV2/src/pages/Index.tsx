import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AddTransactionSheet } from "@/components/AddTransactionSheet"
import { useList } from "@refinedev/core"
import { useDashboard, useDeleteTransaction, useTransactionHistory } from "@/hooks/useDashboard"
import { AddSpendingGoalSheet } from "@/components/AddSpendingGoalSheet"
import { 
  Eye, TrendingUp, TrendingDown, Users, 
  ArrowUpRight, ArrowDownRight, Plus, 
  MoreHorizontal, CheckCircle, Clock, AlertCircle, CalendarIcon, Trash2 
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
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardData } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/apiClient"
import { useQueryClient } from "@tanstack/react-query"
import { List as VirtualList } from "react-window"
import { X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

// Map overview titles to icons from lucide-react
const overviewIconMap: Record<string, React.ComponentType<any>> = {
  "Total Balance": Eye,
  "Monthly Balance": Eye,
  "Monthly Income": TrendingUp,
  "Total Income": TrendingUp,
  "Monthly Expenses": TrendingDown,
  "Total Expense": TrendingDown,
  "Total Expenses": TrendingDown,
  "Savings Rate": Users,
  "Saving Rate": Users,
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
  const { data: dashboardData } = useDashboard()
  const { data: transactionHistory } = useTransactionHistory()
  const { data: goalsData, isLoading: goalsLoading, error: goalsError } = useList({
    resource: "goals/spending-goals",
  })
  const data = dashboardData as DashboardData
  const { toast } = useToast()
  const { mutate: deleteTransaction } = useDeleteTransaction()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deleteTargetId, setDeleteTargetId] = React.useState<number | string | null>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isExpandedOpen, setIsExpandedOpen] = React.useState(() => {
    const fromListFlag = searchParams.has("ListTransaction")
    const fromModal = searchParams.get("modal") === "transactions"
    return fromListFlag || fromModal
  })
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortField, setSortField] = React.useState<"date" | "type" | "category">("date")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = React.useState<"all" | "income" | "expense">("all")
  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const [listHeight, setListHeight] = React.useState(500)
  const [listWidth, setListWidth] = React.useState<number>(900)

  const recentTransactionsSorted = React.useMemo(() => {
    const arr = data?.recentTransactions ?? []
    return [...arr].sort((a: any, b: any) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      if (timeB !== timeA) return timeB - timeA
      const idA = Number(a.id) || 0
      const idB = Number(b.id) || 0
      return idB - idA
    })
  }, [data?.recentTransactions])

  const availableCategories = React.useMemo(() => {
    const arr = transactionHistory ?? []
    const set = new Set<string>()
    for (const t of arr) {
      if (t.category) set.add(t.category)
    }
    return Array.from(set)
  }, [transactionHistory])

  const expandedTransactions = React.useMemo(() => {
    let arr = transactionHistory ?? []
    if (filterType !== "all") arr = arr.filter((t) => t.type === filterType)
    if (filterCategory !== "all") arr = arr.filter((t) => t.category === filterCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      arr = arr.filter((t) =>
        (t.description?.toLowerCase().includes(q)) ||
        (t.category?.toLowerCase().includes(q)) ||
        (new Date(t.date).toLocaleDateString("pt-BR").toLowerCase().includes(q)) ||
        String(t.amount).toLowerCase().includes(q)
      )
    }
    const sorted = [...arr].sort((a, b) => {
      if (sortField === "date") {
        const ta = new Date(a.date).getTime()
        const tb = new Date(b.date).getTime()
        return sortOrder === "asc" ? ta - tb : tb - ta
      }
      if (sortField === "type") {
        const pa = a.type === "income" ? 1 : 2
        const pb = b.type === "income" ? 1 : 2
        return sortOrder === "asc" ? pa - pb : pb - pa
      }
      if (sortField === "category") {
        const ca = (a.category || "").localeCompare(b.category || "")
        return sortOrder === "asc" ? ca : -ca
      }
      return 0
    })
    return sorted
  }, [transactionHistory, filterType, filterCategory, searchQuery, sortField, sortOrder])

  const clearFilters = () => {
    setSearchQuery("")
    setSortField("date")
    setSortOrder("desc")
    setFilterType("all")
    setFilterCategory("all")
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = React.useMemo(() => {
    const arr = expandedTransactions
    if (arr.length === 0) return false
    return arr.every((t: any) => selectedIds.has(Number(t.id)))
  }, [expandedTransactions, selectedIds])

  const selectAllFiltered = () => {
    const allIds = expandedTransactions.map((t: any) => Number(t.id))
    setSelectedIds(new Set(allIds))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const toggleSelectAll = () => {
    if (allSelected) clearSelection()
    else selectAllFiltered()
  }

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const body = {
        userId: 1,
        operation: "delete",
        transactionIds: Array.from(selectedIds),
      }
      const res = await api.post<{ successCount: number; failedCount: number; errors?: string[] }>("/transactions/bulk", body)
      toast({ title: "Exclusão em lote", description: `${res.successCount} removidas, ${res.failedCount} falhas.` })
      setIsBulkDeleteDialogOpen(false)
      setSelectedIds(new Set())
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      await queryClient.invalidateQueries({ queryKey: ["transactions"] })
    } catch (e: any) {
      toast({ title: "Erro ao excluir em lote", description: e.message, variant: "destructive" })
      setIsBulkDeleteDialogOpen(false)
    }
  }

  React.useEffect(() => {
    const h = Math.ceil(window.innerHeight * 0.6)
    setListHeight(Math.min(h, 700))
    const w = Math.min(960, window.innerWidth - 80)
    setListWidth(w)
  }, [])

  React.useEffect(() => {
    const modal = searchParams.get("modal")
    const listFlag = searchParams.has("ListTransaction")
    if (modal === "transactions" || listFlag) {
      setIsExpandedOpen(true)
    }
    const sq = searchParams.get("search")
    const sf = (searchParams.get("sort") as "date" | "type" | "category") || undefined
    const so = (searchParams.get("order") as "asc" | "desc") || undefined
    const ft = (searchParams.get("type") as "all" | "income" | "expense") || undefined
    const fc = searchParams.get("category") || undefined
    if (sq !== null) setSearchQuery(sq)
    if (sf) setSortField(sf)
    if (so) setSortOrder(so)
    if (ft) setFilterType(ft)
    if (fc) setFilterCategory(fc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!isExpandedOpen) return
    // Manter a URL limpa: apenas ?ListTransaction
    navigate(`${window.location.pathname}?ListTransaction`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpandedOpen])

  const handleExpandedOpenChange = (open: boolean) => {
    setIsExpandedOpen(open)
    if (open) {
      navigate(`${window.location.pathname}?ListTransaction`, { replace: true })
    } else {
      clearSelection()
      navigate(`${window.location.pathname}`, { replace: true })
    }
  }

  const handleDelete = (id: number | string) => {
    setDeleteTargetId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteTransaction(deleteTargetId, {
      onSuccess: () => {
        toast({ title: "Transação removida", description: "A transação foi removida com sucesso." })
      },
      onError: () => {
        toast({ title: "Erro ao remover", description: "Não foi possível remover a transação.", variant: "destructive" })
      },
      onSettled: () => {
        setIsDeleteDialogOpen(false)
        setDeleteTargetId(null)
      },
    })
  }
  
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
      <div className="flex items-center justify-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Overview</h1>
          <p className="text-muted-foreground">Track your financial performance</p>
        </div>
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

        {/* Confirmação de Exclusão */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open)
            if (!open) setDeleteTargetId(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir transação</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Tem certeza que deseja excluir?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-2">
                <span>Description</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Category</span>
                <span>Ações</span>
              </div>
              
              {/* Transaction Rows */}
              {recentTransactionsSorted.map((transaction: any) => {
                const isBackend = typeof transaction.amount === 'number'
                const color = (transaction.type === 'income' || transaction.type === 'Income') ? 'success' : 'destructive'
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
                    <span className={`font-semibold ${
                      color === 'success' ? 'text-success' : 'text-destructive'
                    }`}>
                      {amountStr}
                    </span>
                    <span className="text-muted-foreground">{dateStr}</span>
                    <span className="text-muted-foreground">{transaction.category}</span>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(transaction.id)}
                        aria-label="Remover transação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setIsExpandedOpen(true)}>
                Ver mais transações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal Expandido - Recent Transactions */}
        <Dialog open={isExpandedOpen} onOpenChange={handleExpandedOpenChange}>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader className="flex items-center">
              <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">Transação</DialogTitle>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Fechar"
                className="absolute right-4 top-4 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            <div className="flex flex-col gap-4">
              {/* Controles de busca, ordenação e filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Buscar por descrição, categoria, data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={sortField} onValueChange={(v) => setSortField(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="type">Tipo</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Entrada</SelectItem>
                    <SelectItem value="expense">Saída</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ações de filtros e seleção */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
                  <Button variant="outline" onClick={toggleSelectAll}>
                    {allSelected ? "Limpar seleção" : "Selecionar todos (filtrados)"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleBulkDeleteClick}
                    disabled={selectedIds.size === 0}
                  >
                    Excluir selecionadas ({selectedIds.size})
                  </Button>
                </div>
              </div>

              {/* Lista expandida de transações */}
              <div className="space-y-2 overflow-x-auto">
                <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground pb-2 min-w-[900px]">
                  <span>Selecionar</span>
                  <span>Description</span>
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Date</span>
                  <span>Category</span>
                  <span>Ações</span>
                </div>
                <div className="min-w-[900px]">
                  <VirtualList
                    className="divide-y divide-border"
                    style={{ height: listHeight }}
                    rowCount={expandedTransactions.length}
                    rowHeight={64}
                    overscanCount={8}
                    rowProps={{ items: expandedTransactions, selectedIds, toggleSelect, handleDelete }}
                    rowComponent={({ index, style, ariaAttributes, ...rowProps }) => {
                      const { items, selectedIds, toggleSelect, handleDelete } = rowProps as any
                      const transaction = items[index]
                      const color = transaction.type === 'income' ? 'success' : 'destructive'
                      const amountStr = `${transaction.type === 'income' ? '+' : ''}R$ ${Number(transaction.amount).toLocaleString()}`
                      const dateStr = format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })
                      const typeLabel = transaction.type === 'income' ? 'Income' : 'Expense'
                      const checked = selectedIds.has(Number(transaction.id))
                      return (
                        <div style={style} {...ariaAttributes} className="grid grid-cols-7 gap-4 items-center px-2 min-w-[900px]">
                          <div className="flex items-center">
                            <Checkbox checked={checked} onCheckedChange={() => toggleSelect(Number(transaction.id))} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color === 'success' ? 'bg-success' : 'bg-destructive'}`} />
                            <span className="font-medium text-foreground">{transaction.description}</span>
                          </div>
                          <span className="text-muted-foreground">{typeLabel}</span>
                          <span className={`font-semibold ${color === 'success' ? 'text-success' : 'text-destructive'}`}>{amountStr}</span>
                          <span className="text-muted-foreground">{dateStr}</span>
                          <span className="text-muted-foreground">{transaction.category}</span>
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(transaction.id)}
                              aria-label="Remover transação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmação de Exclusão em Lote */}
        <AlertDialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={(open) => setIsBulkDeleteDialogOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir transações selecionadas</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá {selectedIds.size} transações. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
          {goalsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando metas...</p>
            </div>
          ) : goalsError ? (
            <div className="text-center py-8">
              <p className="text-destructive">Erro ao carregar metas</p>
            </div>
          ) : goalsData?.data && goalsData.data.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {goalsData.data.map((goal) => {
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
                    R$ {goalsData.data.reduce((total, goal) => total + goal.currentAmount, 0).toLocaleString()}
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

      {/* Botão Flutuante - Add Transaction (expansão dinâmica) */}
      <AddTransactionSheet open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <Button
          className="group fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full group-hover:rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out flex items-center justify-center hover:w-[200px]"
          aria-label="Adicionar Transação"
        >
          {/* Ícone + central no estado compacto; desloca para a esquerda quando expande */}
          <Plus
            className="h-6 w-6 text-white transition-all duration-300 ease-out group-hover:mr-2"
          />

          {/* Texto que aparece no hover */}
          <span
            className="text-sm font-medium whitespace-nowrap opacity-0 max-w-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:max-w-[150px]"
          >
            Adicionar Transação
          </span>
        </Button>
      </AddTransactionSheet>
    </div>
  );
};

export default Index;