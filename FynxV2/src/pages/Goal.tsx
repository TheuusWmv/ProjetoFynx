import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, TrendingUp } from "lucide-react"
import { CreateGoalSheet } from "@/components/CreateGoalSheet"
import { AddTransactionSheet } from "@/components/AddTransactionSheet"
import { useGoals, useCreateSpendingGoal } from "@/hooks/useGoals"
import { useToast } from "@/hooks/use-toast"

const Goals = () => {
  const { data, isLoading } = useGoals()
  const createGoal = useCreateSpendingGoal()
  const { toast } = useToast()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  const goals = useMemo(() => data?.spendingGoals ?? [], [data])

  const toggleGoalsState = () => {}

  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const addNewGoal = (goalData: { name: string; target_value: number; description?: string; target_date?: string }) => {
    const payload = {
      title: goalData.name,
      category: 'Outros',
      targetAmount: goalData.target_value,
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: goalData.target_date || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
      description: goalData.description,
    }
    createGoal.mutate(payload, {
      onSuccess: () => {
        toast({ title: 'Meta criada!', description: `Meta "${goalData.name}" criada com sucesso` })
      },
      onError: () => {
        toast({ title: 'Erro ao criar meta', description: 'Não foi possível criar a meta', variant: 'destructive' })
      }
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full animate-pulse" />
        <p className="text-muted-foreground">Carregando metas...</p>
      </div>
    )
  }

  // Empty state
  if (!goals || goals.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <Target className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Adicione sua primeira meta</h2>
          <p className="text-muted-foreground max-w-md">
            Defina seus objetivos financeiros e acompanhe seu progresso de forma visual e organizada.
          </p>
        </div>
        
        <CreateGoalSheet onCreateGoal={addNewGoal}>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-5 w-5 mr-2" />
            Criar Meta
          </Button>
        </CreateGoalSheet>
      </div>
    )
  }

  // Populated state with goals
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Metas</h1>
          <p className="text-muted-foreground">Acompanhe o progresso dos seus objetivos financeiros</p>
        </div>
        
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center justify-between">
                <span className="truncate">{goal.title}</span>
                <Target className="h-5 w-5 text-accent flex-shrink-0" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">
                    {calculateProgress(goal.currentAmount, goal.targetAmount)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(goal.currentAmount, goal.targetAmount)} 
                  className="h-2"
                />
              </div>

              {/* Values */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Atual</span>
                  <span className="font-semibold text-accent">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Meta</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-sm text-muted-foreground">Faltam</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(goal.targetAmount - goal.currentAmount)}
                  </span>
                </div>
              </div>

              {/* Add Funds Button */}
              <AddTransactionSheet goalId={goal.id} goalName={goal.title}>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fundos
                </Button>
              </AddTransactionSheet>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sheet control para adicionar transação */}
      <AddTransactionSheet open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <span className="hidden" />
      </AddTransactionSheet>

      {/* Floating Action Buttons */}
      {/* FAB: Nova Transação */}
      {!isAddTransactionOpen && (
        <Button
          size="lg"
          onClick={() => setIsAddTransactionOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* FAB: Criar Meta (reposicionado para não sobrepor) */}
      <CreateGoalSheet onCreateGoal={addNewGoal}>
        <Button
          size="lg"
          className="fixed bottom-6 right-24 h-14 w-14 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </CreateGoalSheet>
    </div>
  )
}

export default Goals