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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import {
  useCreate,
  useInvalidate,
  useList,
} from "@refinedev/core"

interface AddTransactionSheetProps {
  children: React.ReactNode;
  goalId?: string;
  goalName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const transactionFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
  type: z.enum(["income", "expense"], {
    required_error: "O tipo da transação é obrigatório",
  }),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  isRecurring: z.boolean().default(false),
  spendingLimitId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const categories = {
  income: [
    "Salary",
    "Freelance",
    "Investment",
    "Business",
    "Gift",
    "Other Income",
  ],
  expense: [
    "Housing",
    "Food",
    "Transportation",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Bills",
    "Education",
    "Travel",
    "Other Expense",
  ],
};

export function AddTransactionSheet({
  children,
  open,
  onOpenChange,
}: AddTransactionSheetProps) {
  const { toast } = useToast();
  const invalidate = useInvalidate();
  const [linkToSpendingLimit, setLinkToSpendingLimit] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      isRecurring: false,
      date: new Date().toISOString().split('T')[0], // Data de hoje no formato YYYY-MM-DD
    },
  });

  const transactionType = form.watch("type");

  const { mutate: createTransaction, isLoading } = useCreate({
    resource: "transactions",
  });

  const { data: spendingLimits } = useList({
    resource: "spending-limits",
    queryOptions: {
      enabled: transactionType === "expense" && linkToSpendingLimit,
    },
  });

  const onSubmit = (values: TransactionFormValues) => {
    createTransaction(
      {
        values,
      },
      {
        onSuccess: () => {
          toast({
            title: "Transação adicionada",
            description: "Sua transação foi adicionada com sucesso.",
          });
          form.reset();
          onOpenChange?.(false);
          
          // Invalidar cache do dashboard e transações
          invalidate({
            invalidates: ["list"],
            resource: "dashboard",
          });
          invalidate({
            invalidates: ["list"],
            resource: "transactions",
          });
          invalidate({
            invalidates: ["list"],
            resource: "overview",
          });

          // Garantir refetch das queries do React Query usadas no dashboard
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
        onError: (error) => {
          toast({
            title: "Erro ao adicionar transação",
            description: "Ocorreu um erro ao tentar adicionar a transação.",
            variant: "destructive",
          });
          console.error("Erro ao criar transação:", error);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Transação
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salário, Supermercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Entrada</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Saída</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactionType &&
                        categories[transactionType].map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Transação Recorrente</FormLabel>
                    <FormDescription>
                      Esta transação se repetirá mensalmente.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {transactionType === "expense" && (
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Vincular a limite de gasto</FormLabel>
                </div>
                <Switch
                  checked={linkToSpendingLimit}
                  onCheckedChange={setLinkToSpendingLimit}
                />
              </div>
            )}

            {transactionType === "expense" && linkToSpendingLimit && (
              <FormField
                control={form.control}
                name="spendingLimitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Gasto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um limite" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {spendingLimits?.data?.map((limit) => (
                          <SelectItem key={limit.id} value={String(limit.id)}>
                            {limit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Transação"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}