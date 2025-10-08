import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Target, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateGoalSheetProps {
  children: React.ReactNode
  onCreateGoal: (goalData: {
    name: string
    target_value: number
    description?: string
    target_date?: string
  }) => void
}

export function CreateGoalSheet({ children, onCreateGoal }: CreateGoalSheetProps) {
  const [name, setName] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except dots and commas
    const numericValue = value.replace(/[^\d,]/g, '')
    
    // Convert to number for validation
    const numberValue = parseFloat(numericValue.replace(',', '.'))
    
    if (!isNaN(numberValue)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numberValue)
    }
    
    return value
  }

  const handleTargetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Remove currency formatting for input
    const numericValue = value.replace(/[^\d,]/g, '')
    setTargetValue(numericValue)
  }

  const handleSave = () => {
    if (!name.trim() || !targetValue.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome da meta e valor alvo são obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Convert target value to number
    const targetValueNumber = parseFloat(targetValue.replace(',', '.'))
    
    if (targetValueNumber <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da meta deve ser maior que zero",
        variant: "destructive"
      })
      return
    }

    // Create the goal
    onCreateGoal({
      name: name.trim(),
      target_value: targetValueNumber,
      description: description.trim() || undefined,
      target_date: targetDate || undefined
    })
    
    toast({
      title: "Meta criada!",
      description: `Meta "${name}" criada com sucesso`,
    })

    // Reset form
    setName("")
    setTargetValue("")
    setDescription("")
    setTargetDate("")
    setIsOpen(false)
  }

  const resetForm = () => {
    setName("")
    setTargetValue("")
    setDescription("")
    setTargetDate("")
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Criar Nova Meta
          </SheetTitle>
          <SheetDescription>
            Defina seus objetivos financeiros e acompanhe seu progresso ao longo do tempo.
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-4">
          {/* Goal Name */}
          <div className="grid gap-2">
            <Label htmlFor="goal-name">Nome da Meta *</Label>
            <Input
              id="goal-name"
              placeholder="Ex: Viagem para Europa, Carro novo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Target Value */}
          <div className="grid gap-2">
            <Label htmlFor="target-value">Valor Alvo *</Label>
            <div className="relative">
              <Input
                id="target-value"
                placeholder="R$ 0"
                value={targetValue ? formatCurrency(targetValue) : ""}
                onChange={handleTargetValueChange}
                className="bg-input border-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite apenas números. Ex: 15000 para R$ 15.000
            </p>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea 
              id="description"
              placeholder="Descreva sua meta e porque ela é importante para você..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] bg-input border-border resize-none"
            />
          </div>

          {/* Target Date */}
          <div className="grid gap-2">
            <Label htmlFor="target-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data Limite (opcional)
            </Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Preview */}
          {name && targetValue && (
            <div className="bg-secondary/50 p-4 rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-2">Preview da Meta</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-accent">
                    {formatCurrency(targetValue)}
                  </span>
                </div>
                {targetDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium text-foreground">
                      {new Date(targetDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Cancelar</Button>
          </SheetClose>
          <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Criar Meta
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}