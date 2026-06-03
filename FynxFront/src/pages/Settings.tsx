import { Settings as SettingsIcon } from "lucide-react";
import { WhatsAppIntegrationCard } from "@/components/settings/WhatsAppIntegrationCard";

export default function Settings() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">Configuracoes</h1>
            <p className="text-sm text-muted-foreground">Gerencie conexoes e preferencias da sua conta Fynx.</p>
          </div>
        </div>
      </header>

      <WhatsAppIntegrationCard />
    </div>
  );
}
