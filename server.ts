import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // ═══ Health Check ═══
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'NeonFlow', timestamp: new Date().toISOString() });
  });

  // ═══ MAGO Payments: Stripe Routes ═══
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    // Create Checkout Session
    app.post('/api/createCheckoutSession', async (req, res) => {
      const { userId, email, priceId, appUrl: clientAppUrl } = req.body;
      const appUrl = clientAppUrl || process.env.APP_URL || req.headers.origin || 'http://localhost:3000';

      try {
        const lineItems = priceId
          ? [{ price: priceId, quantity: 1 }]
          : [{
              price_data: {
                currency: 'brl',
                product_data: { name: 'NeonFlow Premium', description: 'Streaming ilimitado e funcionalidades avançadas' },
                unit_amount: 1490, // R$14,90/mês
                recurring: { interval: 'month' as const },
              },
              quantity: 1,
            }];

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: email,
          line_items: lineItems,
          mode: 'subscription',
          success_url: `${appUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/?canceled=true`,
          metadata: { userId },
        });

        console.log(`[Stripe] ✅ Checkout Session: ${session.id}`);
        return res.json({ url: session.url });
      } catch (error: any) {
        console.error('[Stripe] ❌ Erro:', error.message);
        return res.status(500).json({ error: error.message });
      }
    });

    // Create Portal Session
    app.post('/api/createPortalSession', async (req, res) => {
      const { userId, stripeCustomerId, appUrl: clientAppUrl } = req.body;
      const appUrl = clientAppUrl || process.env.APP_URL || req.headers.origin || 'http://localhost:3000';

      try {
        if (stripeCustomerId) {
          const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/`,
          });
          return res.json({ url: session.url });
        }
        return res.status(400).json({ error: 'stripeCustomerId ausente.' });
      } catch (error: any) {
        console.error('[Stripe] ❌ Erro portal:', error.message);
        return res.status(500).json({ error: error.message });
      }
    });

    // Verify Checkout Session
    app.post('/api/verifyCheckoutSession', async (req, res) => {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Session ID ausente' });

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid' || session.status === 'complete') {
          let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          if (session.subscription) {
            try {
              const sub = await stripe.subscriptions.retrieve(session.subscription as string);
              const subEnd = (sub as any).current_period_end;
              if (subEnd && typeof subEnd === 'number') currentPeriodEnd = new Date(subEnd * 1000).toISOString();
            } catch {}
          }
          return res.json({
            success: true, userId: session.metadata?.userId, plan: 'premium',
            status: 'active', currentPeriodEnd,
            stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription,
          });
        }
        return res.status(400).json({ error: 'Pagamento não concluído.' });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

    console.log('[Stripe] ✅ Rotas de pagamento registradas');
  } else {
    console.log('[Stripe] ⚠️ STRIPE_SECRET_KEY não configurada.');
  }

  // ═══ Vite Dev Middleware / Production SPA ═══
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NeonFlow] Rodando em http://localhost:${PORT}`);
  });
}

startServer();
