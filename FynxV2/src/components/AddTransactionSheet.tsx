import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAddTransaction } from "@/hooks/useDashboard"
import { useUpdateGoalProgressByTransaction } from "@/hooks/useGoals"

interface AddTransactionSheetProps {
  children: React.ReactNode;
  goalId?: string;
  goalName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories = [
  "Salary", "Freelance", "Investment", "Business", "Gift", "Other Income",
  "Housing", "Food", "Transportation", "Healthcare", "Entertainment", 
  "Shopping", "Bills", "Education", "Travel", "Other Expense"
]

const goals = [
  "Emergency Fund", "Vacation", "Car", "House", "Investment", "Other"
]

export function AddTransactionSheet({ children, goalId, goalName, open, onOpenChange }: AddTransactionSheetProps) {
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [relatedGoal, setRelatedGoal] = useState("")
  const [hasGoal, setHasGoal] = useState(false)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const { toast } = useToast()
  const addTransaction = useAddTransaction()
  const updateGoalProgressByTransaction = useUpdateGoalProgressByTransaction()

  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        })
        return
      }
      setAttachedImage(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    const input = document.getElementById('image-upload') as HTMLInputElement
    if (input) input.value = ''
  }

  const handleSave = () => {
    // For goal contributions, set defaults
    const transactionType = goalId ? "income" : type
    const transactionCategory = goalId ? "goal-contribution" : category
    const transactionDescription = description || (goalId ? `Aporte para meta: ${goalName}` : "")

    if (!transactionDescription || !transactionType || !amount || !transactionCategory) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Submit to backend
    const payload = {
      description: transactionDescription,
      type: transactionType as 'income' | 'expense',
      status: 'completed' as const,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      category: transactionCategory,
    }
    addTransaction.mutate(payload, {
      onSuccess: () => {
        const isGoalContribution = !!goalId
        const successMessage = isGoalContribution 
          ? `Aporte de R$ ${amount} adicionado à meta "${goalName}"`
          : `${transactionType === 'income' ? 'Entrada' : 'Saída'} de R$ ${amount} foi adicionada com sucesso`
        toast({
          title: isGoalContribution ? "Aporte realizado!" : "Transação adicionada",
          description: successMessage,
        })

        // If goal contribution, update progress in backend
        if (goalId) {
          updateGoalProgressByTransaction.mutate({
            id: goalId,
            amount: parseFloat(amount),
            transactionType: 'income',
          })
        }

        // Reset form
        setDescription("")
        setType("")
        setAmount("")
        setCategory("")
        setIsRecurring(false)
        setRelatedGoal("")
        setHasGoal(false)
        setAttachedImage(null)
        setIsOpen(false)
      },
      onError: () => {
        toast({
          title: "Erro ao adicionar",
          description: "Não foi possível salvar a transação",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {goalId ? `Adicionar Fundos - ${goalName}` : "Adicionar Transação"}
          </SheetTitle>
          <SheetDescription>
            {goalId 
              ? `Adicione fundos à sua meta "${goalName}". O valor será registrado como uma transação de entrada.`
              : "Preencha os dados da nova transação. Todos os campos marcados são obrigatórios."
            }
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-4">
          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea 
              id="description"
              placeholder={goalId 
                ? `Aporte para meta: ${goalName}` 
                : "Ex: Salário mensal, Compra supermercado..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Type - Hide if it's a goal contribution */}
          {!goalId && (
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show goal info if it's a goal contribution */}
          {goalId && (
            <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4 text-accent" />
                <span className="text-foreground">
                  Contribuindo para: <strong className="text-accent">{goalName}</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este valor será adicionado automaticamente ao progresso da sua meta
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {goalId && <SelectItem value="goal-contribution">Aporte para Meta</SelectItem>}
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring" className="text-sm font-medium">
              Transação recorrente
            </Label>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          {isRecurring && (
            <p className="text-sm text-muted-foreground">
              Esta transação será repetida automaticamente todo mês
            </p>
          )}

          {/* Goal Related */}
          <div className="flex items-center justify-between">
            <Label htmlFor="has-goal" className="text-sm font-medium">
              Relacionado a uma meta
            </Label>
            <Switch
              id="has-goal"
              checked={hasGoal}
              onCheckedChange={setHasGoal}
            />
          </div>

          {hasGoal && (
            <div className="grid gap-2">
              <Label htmlFor="goal">Meta</Label>
              <Select value={relatedGoal} onValueChange={setRelatedGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a meta" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal} value={goal.toLowerCase()}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Image Upload */}
          <div className="grid gap-2">
            <Label htmlFor="image-upload">Anexar Imagem (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {attachedImage ? 'Alterar Imagem' : 'Escolher Imagem'}
              </Button>
              {attachedImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {attachedImage && (
              <p className="text-sm text-muted-foreground">
                Arquivo: {attachedImage.name} ({(attachedImage.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Cancelar</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={addTransaction.isPending} className={goalId ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}>
            {addTransaction.isPending ? "Salvando..." : goalId ? "Adicionar Aporte" : "Salvar Transação"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}