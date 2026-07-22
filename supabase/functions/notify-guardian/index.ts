import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// notify-guardian (v2 — autocontida)
// Envia avisos ao Contato Âncora/Guardião por email (Resend) e WhatsApp (Z-API).
// A v1 encaminhava para N8N_WEBHOOK_URL, secret que nunca existiu — e exigia
// um formato de payload que o convite não usava. Resultado: nada nunca saiu.
// Agora: envio direto, dois formatos aceitos, autenticação obrigatória.
// Tipos: "invite" (novo contato cadastrado) | "temptation" (botão de emergência)
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_KEY = "re_eLRc8cwT_HZYSsQonMX3K1U1LZ3kby9k4";
const ZAPI_URL = "https://api.z-api.io/instances/3F4251576B10F1BE557C9A7EE4F1867E/token/2D6CDE945D6DB4F275171067/send-text";
const ZAPI_CLIENT_TOKEN = "F2ca9adb207a14c09a1d0005e62825cb6S";
const FROM_EMAIL = "Saindo do Jogo <contato@apostandonavida.com.br>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
          <a href="mailto:contato@apostandonavida.com.br" style="color:#1B4332">contato@apostandonavida.com.br</a>
        </p>
      </div>
    </div>
  `;
}

function emailConvite(nomeContato: string, nomeUsuario: string): string {
  return emailBase(`
    <h2 style="color:#1B4332;margin:0 0 8px">Você foi escolhido(a), ${nomeContato} 💚</h2>
    <p style="color:#374151">
      <strong>${nomeUsuario}</strong> está em uma jornada de recuperação do vício em apostas
      e escolheu <strong>você</strong> como Contato Âncora — a pessoa de confiança dessa caminhada.
    </p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">O que significa ser Contato Âncora:</h3>
      <ul style="color:#374151;margin:0;padding-left:20px;line-height:2">
        <li>Você pode receber avisos em momentos importantes da jornada</li>
        <li>Se ${nomeUsuario} passar por um momento de tentação, você fica sabendo</li>
        <li>Se ficar dias sem acessar o app, avisamos você</li>
        <li>Seu papel não é fiscalizar — é estar presente</li>
      </ul>
    </div>
    <p style="color:#374151">
      Nenhuma ação é necessária agora. Só de aceitar esse papel, você já está ajudando.
    </p>
    <p style="color:#6B7280;font-size:13px">
      Se preferir não receber esses avisos, peça a ${nomeUsuario} para ajustar isso no app.
    </p>
  `);
}

function whatsappConvite(nomeContato: string, nomeUsuario: string): string {
  return (
    `Olá, ${nomeContato}! 💚\n\n` +
    `Aqui é do *Saindo do Jogo*, app de recuperação do vício em apostas.\n\n` +
    `*${nomeUsuario}* está em uma jornada de recuperação e escolheu *você* como Contato Âncora — a pessoa de confiança dessa caminhada.\n\n` +
    `O que isso significa:\n` +
    `• Você recebe avisos em momentos importantes\n` +
    `• Se houver um momento de tentação, você fica sabendo\n` +
    `• Seu papel não é fiscalizar — é estar presente\n\n` +
    `Nenhuma ação é necessária agora. Só de aceitar, você já está ajudando.`
  );
}

function emailTentacao(nomeContato: string, nomeUsuario: string): string {
  return emailBase(`
    <h2 style="color:#B91C1C;margin:0 0 8px">⚠️ ${nomeUsuario} precisa de você agora</h2>
    <p style="color:#374151">
      <strong>${nomeUsuario}</strong> está passando por um <strong>momento de tentação</strong>
      e apertou o botão de emergência no app — isso significa que pediu ajuda.
    </p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin:24px 0">
      <p style="color:#991B1B;margin:0;font-size:15px">
        <strong>Entre em contato agora.</strong> Uma ligação ou mensagem neste momento
        pode ser a diferença entre resistir e recair.
      </p>
    </div>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:24px 0">
      <h3 style="color:#1B4332;margin:0 0 12px">Como abordar:</h3>
      <ul style="color:#374151;margin:0;padding-left:20px;line-height:2">
        <li>Ligue ou chame no WhatsApp — agora, não depois</li>
        <li>Pergunte como a pessoa está; ouça sem julgar</li>
        <li>Sugira mudar de ambiente: uma caminhada, um café</li>
        <li>Lembre a pessoa do caminho que ela já percorreu</li>
      </ul>
    </div>
  `);
}

function whatsappTentacao(nomeContato: string, nomeUsuario: string): string {
  return (
    `⚠️ *${nomeContato}, ${nomeUsuario} precisa de você AGORA.*\n\n` +
    `${nomeUsuario} está passando por um *momento de tentação* e apertou o botão de emergência no app *Saindo do Jogo* — isso significa que pediu ajuda.\n\n` +
    `📞 *Ligue ou mande mensagem agora.* Uma conversa neste momento pode ser a diferença entre resistir e recair.\n\n` +
    `Como abordar: ouça sem julgar, sugira mudar de ambiente, lembre do caminho já percorrido. 💚`
  );
}

async function enviarEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    console.log("Email guardiao:", to, res.status);
    return res.ok;
  } catch (e) {
    console.error("Erro email guardiao:", e);
    return false;
  }
}

async function enviarWhatsApp(phone: string, message: string) {
  try {
    let numero = phone.replace(/\D/g, "");
    if (!numero.startsWith("55")) numero = "55" + numero;
    const res = await fetch(ZAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
      body: JSON.stringify({ phone: numero, message }),
    });
    console.log("WhatsApp guardiao:", numero, res.status);
    return res.ok;
  } catch (e) {
    console.error("Erro WhatsApp guardiao:", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Autenticacao obrigatoria: antes, qualquer pessoa na internet podia
    // disparar avisos aos contatos de qualquer usuario (BUG 8).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const type = body?.type;
    if (type !== "invite" && type !== "temptation") {
      return json({ error: "type deve ser 'invite' ou 'temptation'" }, 400);
    }

    // Dois formatos historicos: invite chega achatado; temptation chega
    // com objeto guardian. Aceitamos ambos.
    const g = body.guardian ?? body;
    const nomeContato: string = g.guardian_name || "amigo(a)";
    const emailContato: string | null = g.guardian_email || null;
    const foneContato: string | null = g.guardian_phone || null;

    if (!emailContato && !foneContato) {
      return json({ error: "Contato sem email e sem telefone" }, 400);
    }

    // Nome do usuario: vem no payload (invite) ou buscamos pelo user_id
    // (temptation nao manda o nome).
    let nomeUsuario: string = body.user_name || "";
    if (!nomeUsuario) {
      const uid = body.user_id || g.user_id || userData.user.id;
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", uid)
        .maybeSingle();
      nomeUsuario = prof?.full_name || "Um usuário do app";
    }

    const [subject, html, zap] =
      type === "invite"
        ? [
            `${nomeUsuario} escolheu você como Contato Âncora 💚`,
            emailConvite(nomeContato, nomeUsuario),
            whatsappConvite(nomeContato, nomeUsuario),
          ]
        : [
            `⚠️ ${nomeUsuario} precisa de você agora`,
            emailTentacao(nomeContato, nomeUsuario),
            whatsappTentacao(nomeContato, nomeUsuario),
          ];

    let emailOk = false;
    let whatsOk = false;
    if (emailContato) emailOk = await enviarEmail(emailContato, subject, html);
    if (foneContato) whatsOk = await enviarWhatsApp(foneContato, zap);

    // Resposta honesta: se nenhum canal saiu, e falha — nada de ok:true falso.
    if (!emailOk && !whatsOk) {
      console.error("notify-guardian: nenhum canal funcionou para", nomeContato);
      return json({ ok: false, error: "Nenhum canal de envio funcionou" }, 502);
    }

    console.log(`notify-guardian ${type}: email=${emailOk} whatsapp=${whatsOk} para ${nomeContato}`);
    return json({ ok: true, type, canais: { email: emailOk, whatsapp: whatsOk } });
  } catch (err: any) {
    console.error("notify-guardian error:", err);
    return json({ error: err.message }, 500);
  }
});
