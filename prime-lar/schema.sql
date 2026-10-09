CREATE TABLE IF NOT EXISTS public.lara_prime_sessoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash text NOT NULL,
 perfil jsonb NOT NULL DEFAULT '{}'::jsonb,
 criada_em timestamptz NOT NULL DEFAULT now(),
 atualizada_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lara_prime_mensagens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ordem bigint GENERATED ALWAYS AS IDENTITY,
 sessao_id uuid NOT NULL REFERENCES public.lara_prime_sessoes(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 papel text NOT NULL CHECK (papel IN ('user', 'model')),
 conteudo text NOT NULL CHECK (length(conteudo) <= 6000),
 resultado jsonb,
 criada_em timestamptz NOT NULL DEFAULT now(),
 UNIQUE (sessao_id, request_id, papel)
);
CREATE INDEX IF NOT EXISTS lara_prime_historico_idx ON public.lara_prime_mensagens (sessao_id, ordem DESC);
ALTER TABLE public.lara_prime_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lara_prime_mensagens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lara_prime_sessoes, public.lara_prime_mensagens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.lara_prime_sessoes, public.lara_prime_mensagens TO service_role;
