-- Protocolos anuais e registro atômico, acessíveis somente pelo serviço autenticado.
create table public.lara_prime_contadores (
  ano integer primary key check (ano >= 2026),
  ultimo bigint not null check (ultimo >= 0)
);
create table public.lara_prime_protocolos (
  sessao_id uuid primary key references public.lara_prime_sessoes(id) on delete cascade,
  ano integer not null,
  numero bigint not null check (numero > 0),
  codigo text not null unique,
  assunto text not null,
  criada_em timestamptz not null default now(),
  unique (ano,numero)
);
alter table public.lara_prime_contadores enable row level security;
alter table public.lara_prime_protocolos enable row level security;
revoke all on public.lara_prime_contadores,public.lara_prime_protocolos from public,anon,authenticated;
grant select,insert,update on public.lara_prime_contadores,public.lara_prime_protocolos to service_role;

create function public.lara_prime_registrar_resposta(
  p_sessao uuid,p_request uuid,p_mensagem text,p_resultado jsonb,p_emitir boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_resultado jsonb;
  v_codigo text;
  v_numero bigint;
  v_ano integer := extract(year from now() at time zone 'America/Fortaleza')::integer;
  v_assunto text;
  v_perfil jsonb := coalesce(p_resultado->'perfil','{}'::jsonb);
  v_resposta text := p_resultado->>'resposta';
begin
  perform 1 from public.lara_prime_sessoes where id=p_sessao for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  select resultado into v_resultado from public.lara_prime_mensagens
    where sessao_id=p_sessao and request_id=p_request and papel='model';
  if v_resultado is not null then return v_resultado; end if;
  v_assunto := concat_ws(' · ',case v_perfil->>'finalidade' when 'comprar' then 'Compra' when 'alugar' then 'Aluguel' else 'Orientação' end,
    nullif(v_perfil->>'tipo',''),nullif(v_perfil->>'localizacao',''),nullif(v_perfil->>'empreendimento',''));
  select codigo into v_codigo from public.lara_prime_protocolos where sessao_id=p_sessao;
  if v_codigo is null then
    -- Preserva códigos já entregues antes da numeração anual.
    select resultado->>'protocolo' into v_codigo from public.lara_prime_mensagens
      where sessao_id=p_sessao and papel='model' and coalesce(resultado->>'protocolo','')<>'' order by ordem desc limit 1;
  end if;
  if v_codigo is null and p_emitir then
    insert into public.lara_prime_contadores(ano,ultimo) values(v_ano,1)
      on conflict(ano) do update set ultimo=public.lara_prime_contadores.ultimo+1 returning ultimo into v_numero;
    v_codigo := 'PL/'||v_ano||'/'||lpad(v_numero::text,greatest(8,length(v_numero::text)),'0');
    insert into public.lara_prime_protocolos(sessao_id,ano,numero,codigo,assunto) values(p_sessao,v_ano,v_numero,v_codigo,v_assunto);
  elsif v_codigo is not null then
    update public.lara_prime_protocolos set assunto=v_assunto where sessao_id=p_sessao;
  end if;
  if coalesce((p_resultado->>'pronto_para_especialista')::boolean,false) then
    if coalesce(v_perfil->>'telefone','') not in ('','prefiro não informar') then
      v_resposta := 'Obrigada pelas respostas! Seu atendimento foi registrado para a equipe Prime Lar. O especialista entrará em contato pelo WhatsApp informado após a distribuição do atendimento pela equipe.';
    else
      v_resposta := 'Obrigada pelas respostas! Seu atendimento foi registrado. Para retorno por WhatsApp, informe seu número com DDD. Se preferir, você pode continuar pelo Instagram da Prime Lar.';
    end if;
    v_resposta := v_resposta||E'\n\nProtocolo da conversa: '||v_codigo||'.';
  end if;
  v_resultado := p_resultado||jsonb_build_object('resposta',v_resposta,'protocolo',coalesce(v_codigo,''),'assunto',v_assunto);
  insert into public.lara_prime_mensagens(sessao_id,request_id,papel,conteudo,resultado) values
    (p_sessao,p_request,'user',p_mensagem,null),(p_sessao,p_request,'model',v_resposta,v_resultado);
  update public.lara_prime_sessoes set perfil=v_perfil,atualizada_em=now() where id=p_sessao;
  return v_resultado;
end;
$$;
revoke all on function public.lara_prime_registrar_resposta(uuid,uuid,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.lara_prime_registrar_resposta(uuid,uuid,text,jsonb,boolean) to service_role;

create table public.lara_prime_fontes (
  id text primary key,
  url text not null,
  fatos jsonb not null,
  conteudo_hash text not null,
  conferida_em timestamptz not null,
  proxima_verificacao timestamptz not null default now(),
  ultimo_erro text
);
create table public.lara_prime_fontes_historico (
  fonte_id text not null references public.lara_prime_fontes(id),
  conteudo_hash text not null,
  fatos jsonb not null,
  registrada_em timestamptz not null default now(),
  primary key(fonte_id,conteudo_hash)
);
alter table public.lara_prime_fontes enable row level security;
alter table public.lara_prime_fontes_historico enable row level security;
revoke all on public.lara_prime_fontes,public.lara_prime_fontes_historico from public,anon,authenticated;
grant select,insert,update on public.lara_prime_fontes,public.lara_prime_fontes_historico to service_role;
create function public.lara_prime_reservar_atualizacao(p_fonte text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
  update public.lara_prime_fontes set proxima_verificacao=now()+interval '10 minutes'
    where id=p_fonte and proxima_verificacao<=now();
  return found;
end;
$$;
revoke all on function public.lara_prime_reservar_atualizacao(text) from public,anon,authenticated;
grant execute on function public.lara_prime_reservar_atualizacao(text) to service_role;
insert into public.lara_prime_fontes(id,url,fatos,conteudo_hash,conferida_em) values(
  'village_canopus','https://canopusconstrucoes.com.br/teresina/imoveis/village-por-do-sol-teresina',
  '{"nome":"Village Pôr do Sol","cidade":"Teresina","quartos":2,"status":"Em obras","lazer":["piscina adulto e infantil","playground","campo de futebol","beach tennis","pet place"],"pendencias":["endereço: página alterna Pedra Mole e Aroeiras","preço, estoque, entrega e condições comerciais: confirmar com a Prime Lar"]}'::jsonb,
  'revisao_humana_20261009',now()
);
insert into public.lara_prime_fontes_historico(fonte_id,conteudo_hash,fatos)
  select id,conteudo_hash,fatos from public.lara_prime_fontes;
