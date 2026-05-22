import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnchorContacts } from "@/hooks/useAnchorContacts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Anchor, Phone, MessageCircle, AlertTriangle, Settings } from "lucide-react";

function digits(p: string) {
  return p.replace(/\D/g, "");
}

export function PortoSeguroButton() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { primaryContact } = useAnchorContacts();

  const phone = primaryContact?.phone || "";
  const name = primaryContact?.name || "";

  const handleCall = () => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleWhatsapp = () => {
    if (phone) window.open(`https://wa.me/${digits(phone)}`, "_blank");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-card touch-target"
        aria-label="Contato Âncora"
      >
        <Anchor className="h-5 w-5" style={{ color: "hsl(155 47% 18%)" }} />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "hsl(155 47% 18% / 0.1)" }}>
              <Anchor className="h-7 w-7" style={{ color: "hsl(155 47% 18%)" }} />
            </div>
            <DialogTitle className="text-xl">Contato Âncora</DialogTitle>
            <DialogDescription>
              {name ? `Sua rede de apoio: ${name}` : "Sua rede de apoio a um toque"}
            </DialogDescription>
          </DialogHeader>

          {primaryContact ? (
            <div className="space-y-3 pt-2">
              <p className="text-center text-lg font-semibold">{name}</p>

              <Button
                size="lg"
                className="w-full h-14 text-base"
                style={{ background: "hsl(155 47% 18%)", color: "white" }}
                onClick={handleCall}
              >
                <Phone className="h-5 w-5 mr-2" />
                Ligar agora
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-base"
                onClick={handleWhatsapp}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Enviar mensagem
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-muted rounded-lg text-center">
                <AlertTriangle className="h-7 w-7 mx-auto text-warning mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Você ainda não cadastrou um contato âncora
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/app/ancora");
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar contato
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
