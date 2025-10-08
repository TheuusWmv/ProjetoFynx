import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AddSpendingGoalSheetProps {
  children: React.ReactNode
}

const categoryOptions = [
  { value: "transporte", label: "Transporte", icon: "🚗" },
  { value: "alimentacao", label: "Alimentação", icon: "🍔" },
  { value: "entretenimento", label: "Entretenimento", icon: "🎬" },
  { value: "compras", label: "Compras", icon: "🛍️" },
  { value: "saude", label: "Saúde", icon: "🏥" },
  { value: "educacao", label: "Educação", icon: "📚" },
  { value: "casa", label: "Casa", icon: "🏠" },
  { value: "viagem", label: "Viagem", icon: "✈️" },
  { value: "outros", label: "Outros", icon: "📦" },
]

export function AddSpendingGoalSheet({ children }: AddSpendingGoalSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState("")
  const [limit, setLimit] = React.useState("")
  const [description, setDescription] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category || !limit) {
      return
    }

    // Here you would typically save the spending goal
    console.log("Nova meta de gasto:", {
      category,
      limit: parseFloat(limit),
      description,
      currentSpent: 0,
    })

    // Reset form and close sheet
    setCategory("")
    setLimit("")
    setDescription("")
    setOpen(false)
  }

  const selectedCategory = categoryOptions.find(opt => opt.value === category)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Meta de Gasto</SheetTitle>
          <SheetDescription>
            Defina um limite de gasto para uma categoria específica
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite de Gasto (R$)</Label>
            <Input
              id="limit"
              type="number"
              placeholder="Ex: 500"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Uber, Gasolina, Estacionamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {selectedCategory && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{selectedCategory.icon}</span>
                <span className="font-medium">{selectedCategory.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Limite mensal: R$ {limit || "0"}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!category || !limit}
              className="flex-1"
            >
              Adicionar Meta
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}