import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, MessageCircle, RefreshCcw, ShieldCheck, Trash2, X } from "lucide-react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WhatsappAccount, whatsappApi } from "@/services/whatsappApi";

type VerifyState = "idle" | "sending" | "sent" | "verifying" | "success" | "invalid";

interface ApiErrorBody {
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
}

export function WhatsAppIntegrationCard() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneMasked, setPhoneMasked] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const verifiedAccount = useMemo(() => accounts.find((account) => account.status === "verified"), [accounts]);
  const pendingAccount = useMemo(() => accounts.find((account) => account.status === "pending"), [accounts]);

  useEffect(() => {
    void loadAccounts();
  }, []);

  useEffect(() => {
    if (!dialogOpen || retryAfter <= 0) return;

    const timer = window.setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dialogOpen, retryAfter]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      setAccounts(await whatsappApi.listAccounts());
    } catch {
      toast({
        title: "WhatsApp indisponivel",
        description: "Nao foi possivel carregar o status da integracao.",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function requestCode(isResend = false) {
    if (!phone.trim()) {
      toast({
        title: "Informe o WhatsApp",
        description: "Digite o numero com DDD antes de solicitar o codigo.",
        variant: "destructive",
      });
      return;
    }

    setState("sending");
    setOtp("");
    setRemainingAttempts(null);

    try {
      const result = await whatsappApi.requestVerification(phone);
      setPhoneMasked(result.phoneMasked);
      setRetryAfter(result.retryAfterSeconds);
      setDialogOpen(true);
      setState("sent");
      void loadAccounts();
      toast({
        title: isResend ? "Codigo reenviado" : "Codigo enviado",
        description: `Enviamos um codigo para ${result.phoneMasked}.`,
      });
    } catch (error) {
      const body = getApiError(error);
      if (body.retryAfterSeconds) {
        setRetryAfter(body.retryAfterSeconds);
        setDialogOpen(true);
      }
      setState("idle");
      toast({
        title: "Nao foi possivel enviar",
        description: body.error || "Revise o numero e tente novamente.",
        variant: "destructive",
      });
    }
  }

  async function confirmCode(codeToConfirm = otp) {
    if (codeToConfirm.length !== 6) return;

    setState("verifying");
    try {
      const result = await whatsappApi.confirmVerification(phone, codeToConfirm);
      setPhoneMasked(result.phoneMasked);
      setState("success");
      setRemainingAttempts(null);
      await loadAccounts();
      toast({
        title: "WhatsApp conectado",
        description: `${result.phoneMasked} foi verificado com sucesso.`,
      });
      window.setTimeout(() => setDialogOpen(false), 900);
    } catch (error) {
      const body = getApiError(error);
      setState("invalid");
      setOtp("");
      setRemainingAttempts(typeof body.remainingAttempts === "number" ? body.remainingAttempts : null);
      toast({
        title: "Codigo nao validado",
        description: body.error || "Confira o codigo recebido e tente novamente.",
        variant: "destructive",
      });
      window.setTimeout(() => setState("sent"), 900);
    }
  }

  async function revoke(accountId: number) {
    try {
      await whatsappApi.revokeAccount(accountId);
      setAccounts((current) => current.filter((account) => account.id !== accountId));
      toast({
        title: "WhatsApp removido",
        description: "O numero foi desvinculado da sua conta.",
      });
    } catch {
      toast({
        title: "Nao foi possivel remover",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  }

  function handleOtpChange(value: string) {
    setOtp(value);
    if (value.length === 6) {
      void confirmCode(value);
    }
  }

  function cancelOtpOperation() {
    if (state === "verifying" || state === "success") return;

    setDialogOpen(false);
    setOtp("");
    setRemainingAttempts(null);
    setState("idle");
  }

  return (
    <>
      <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-start md:justify-between md:p-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">WhatsApp</h2>
                <p className="text-sm text-muted-foreground">Use seu numero para autorizar recursos do Fynx no WhatsApp.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {loadingAccounts ? (
                <Badge variant="outline" className="border-border text-muted-foreground">
                  Verificando status
                </Badge>
              ) : verifiedAccount ? (
                <Badge className="bg-success text-success-foreground">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Conectado
                </Badge>
              ) : pendingAccount ? (
                <Badge variant="secondary">Verificacao pendente</Badge>
              ) : (
                <Badge variant="outline" className="border-border text-muted-foreground">
                  Nao conectado
                </Badge>
              )}
              {(verifiedAccount || pendingAccount) && (
                <span className="text-sm text-muted-foreground">
                  {(verifiedAccount || pendingAccount)?.phoneMasked}
                </span>
              )}
            </div>
          </div>

          {verifiedAccount ? (
            <Button variant="outline" className="gap-2" onClick={() => void revoke(verifiedAccount.id)}>
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          ) : null}
        </div>

        {!verifiedAccount && (
          <div className="border-t border-border p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone">Numero do WhatsApp</Label>
                <Input
                  id="whatsapp-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <Button className="gap-2" onClick={() => void requestCode(false)} disabled={state === "sending"}>
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Enviar codigo
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (open) setDialogOpen(true);
      }}>
        <DialogContent
          className="overflow-hidden sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <AnimatedDialogBorder state={state} />
          <DialogHeader>
            <DialogTitle>Codigo de verificacao</DialogTitle>
            <DialogDescription>
              Digite o codigo de 6 digitos enviado para {phoneMasked || "seu WhatsApp"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={state === "verifying" || state === "success"}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="h-12 w-11 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="min-h-6 text-center text-sm">
              {state === "verifying" && <span className="text-muted-foreground">Validando codigo...</span>}
              {state === "success" && (
                <span className="inline-flex items-center gap-2 text-success">
                  <Check className="h-4 w-4" />
                  Numero verificado
                </span>
              )}
              {state === "invalid" && (
                <span className="inline-flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  Codigo invalido
                </span>
              )}
              {remainingAttempts !== null && state === "sent" && (
                <span className="text-muted-foreground">{remainingAttempts} tentativas restantes</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {retryAfter > 0 ? `Reenvio liberado em ${retryAfter}s` : "Pode reenviar o codigo agora"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void requestCode(true)}
                disabled={retryAfter > 0 || state === "sending" || state === "verifying" || state === "success"}
              >
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Reenviar
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={cancelOtpOperation}
                disabled={state === "verifying" || state === "success"}
              >
                Cancelar operação
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AnimatedDialogBorder({ state }: { state: VerifyState }) {
  const isSuccess = state === "success";
  const isInvalid = state === "invalid";
  const active = isSuccess || isInvalid;

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-lg border-2 opacity-0",
        isSuccess && "border-success",
        isInvalid && "border-destructive",
      )}
      initial={false}
      animate={
        active
          ? {
              opacity: [0, 1, 1, 0],
              clipPath: [
                "inset(0 100% 100% 0)",
                "inset(0 0 100% 0)",
                "inset(0 0 0 0)",
                "inset(0 0 0 0)",
              ],
            }
          : { opacity: 0, clipPath: "inset(0 100% 100% 0)" }
      }
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

function getApiError(error: unknown): ApiErrorBody {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined) ?? {};
  }
  return {};
}
