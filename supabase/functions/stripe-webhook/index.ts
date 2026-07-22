import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = "re_eLRc8cwT_HZYSsQonMX3K1U1LZ3kby9k4";
const ZAPI_URL = "https://api.z-api.io/instances/3F4251576B10F1BE557C9A7EE4F1867E/token/2D6CDE945D6DB4F275171067/send-text";
const ZAPI_CLIENT_TOKEN = "F2ca9adb207a14c09a1d0005e62825cb6S";
const ADMIN_EMAIL = "lucasmartinscosta20@gmail.com";
const ADMIN_PHONE = "5516993964385";
const FROM_EMAIL = "Saindo do Jogo <contato@apostandonavida.com.br>";

// Versao da API do Stripe fixada. Sem isso, a conta usa a versao padrao (Basil),
// onde current_period_end foi movido para dentro dos items e volta undefined.
const STRIPE_API_VERSION = "2023-10-16";

// Extrai a data de fim do periodo aceitando as duas formas da API (antiga e Basil).
// Retorna null em vez de estourar quando o campo nao existe.
function extrairFimDoPeriodo(sub: any): string | null {
  const raw = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end ?? null;
  if (!raw || typeof raw !== "number" || !isFinite(raw)) return null;
  const d = new Date(raw * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    const data = await res.json();
    console.log("Email sent:", to, res.status, JSON.stringify(data));
    return res.ok;
  } catch (e) {
    console.error("Email error:", e);
    return false;
  }
}

async function sendWhatsApp(phone: string, message: string) {
  try {
    let number = phone.replace(/\D/g, "");
    if (!number.startsWith("55")) number = "55" + number;
    const res = await fetch(ZAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone: number, message }),
    });
    const data = await res.json();
    console.log("WhatsApp sent:", number, JSON.stringify(data));
    return res.ok;
  } catch (e) {
    console.error("WhatsApp error:", e);
    return false;
  }
}

function emailBase(content: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
      <div style="background:#1B4332;padding:32px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold">Saindo do Jogo</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Plataforma de Recuperação de Ludopatia</p>
      </div>
      <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px">
        ${content}
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0">
        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0">
          Saindo do Jogo — Apostando na Vida · Clínica Terapêutica Sobriety Ltda · CNPJ 46.115.913/0001-54<br>
          <a href="mailto:contato@apostandonavida.com.br" style="color:#1B4332">contato@apostandonavida.com.br</a> · 
          <a href="https://app.apostandonavida.com.br" style="color:#1B4332">app.apostandonavida.com.br</a>
        </p>
      </div>
    </div>
  `;
}

// ── EMAILS DE TERAPIA ────────────────────────────────────────────────────────

function emailTerapiaUsuario(userName: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">Pagamento confirmado! ✅</h2>
    <p style="color:#374151">Olá, <strong>${userName}</strong>!</p>
    <p style="color:#374151">Seu pagamento foi processado com sucesso. Nossa equipe já foi notificada e entrará em contato <strong>em até 24 horas</strong> para confirmar data e horário da sua sessão.</p>
    
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">📋 O que acontece agora:</h3>
      <ol style="color:#374151;margin:0;padding-left:20px;line-height:2">
        <li>Nossa equipe revisará seu perfil no app</li>
        <li>Você receberá contato via WhatsApp e/ou email para confirmar o agendamento</li>
        <li>A sessão será realizada por videochamada no link que enviaremos</li>
      </ol>
    </div>

    <p style="color:#374151">Em caso de dúvidas, responda este email ou entre em contato pelo WhatsApp:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://wa.me/5516993964385" style="background:#25D366;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">💬 Falar no WhatsApp</a>
    </div>
    <p style="color:#6B7280;font-size:13px">Estamos aqui por você. Cada passo dessa jornada importa. 💚</p>
  `);
}

function emailTerapiaAdmin(userName: string, userEmail: string, userPhone: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">🧠 Nova sessão de terapia contratada!</h2>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">📋 Dados do cliente:</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Nome:</strong></td><td style="color:#1B4332;font-weight:bold">${userName}</td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Email:</strong></td><td><a href="mailto:${userEmail}" style="color:#1B4332">${userEmail}</a></td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>WhatsApp:</strong></td><td><a href="https://wa.me/${userPhone?.replace(/\D/g,"")}" style="color:#1B4332">${userPhone || "Não informado"}</a></td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Serviço:</strong></td><td style="color:#1B4332;font-weight:bold">Sessão de Terapia</td></tr>
      </table>
    </div>
    <p style="color:#374151"><strong>Ação necessária:</strong> Entre em contato com o cliente em até 24 horas para confirmar o agendamento.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://wa.me/${userPhone?.replace(/\D/g,"") || ""}" style="background:#25D366;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">💬 Contatar agora no WhatsApp</a>
    </div>
  `);
}

// ── EMAILS JURÍDICOS ─────────────────────────────────────────────────────────

function emailJuridicoUsuario(userName: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">Avaliação confirmada! ✅</h2>
    <p style="color:#374151">Olá, <strong>${userName}</strong>!</p>
    <p style="color:#374151">Seu pagamento foi confirmado. Nossa equipe entrará em contato <strong>em até 24 horas</strong> para agendar sua avaliação inicial com especialista.</p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">📋 O que incluirá sua avaliação:</h3>
      <ul style="color:#374151;margin:0;padding-left:20px;line-height:2">
        <li>Análise do seu caso e histórico</li>
        <li>Orientação sobre direitos do consumidor lesado por apostas</li>
        <li>Avaliação de possibilidades de ressarcimento de valores perdidos</li>
        <li>Direcionamento para as próximas etapas, se aplicável</li>
      </ul>
    </div>

    <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin:16px 0">
      <p style="color:#92400E;margin:0;font-size:14px">💡 <strong>Dica:</strong> Separe extratos bancários, comprovantes de depósito e histórico de transações com plataformas de apostas. Isso agilizará muito nossa análise.</p>
    </div>

    <p style="color:#374151">Dúvidas? Fale conosco:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://wa.me/5516993964385" style="background:#25D366;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">💬 Falar no WhatsApp</a>
    </div>
    <p style="color:#6B7280;font-size:13px">Você não está sozinho nessa. Estamos aqui para ajudar. 💚</p>
  `);
}

function emailJuridicoAdmin(userName: string, userEmail: string, userPhone: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">⚖️ Nova avaliação jurídica contratada!</h2>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">📋 Dados do cliente:</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Nome:</strong></td><td style="color:#1B4332;font-weight:bold">${userName}</td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Email:</strong></td><td><a href="mailto:${userEmail}" style="color:#1B4332">${userEmail}</a></td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>WhatsApp:</strong></td><td><a href="https://wa.me/${userPhone?.replace(/\D/g,"")}" style="color:#1B4332">${userPhone || "Não informado"}</a></td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px"><strong>Serviço:</strong></td><td style="color:#1B4332;font-weight:bold">Avaliação Jurídica Inicial</td></tr>
      </table>
    </div>
    <p style="color:#374151"><strong>Ação necessária:</strong> Entre em contato com o cliente em até 24 horas para agendar a avaliação.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://wa.me/${userPhone?.replace(/\D/g,"") || ""}" style="background:#25D366;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">💬 Contatar agora no WhatsApp</a>
    </div>
  `);
}

// ── EMAIL BOAS VINDAS (ASSINATURA) ───────────────────────────────────────────

function emailBoasVindas(userName: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">Bem-vindo ao Saindo do Jogo! 🎉</h2>
    <p style="color:#374151">Olá, <strong>${userName}</strong>!</p>
    <p style="color:#374151">Sua assinatura está ativa. Você agora tem acesso completo à plataforma de recuperação mais completa para dependência em apostas do Brasil.</p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">🚀 Por onde começar:</h3>
      <ol style="color:#374151;margin:0;padding-left:20px;line-height:2.2">
        <li><strong>Complete seu onboarding clínico</strong> — nos diga mais sobre você para personalizarmos sua jornada</li>
        <li><strong>Cadastre seu Contato Âncora</strong> — alguém de confiança que fará parte da sua recuperação</li>
        <li><strong>Inicie a Jornada dos 12 Passos</strong> — o caminho estruturado para a recuperação</li>
        <li><strong>Configure sua Rotina Inteligente</strong> — atividades diárias adaptadas ao seu nível</li>
      </ol>
    </div>

    <div style="text-align:center;margin:24px 0">
      <a href="https://app.apostandonavida.com.br" style="background:#1B4332;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Acessar o app →</a>
    </div>
    <p style="color:#374151">Dúvidas? Estamos aqui:</p>
    <p style="color:#374151"><a href="mailto:contato@apostandonavida.com.br" style="color:#1B4332">contato@apostandonavida.com.br</a> · <a href="https://wa.me/5516993964385" style="color:#1B4332">WhatsApp</a></p>
    <p style="color:#6B7280;font-size:13px">Você deu o primeiro passo. A jornada começa agora. 💚</p>
  `);
}

// ── WEBHOOK PRINCIPAL ────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const body = await req.text();
    const event = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log de entrada: sem isso ficamos no escuro quando algo nao acontece.
    console.log("Evento recebido:", event?.type, "| id:", event?.id);

    // ── CHECKOUT CONCLUÍDO ───────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerId = session.customer as string;
      const userId = (session.metadata?.user_id as string) || (session.client_reference_id as string) || null;
      const priceId = (session.metadata?.price_id as string) || null;

      // Buscar dados do usuario
      let userName = "Cliente";
      let userEmail = session.customer_email || "";
      let userPhone = "";

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", userId)
          .maybeSingle();
        if (profile) {
          userName = profile.full_name || "Cliente";
          userEmail = profile.email || userEmail;
          userPhone = profile.phone || "";
        }
      }

      // ── ASSINATURA ───────────────────────────────────────────────
      if (session.mode === "subscription") {
        let subscriptionEnd: string | null = null;
        if (session.subscription) {
          const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
            headers: {
              Authorization: `Bearer ${stripeKey}`,
              "Stripe-Version": STRIPE_API_VERSION,
            },
          });
          const sub = await subResponse.json();
          subscriptionEnd = extrairFimDoPeriodo(sub);
          if (!subscriptionEnd) {
            console.warn("Nao consegui extrair current_period_end da assinatura", session.subscription);
          }
        }

        const updatePayload = {
          subscription_status: "active",
          stripe_customer_id: customerId,
          subscription_end: subscriptionEnd,
        };

        if (userId) {
          const { data: upd, error: updErr } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", userId)
            .select("id");
          if (updErr) console.error("Erro ao gravar assinatura por id:", updErr.message);

          // Fallback: alguns perfis sao identificados por user_id em vez de id
          if (!upd || upd.length === 0) {
            const { error: fbErr } = await supabase
              .from("profiles")
              .update(updatePayload)
              .eq("user_id", userId);
            if (fbErr) console.error("Erro ao gravar assinatura por user_id:", fbErr.message);
            else console.log("Assinatura gravada via fallback user_id:", userId);
          } else {
            console.log("Assinatura gravada:", userId, JSON.stringify(updatePayload));
          }
        } else {
          console.warn("checkout.session.completed sem user_id. Gravando por customer:", customerId);
          await supabase.from("profiles").update(updatePayload).eq("stripe_customer_id", customerId);
        }

        // Email de boas vindas
        if (userEmail) {
          await sendEmail(userEmail, "Bem-vindo ao Saindo do Jogo! 🎉", emailBoasVindas(userName));
        }

      // ── PAGAMENTO AVULSO (TERAPIA / JURÍDICO) ───────────────────
      } else if (session.mode === "payment" && userId) {
        const THERAPY_PRICE = "price_1TePGm1kqWoIkJvR8JFLZde6";
        const LEGAL_PRICE_1 = "price_1TePGr1kqWoIkJvR69tvR5K7";
        const LEGAL_PRICE_2 = "price_1Ta1p00oEfdN4xGLiElxDceu";

        let payment_type = "other";
        if (priceId === THERAPY_PRICE) payment_type = "therapy";
        else if (priceId === LEGAL_PRICE_1 || priceId === LEGAL_PRICE_2) payment_type = "legal";

        const amount = (session.amount_total ?? 0) / 100;
        await supabase.from("payments").insert({
          user_id: userId,
          payment_type,
          amount,
          status: "completed",
          stripe_payment_id: session.id,
        });

        if (payment_type === "therapy") {
          if (userEmail) {
            await sendEmail(
              userEmail,
              "Sessão de terapia confirmada ✅ — Saindo do Jogo",
              emailTerapiaUsuario(userName)
            );
          }
          await sendEmail(
            ADMIN_EMAIL,
            `🧠 Nova sessão de terapia — ${userName}`,
            emailTerapiaAdmin(userName, userEmail, userPhone)
          );
          await sendWhatsApp(
            ADMIN_PHONE,
            `🧠 *Nova sessão de terapia contratada!*\n\n👤 Nome: ${userName}\n📧 Email: ${userEmail}\n📱 WhatsApp: ${userPhone || "não informado"}\n\n⚡ Entre em contato em até 24h para confirmar o agendamento.`
          );

        } else if (payment_type === "legal") {
          if (userEmail) {
            await sendEmail(
              userEmail,
              "Avaliação jurídica confirmada ✅ — Saindo do Jogo",
              emailJuridicoUsuario(userName)
            );
          }
          await sendEmail(
            ADMIN_EMAIL,
            `⚖️ Nova avaliação jurídica — ${userName}`,
            emailJuridicoAdmin(userName, userEmail, userPhone)
          );
          await sendWhatsApp(
            ADMIN_PHONE,
            `⚖️ *Nova avaliação jurídica contratada!*\n\n👤 Nome: ${userName}\n📧 Email: ${userEmail}\n📱 WhatsApp: ${userPhone || "não informado"}\n\n⚡ Entre em contato em até 24h para agendar a avaliação.`
          );
        }
      }
    }

    // ── ASSINATURA ATUALIZADA ────────────────────────────────────────
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const periodEnd = extrairFimDoPeriodo(subscription);

      let newStatus: string;
      if (subscription.cancel_at_period_end) {
        newStatus = "canceling";
      } else if (subscription.status === "active") {
        newStatus = "active";
      } else {
        newStatus = "inactive";
      }

      const updateFields: Record<string, unknown> = { subscription_status: newStatus };
      if (periodEnd) updateFields.subscription_end = periodEnd;

      const { error: updErr } = await supabase
        .from("profiles")
        .update(updateFields)
        .eq("stripe_customer_id", customerId);
      if (updErr) console.error("Erro ao atualizar assinatura:", updErr.message);
      else console.log("Assinatura atualizada:", customerId, newStatus, periodEnd);
    }

    // ── ASSINATURA DELETADA ──────────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      await supabase
        .from("profiles")
        .update({ subscription_status: "inactive", subscription_end: null })
        .eq("stripe_customer_id", customerId);
      console.log("Assinatura encerrada:", customerId);
    }

    // ── FALHA DE PAGAMENTO ───────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      console.log("Pagamento falhou:", customerId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
