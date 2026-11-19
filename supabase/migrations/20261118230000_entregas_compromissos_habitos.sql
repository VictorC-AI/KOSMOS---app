-- =====================================================================
-- Versão 0.1: entregas, compromissos e hábitos
--
-- Toda linha pertence a uma conta (user_id). O user_id tem como padrão a
-- conta logada, então o app nem precisa enviá-lo; e as políticas de RLS
-- recusam qualquer linha cujo user_id não seja o de quem está logado.
-- =====================================================================

-- ------------------------------------------------------------ entregas
-- Trabalhos e provas. due_date é "date" de propósito: o dia 20 é dia 20
-- em qualquer fuso, sem conversão.
create table public.assignments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('trabalho', 'prova')),
  title      text not null check (length(trim(title)) between 1 and 200),
  course     text check (length(course) <= 100),
  due_date   date not null,
  done_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_user_due on public.assignments (user_id, due_date);

-- -------------------------------------------------------- compromissos
-- Data e horário locais + fuso do evento (não um instante em UTC), para
-- "toda terça às 19h" continuar às 19h mesmo se o fuso mudar de regra.
-- Recorrência simples guardada como RRULE do iCalendar: diária, semanal
-- (mesmo dia da semana) ou mensal (mesmo dia do mês), com fim opcional.
-- shortcut: sem exceções por ocorrência (mover/cancelar só uma); criar tabela de exceções quando fizer falta.
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (length(trim(title)) between 1 and 200),
  start_date date not null,
  start_time time not null,
  end_time   time not null,
  timezone   text not null default 'America/Sao_Paulo',
  rrule      text check (rrule in ('FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY')),
  repeat_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_time > start_time),
  constraint events_until_needs_rrule check (repeat_until is null or (rrule is not null and repeat_until >= start_date))
);
create index events_user_start on public.events (user_id, start_date);

-- A função é a mesma do perfil: valida new.timezone em qualquer tabela.
create trigger events_validate_timezone
  before insert or update of timezone on public.events
  for each row execute function public.validate_profile_timezone();

-- --------------------------------------------------------------- hábitos
-- "Academia 3x por semana": per_week = 3. "Inglês 30 min/dia":
-- per_week = 7 e minutes = 30 (minutes é só a meta, informativa).
create table public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (length(trim(title)) between 1 and 100),
  per_week   smallint not null default 7 check (per_week between 1 and 7),
  minutes    smallint check (minutes between 1 and 1440),
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- alvo da chave estrangeira composta de habit_logs
  unique (id, user_id)
);
create index habits_user on public.habits (user_id);

-- Um registro por hábito e dia = "feito". Desmarcar apaga o registro.
-- A chave composta (habit_id, user_id) garante que só dá para marcar
-- hábito da própria conta, mesmo que alguém descubra o id de outro.
create table public.habit_logs (
  habit_id   uuid not null,
  user_id    uuid not null default auth.uid(),
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, day),
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete cascade
);
create index habit_logs_user_day on public.habit_logs (user_id, day);

-- ------------------------------------------------------------ updated_at
create trigger assignments_set_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ RLS
-- Mesma regra nas quatro tabelas: só as linhas da própria conta, em
-- qualquer operação. Visitante sem login não acessa nada.
do $$
declare
  t text;
begin
  foreach t in array array['assignments', 'events', 'habits', 'habit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "Só a própria conta" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end;
$$;
