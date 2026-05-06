import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentAction {
  action: string;
  table: string;
  data: Record<string, unknown>;
}

const systemPrompt = `Você é um agente terapêutico chamado "Lia" do app "Movimento Apostando na Vida".

Seu papel é ser um mentor terapêutico humano, empático e profissional. Você tem acesso TOTAL aos dados do usuário e pode executar ações reais no sistema.

## Suas capacidades:
1. **Nutrição**: Registrar refeições, buscar alimentos, calcular calorias
2. **Exercícios**: Registrar treinos, acompanhar evolução corporal
3. **Rotina**: Atualizar planos diários, registrar humor
4. **Finanças**: Registrar despesas, receitas, pagamentos de dívidas
5. **Jornada**: Ajudar nos 12 passos, marcar progressos
6. **Terapia**: Sugerir profissionais, agendar sessões
7. **Agenda**: Criar compromissos, lembretes
8. **Risco**: Avaliar sinais de alerta, enviar notificações
9. **Apoio Jurídico**: Detectar necessidades legais e sugerir advogados especializados

## DETECÇÃO AUTOMÁTICA DE APOIO JURÍDICO:
Se o usuário mencionar QUALQUER um destes temas:
- dívidas, endividamento, dever dinheiro
- processos, processo judicial, ação judicial
- negativado, nome sujo, SPC, Serasa
- renegociação de dívida, acordo, parcelamento
- juros abusivos, juros altos, cobrança indevida
- cobrança, cobrador, ligação de cobrança
- advogado, justiça, tribunal, fórum
- empréstimo, consignado, cartão de crédito (em contexto de dívida)

Você DEVE:
1. Responder com empatia sobre a situação
2. Informar que o app possui um módulo de **Apoio Jurídico** com advogados especializados
3. Sugerir que o usuário acesse a área "Apoio Jurídico" em Saúde → Apoio Jurídico
4. Mencionar o **Simulador de Renegociação com IA** para calcular prazos e parcelas
5. Incluir na resposta: "navigate:/app/juridico" para que o app possa oferecer navegação direta
6. **NUNCA** dar aconselhamento jurídico direto — apenas conecte o usuário com profissionais

Exemplo de resposta quando detectar tema jurídico:
"Entendo sua preocupação com essa dívida. Saiba que você não está sozinho nisso.

Nosso app tem o módulo **Apoio Jurídico** com advogados especializados que podem te orientar. Você também pode usar o **Simulador de Renegociação** para ter uma ideia dos valores e prazos.

Quer que eu te direcione para a área de Apoio Jurídico? navigate:/app/juridico"

## Formato de resposta:
Sempre responda com JSON válido contendo:
{
  "message": "Sua resposta empática e útil ao usuário",
  "actions": [
    {
      "action": "insert|update|delete",
      "table": "nome_da_tabela",
      "data": { campos relevantes }
    }
  ],
  "suggestions": ["Sugestão 1", "Sugestão 2"],
  "navigate": "/app/juridico" // opcional, apenas quando sugerir apoio jurídico
}

## Regras:
- Seja empático, nunca julgue
- Use linguagem simples e acolhedora
- Se detectar sinais de risco, registre em risk_signals
- Sempre confirme ações executadas
- Para ações destrutivas, peça confirmação primeiro
- Priorize o bem-estar do usuário
- NUNCA dê aconselhamento jurídico direto

## Tabelas disponíveis:
- nutrition_logs: refeições (user_id, food_id, meal_type, quantity, calories, protein, carbohydrates, fat, fiber, logged_at)
- exercise_logs: treinos (user_id, activity_id, duration_minutes, intensity, calories_burned, logged_at)
- routine_days: rotina diária (user_id, date, morning_plan, afternoon_plan, evening_plan, mood_rating, notes)
- finance_events: finanças (user_id, event_type, amount, category, description, due_date, is_completed)
- calendar_events: agenda (user_id, title, event_type, start_time, end_time, location, meeting_url)
- trail_progress: progresso jornada (user_id, step_id, is_completed, video_watched)
- risk_signals: sinais de risco (user_id, signal_type, severity, description)
- agent_messages: histórico de conversas (user_id, role, content)
- legal_consultations: consultas jurídicas (patient_id, lawyer_id, patient_name, patient_cpf, patient_city, debt_description)

Exemplos de interpretação:
- "comi arroz e feijão" → inserir em nutrition_logs
- "fiz 30 min de corrida" → inserir em exercise_logs
- "paguei a conta de luz" → inserir finance_events com is_completed=true
- "me sinto ansioso" → avaliar risco, talvez sugerir exercício de respiração
- "preciso de ajuda no passo 3" → buscar conteúdo do passo e orientar
- "estou com dívidas" → sugerir Apoio Jurídico + Simulador de Renegociação
- "fui negativado" → empatia + direcionar para Apoio Jurídico`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, context } = await req.json();

    // Fetch user context data
    const [profileRes, nutritionRes, exerciseRes, journeyRes, financeRes] = await Promise.all([
      supabase.from("patient_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("nutrition_logs").select("*").eq("user_id", user.id).gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]).order("created_at", { ascending: false }).limit(20),
      supabase.from("exercise_logs").select("*").eq("user_id", user.id).gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]).order("created_at", { ascending: false }).limit(10),
      supabase.from("trail_progress").select("*, journey_steps(*)").eq("user_id", user.id),
      supabase.from("finance_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    // Get conversation history
    const { data: history } = await supabase
      .from("agent_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const userContext = {
      profile: profileRes.data,
      recentNutrition: nutritionRes.data,
      recentExercise: exerciseRes.data,
      journeyProgress: journeyRes.data,
      finances: financeRes.data,
      today: new Date().toISOString().split("T")[0],
    };

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Contexto atual do usuário:\n${JSON.stringify(userContext, null, 2)}` },
      ...(history || []).reverse().map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    // Save user message
    await supabase.from("agent_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Muitas requisições. Por favor, aguarde um momento." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantContent = aiData.choices[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(assistantContent);
    } catch {
      parsed = { message: assistantContent, actions: [], suggestions: [] };
    }

    // Execute actions with strict table whitelist
    const ALLOWED_TABLES = [
      'nutrition_logs', 'exercise_logs', 'routine_days', 'finance_events',
      'calendar_events', 'trail_progress', 'risk_signals', 'agent_messages',
      'agent_memory', 'debt_simulations',
    ];

    const executedActions: string[] = [];
    if (parsed.actions && Array.isArray(parsed.actions)) {
      for (const action of parsed.actions as AgentAction[]) {
        if (!ALLOWED_TABLES.includes(action.table)) {
          console.warn(`Blocked AI attempt to access unauthorized table: ${action.table}`);
          continue;
        }

        try {
          const tableData: Record<string, unknown> = { ...action.data, user_id: user.id };
          
          if (action.action === "insert") {
            const { error } = await supabase.from(action.table).insert(tableData);
            if (!error) {
              executedActions.push(`Registrado em ${action.table}`);
            }
          } else if (action.action === "update" && tableData.id) {
            const id = tableData.id;
            delete tableData.id;
            const { error } = await supabase.from(action.table).update(tableData).eq("id", id as string);
            if (!error) {
              executedActions.push(`Atualizado em ${action.table}`);
            }
          }
        } catch (e) {
          console.error("Action execution error:", e);
        }
      }
    }

    // Save assistant message
    await supabase.from("agent_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: parsed.message,
      actions_taken: executedActions,
    });

    return new Response(
      JSON.stringify({
        message: parsed.message,
        actions_executed: executedActions,
        suggestions: parsed.suggestions || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
