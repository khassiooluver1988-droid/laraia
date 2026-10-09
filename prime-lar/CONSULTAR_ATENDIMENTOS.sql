-- Consulta da equipe autorizada no SQL Editor do Supabase.
-- O acesso público às tabelas permanece revogado; esta consulta não cria API.
WITH ultimas AS (
  SELECT DISTINCT ON (sessao_id) sessao_id, criada_em, resultado
  FROM public.lara_prime_mensagens
  WHERE papel = 'model'
  ORDER BY sessao_id, ordem DESC
)
SELECT
  resultado ->> 'protocolo' AS protocolo,
  criada_em AT TIME ZONE 'America/Fortaleza' AS data_hora_brasilia,
  resultado -> 'perfil' ->> 'nome' AS nome,
  resultado -> 'perfil' ->> 'telefone' AS whatsapp,
  resultado -> 'perfil' ->> 'finalidade' AS interesse,
  resultado -> 'perfil' ->> 'tipo' AS tipo_imovel,
  resultado -> 'perfil' ->> 'localizacao' AS cidade_regiao,
  resultado -> 'perfil' ->> 'bairro' AS bairro,
  resultado -> 'perfil' ->> 'orcamento' AS orcamento,
  resultado -> 'perfil' ->> 'ocupacao' AS ocupacao,
  resultado -> 'perfil' ->> 'renda_bruta' AS renda_bruta,
  resultado -> 'perfil' ->> 'estado_civil' AS estado_civil,
  resultado -> 'perfil' ->> 'intencao' AS intencao,
  resultado -> 'perfil' ->> 'empreendimento' AS empreendimento
FROM ultimas
WHERE resultado ->> 'pronto_para_especialista' = 'true'
  AND COALESCE(resultado -> 'perfil' ->> 'telefone', '') NOT IN ('', 'prefiro não informar')
ORDER BY criada_em DESC;
