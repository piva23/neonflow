// ═══════════════════════════════════════════════════════════════════
// Strapi CMS Service — Adapter para o modulo oficial do framework
// Re-exporta o servico do @mago/shared/strapi com fallback gracioso
// ═══════════════════════════════════════════════════════════════════

export { strapiService } from '../../../../framework/web/src/shared/strapi';
export type {
  StrapiConfig,
  StrapiFindParams,
  StrapiPaymentPayload,
  StrapiPaymentResponse,
  StrapiResponse,
  StrapiServiceApi,
} from '../../../../framework/web/src/shared/strapi';
