-- =====================================================================
-- Perfis de usuário
--
-- Um perfil por conta, criado automaticamente quando alguém se cadastra
-- (a conta em si fica em auth.users, gerenciada pelo Supabase Auth).
--
-- Segurança (RLS): cada pessoa só lê e altera o próprio perfil. Não existe
-- política de insert nem de delete: o perfil nasce pelo gatilho do cadastro
-- e some junto com a conta (on delete cascade).
-- =====================================================================

-- ------------------------------------------------- função reutilizável
-- Atualiza updated_at em toda alteração. Outras tabelas vão usar a mesma.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------- tabela
create table public.profiles (
  -- o mesmo id da conta: é o "user_id" desta tabela
  id         uuid primary key references auth.users (id) on delete cascade,
  -- fuso IANA, por exemplo America/Sao_Paulo; validado pelo gatilho abaixo
  timezone   text not null default 'America/Sao_Paulo',
  -- 'system' segue a preferência do aparelho; o padrão visual é o escuro
  theme      text not null default 'system'
             check (theme in ('system', 'dark', 'light')),
  -- código ISO 4217 da moeda principal
  currency   text not null default 'BRL'
             check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Preferências de cada conta. Uma linha por usuário, criada no cadastro.';

-- --------------------------------------------- validação do fuso horário
-- Um CHECK não pode consultar a lista de fusos do Postgres, então a
-- validação fica num gatilho: "at time zone" falha se o fuso não existir.
create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  return new;
exception
  when invalid_parameter_value then
    raise exception 'Fuso horário inválido: %', new.timezone
      using errcode = 'check_violation';
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------- criação automática no cadastro
-- Roda com os privilégios do dono da função (security definer) porque quem
-- se cadastra ainda não tem permissão de escrever em profiles. O fuso pode
-- vir do navegador nos metadados do cadastro; se vier inválido ou vazio,
-- fica o padrão em vez de impedir a criação da conta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fuso text := nullif(new.raw_user_meta_data ->> 'timezone', '');
begin
  if fuso is not null then
    begin
      perform now() at time zone fuso;
    exception
      when invalid_parameter_value then
        fuso := null;
    end;
  end if;

  insert into public.profiles (id, timezone)
  values (new.id, coalesce(fuso, 'America/Sao_Paulo'));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ RLS
alter table public.profiles enable row level security;

-- Visitantes sem login não têm acesso nenhum.
revoke all on public.profiles from anon;
-- Quem está logado só pode ler e atualizar (a política decide quais linhas).
revoke all on public.profiles from authenticated;
grant select, update (timezone, theme, currency) on public.profiles to authenticated;

-- "(select auth.uid())" entre parênteses é calculado uma vez por consulta,
-- não uma vez por linha: mesma regra, mais rápido.
create policy "Ler o próprio perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Atualizar o próprio perfil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
