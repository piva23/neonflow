// ═══════════════════════════════════════════════════════════════════
// NeonFlow — Store / Planos Page
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Zap, Crown, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';

const PLANS = [
  {
    id: 'plan_free',
    name: 'Gratuito',
    price: 0,
    interval: 'month' as const,
    description: 'Acesso basico com limites',
    features: ['Funcionalidades essenciais', 'Limite de uso diario', 'Suporte por email'],
    cta: 'Plano Atual',
    highlighted: false,
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    price: 1990,
    interval: 'month' as const,
    description: 'Acesso ilimitado e funcionalidades avancadas',
    features: [
      'Acesso ilimitado',
      'Analise com IA',
      'Exportacao em PDF/Excel',
      'Historico completo',
      'Suporte prioritario',
    ],
    cta: 'Assinar Premium',
    highlighted: true,
    badge: 'Mais Popular',
  },
  {
    id: 'plan_vip',
    name: 'VIP',
    price: 4990,
    interval: 'month' as const,
    description: 'Para equipes e uso intensivo',
    features: [
      'Tudo do Premium',
      'Acesso para multiplos usuarios',
      'Relatorios personalizados',
      'Suporte 24/7',
      'Integracao com API',
    ],
    cta: 'Assinar VIP',
    highlighted: false,
    badge: 'Premium',
  },
];

function formatPrice(price: number): string {
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price / 100);
}

export default function StorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setMessage('Pagamento confirmado! Seu plano Premium foi ativado.');
    } else if (searchParams.get('canceled') === 'true') {
      setMessage('Pagamento cancelado. Voce pode tentar novamente quando quiser.');
    }
  }, [searchParams]);

  const handleUpgrade = async (planId: string) => {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      setMessage('Voce precisa estar logado para assinar.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email,
          priceId: planId,
          appUrl: window.location.origin,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('Erro ao criar sessao de checkout.');
      }
    } catch (err) {
      setMessage('Servidor de pagamentos indisponivel. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Planos & Precos</h1>
            <p className="text-sm text-gray-400 mt-1">Escolha o plano ideal para sua experiencia NeonFlow</p>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            message.includes('confirmado') || message.includes('ativado')
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-purple-500/10 to-pink-500/10 border-purple-500/40 shadow-[0_0_30px_rgba(123,44,191,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-black text-white shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-black">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-black">{formatPrice(plan.price)}</span>
                {plan.price > 0 && <span className="text-sm text-gray-400">/mes</span>}
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading || plan.price === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all cursor-pointer ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                    : plan.price === 0
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Transacao Segura</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            <span>Cancelamento Flexivel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Sem Multa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
