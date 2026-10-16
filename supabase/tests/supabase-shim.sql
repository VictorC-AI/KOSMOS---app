-- =====================================================================
-- Réplica mínima do Supabase para testar migrações num Postgres comum.
--
-- Use SÓ quando não der para rodar `supabase db start` (sem Docker).
-- O CI usa o Supabase de verdade; este arquivo nunca vai para produção.
--
-- Reproduz o que as migrações e os testes do KOSMOS usam:
--   - papéis anon, authenticated e service_role
--   - auth.users com os campos usados no cadastro
--   - auth.uid(), lido do JWT como o Supabase faz
--   - permissões padrão: no Supabase, toda tabela nova em public já nasce
--     com acesso para anon e authenticated. É por isso que as migrações
--     precisam revogar acessos; aqui o comportamento é o mesmo.
-- =====================================================================

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

create schema if not exists auth;

create table if not exists auth.users (
  -- sem valor padrão, como no Supabase: quem cria a conta informa o id
  id                 uuid primary key,
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ),
    ''
  )::uuid
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
