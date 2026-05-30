import { useNavigate } from "react-router-dom";

/* ── SVG Illustrations ── */

function JourneySVG() {
  return (
    <svg viewBox="0 0 320 120" fill="none" className="absolute inset-0 w-full h-full opacity-30">
      {/* Winding trail */}
      <path
        d="M-10 100 C60 90, 80 40, 140 50 S220 20, 280 30 S340 10, 360 20"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="3"
        strokeDasharray="8 6"
        fill="none"
      />
      {/* 12 milestone dots */}
      {[
        [10,98],[35,92],[60,78],[85,58],[108,48],[135,50],
        [160,44],[185,36],[210,28],[240,24],[268,28],[300,22]
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.4)" />
          <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.9)" />
        </g>
      ))}
      {/* Golden star at end */}
      <polygon
        points="300,10 303,18 312,18 305,23 308,31 300,26 292,31 295,23 288,18 297,18"
        fill="#C9A84C"
        opacity="0.9"
      />
      {/* Sparkles */}
      <circle cx="260" cy="15" r="1.5" fill="#C9A84C" opacity="0.6" />
      <circle cx="280" cy="8" r="1" fill="#C9A84C" opacity="0.5" />
    </svg>
  );
}

function TherapySVG() {
  return (
    <svg viewBox="0 0 160 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      {/* Two silhouettes */}
      <circle cx="55" cy="50" r="12" fill="rgba(255,255,255,0.5)" />
      <path d="M40 70 Q47 62, 55 62 Q63 62, 70 70 L70 95 L40 95Z" fill="rgba(255,255,255,0.4)" rx="4" />
      <circle cx="110" cy="50" r="12" fill="rgba(255,255,255,0.5)" />
      <path d="M95 70 Q102 62, 110 62 Q118 62, 125 70 L125 95 L95 95Z" fill="rgba(255,255,255,0.4)" rx="4" />
      {/* Heart connection */}
      <path
        d="M67 55 C75 40, 85 40, 82 55 C82 55, 82 55, 82 55 M67 55 C75 70, 85 70, 82 55"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M82,48 C82,44 86,42 88,45 C90,42 94,44 94,48 C94,54 88,58 88,58 C88,58 82,54 82,48Z"
        fill="rgba(255,255,255,0.4)"
      />
    </svg>
  );
}

function RoutineSVG() {
  return (
    <svg viewBox="0 0 160 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      {/* Mountain */}
      <path d="M0 110 L50 50 L80 80 L120 35 L160 110Z" fill="rgba(255,255,255,0.2)" />
      <path d="M0 110 L40 65 L70 85 L110 45 L160 110Z" fill="rgba(255,255,255,0.15)" />
      {/* Sun */}
      <circle cx="120" cy="30" r="18" fill="rgba(255,255,255,0.35)" />
      <circle cx="120" cy="30" r="12" fill="rgba(255,255,255,0.5)" />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 120 + Math.cos(rad) * 22;
        const y1 = 30 + Math.sin(rad) * 22;
        const x2 = 120 + Math.cos(rad) * 30;
        const y2 = 30 + Math.sin(rad) * 30;
        return (
          <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function StoriesSVG() {
  return (
    <svg viewBox="0 0 160 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      {/* 3 person circles */}
      <circle cx="50" cy="40" r="14" fill="rgba(255,255,255,0.4)" />
      <circle cx="110" cy="40" r="14" fill="rgba(255,255,255,0.4)" />
      <circle cx="80" cy="85" r="14" fill="rgba(255,255,255,0.4)" />
      {/* Connection lines */}
      <line x1="50" y1="40" x2="110" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <line x1="50" y1="40" x2="80" y2="85" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <line x1="110" y1="40" x2="80" y2="85" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      {/* Inner glow */}
      <circle cx="50" cy="40" r="6" fill="rgba(255,255,255,0.6)" />
      <circle cx="110" cy="40" r="6" fill="rgba(255,255,255,0.6)" />
      <circle cx="80" cy="85" r="6" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

function AulaoSVG() {
  return (
    <svg viewBox="0 0 160 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      {/* Stars background */}
      {[[20,15],[140,20],[30,90],[130,85],[75,10],[10,55],[150,55]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.5)" />
      ))}
      {/* Play button */}
      <circle cx="80" cy="55" r="28" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="rgba(255,255,255,0.1)" />
      <polygon points="72,40 72,70 98,55" fill="rgba(255,255,255,0.6)" />
      {/* Sound waves */}
      {[36, 44, 52].map((r, i) => (
        <path
          key={i}
          d={`M${80 + r * 0.7} ${55 - r * 0.5} A${r} ${r} 0 0 1 ${80 + r * 0.7} ${55 + r * 0.5}`}
          stroke={`rgba(255,255,255,${0.3 - i * 0.08})`}
          strokeWidth="1.5"
          fill="none"
        />
      ))}
    </svg>
  );
}

function EvolutionSVG() {
  return (
    <svg viewBox="0 0 320 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      {/* Ascending line chart */}
      <polyline
        points="20,100 60,85 100,90 140,65 180,70 220,45 260,35 300,15"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Glow dots */}
      {[[20,100],[60,85],[100,90],[140,65],[180,70],[220,45],[260,35],[300,15]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill="rgba(255,255,255,0.15)" />
          <circle cx={cx} cy={cy} r="3" fill="rgba(255,255,255,0.6)" />
        </g>
      ))}
      {/* Stars */}
      <circle cx="280" cy="25" r="2" fill="#C9A84C" opacity="0.7" />
      <circle cx="250" cy="15" r="1.5" fill="#C9A84C" opacity="0.5" />
      <circle cx="310" cy="10" r="1" fill="#C9A84C" opacity="0.6" />
    </svg>
  );
}

function LegalSVG() {
  return (
    <svg viewBox="0 0 160 120" fill="none" className="absolute inset-0 w-full h-full opacity-25">
      <rect x="76" y="80" width="8" height="28" fill="rgba(255,255,255,0.5)" />
      <rect x="60" y="105" width="40" height="6" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="40" y="42" width="80" height="4" rx="2" fill="rgba(255,255,255,0.55)" />
      <rect x="76" y="42" width="8" height="40" fill="rgba(255,255,255,0.5)" />
      <line x1="48" y1="46" x2="48" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M36 60 Q48 74, 60 60 Z" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <line x1="112" y1="46" x2="112" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M100 60 Q112 74, 124 60 Z" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <circle cx="80" cy="38" r="4" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

/* ── Card data ── */
interface NavCard {
  title: string;
  subtitle: string;
  gradient: string;
  path: string;
  Illustration: React.FC;
  badge?: string;
  wide?: boolean;
}

const cards: NavCard[] = [
  {
    title: "A Jornada",
    subtitle: "12 passos para a liberdade",
    gradient: "linear-gradient(135deg, #1B4332, #2D6A4F)",
    path: "/app/jornada",
    Illustration: JourneySVG,
    wide: true,
  },
  {
    title: "Terapia",
    subtitle: "Fale com um especialista",
    gradient: "linear-gradient(135deg, #1A3A5C, #2E6DA4)",
    path: "/app/terapia",
    Illustration: TherapySVG,
  },
  {
    title: "Aulão Semanal",
    subtitle: "Ao vivo com terapeuta",
    gradient: "linear-gradient(135deg, #1A1A2E, #16213E)",
    path: "/app/aulao",
    Illustration: AulaoSVG,
    badge: "AO VIVO",
  },
  {
    title: "Evolução",
    subtitle: "Veja seu progresso",
    gradient: "linear-gradient(135deg, #1B4332, #40916C)",
    path: "/app/evolucao",
    Illustration: EvolutionSVG,
  },
  {
    title: "Apoio Jurídico",
    subtitle: "Advogados e simulador de dívidas",
    gradient: "linear-gradient(135deg, #2C2A4A, #4F518C)",
    path: "/app/juridico",
    Illustration: LegalSVG,
  },

];

export function PremiumNavCards() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className={`relative overflow-hidden text-left transition-transform duration-200 active:scale-[0.97] hover:scale-[1.02] ${
              card.wide ? "col-span-2" : "col-span-1"
            }`}
            style={{
              background: card.gradient,
              borderRadius: 20,
              height: card.wide ? 160 : 140,
              maxHeight: card.wide ? 160 : 140,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <card.Illustration />

            {/* Badge */}
            {card.badge && (
              <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                {card.badge}
              </span>
            )}

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-base leading-tight drop-shadow-md">
                {card.title}
              </h3>
              <p className="text-white/75 text-xs mt-0.5 drop-shadow-sm">
                {card.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm transition-transform duration-200 active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #B91C1C, #DC2626)",
          boxShadow: "0 6px 18px rgba(220,38,38,0.25)",
        }}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </div>
  );
}
