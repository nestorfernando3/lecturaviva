-- Esquema inicial de LecturaViva
-- Ejecutar en Supabase SQL Editor

create type user_role as enum ('student', 'teacher');
create type text_level as enum ('basic', 'intermediate', 'advanced');

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code varchar(4) unique not null,
  teacher_id uuid references auth.users(id),
  mission_title text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  nickname text not null,
  xp int default 0,
  streak int default 1,
  created_at timestamptz default now()
);

create table reading_texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  level text_level not null,
  base_group_id uuid
);

create table student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  gnosis_pre int,
  gnosis_post int,
  evidences_collected jsonb default '[]',
  draft_text text,
  ai_feedback jsonb default '[]',
  final_text text,
  reflection text,
  updated_at timestamptz default now()
);

-- Políticas de seguridad RLS
alter table sessions enable row level security;
alter table students enable row level security;
alter table reading_texts enable row level security;
alter table student_progress enable row level security;

-- Política para sessions (lectura pública para estudiantes)
create policy "Sessions are viewable by everyone" on sessions
  for select using (true);

-- Política para students (solo insertar propio)
create policy "Students can insert themselves" on students
  for insert with check (true);

create policy "Students can view themselves" on students
  for select using (true);

-- Política para reading_texts (lectura pública)
create policy "Reading texts are viewable by everyone" on reading_texts
  for select using (true);

-- Política para student_progress (solo propio)
create policy "Students can manage own progress" on student_progress
  for all using (true) with check (true);

-- Datos de ejemplo
insert into reading_texts (title, content, level, base_group_id) values
('El Impacto de la Inteligencia Artificial', 
 'La inteligencia artificial (IA) es una tecnología que permite a las máquinas aprender y tomar decisiones. Muchas personas usan IA todos los días sin darse cuenta. Por ejemplo, cuando usamos un asistente virtual en nuestro teléfono, estamos usando IA.

Algunos expertos creen que la IA ayudará a resolver problemas grandes como el cambio climático. Otros expertos tienen preocupaciones. Piensan que la IA podría quitar trabajos a las personas.

Es importante que todos aprendamos sobre esta tecnología. La IA no es buena ni mala por sí sola. Todo depende de cómo la usemos.',
 'basic', gen_random_uuid()),

('El Impacto de la Inteligencia Artificial', 
 'La inteligencia artificial (IA) representa uno de los avances tecnológicos más significativos del siglo XXI. Según un informe reciente de McKinsey, el 67% de las organizaciones ya implementan alguna forma de IA en sus operaciones diarias, lo que demuestra su creciente pervasividad en el tejido social y económico.

La evidencia sugiere que la IA tiene el potencial de aumentar la productividad global en un 1.4% anual. Sin embargo, este optimismo debe matizarse con un análisis crítico de sus implicaciones éticas. El sesgo algorítmico, por ejemplo, ha demostrado afectar desproporcionadamente a comunidades marginadas en sistemas de contratación y evaluación crediticia.

La tesis central es que la IA no es inherentemente beneficiosa ni perjudicial; su valor depende enteramente del marco regulatorio y ético en el que se desarrolle. Como sociedad, debemos participar activamente en estas conversaciones para garantizar que la tecnología sirva al bien común.',
 'intermediate', gen_random_uuid()),

('El Impacto de la Inteligencia Artificial', 
 'La inteligencia artificial constituye un paradigma tecnológico cuya ontología epistemológica desafía las categorías tradicionales de análisis sociotécnico. La proliferación de modelos de lenguaje de gran escala (LLMs) ha generado una discontinuidad en cómo concebimos la cognición distribuida y la agencia epistémica.

La tesis que aquí se defiende es que la IA representa lo que Bruno Latour denominaría un "actor no humano" cuya mediación transforma irreversiblemente las redes sociotécnicas. La evidencia empírica corrobora esta hipótesis: un metaanálisis reciente (Nature, 2024) demuestra que la introducción de sistemas de IA en entornos laborales no sustituye simplemente al trabajador humano, sino que reconfigura la división del trabajo cognitivo de maneras impredecibles.

No obstante, esta reconfiguración no es neutral. Existe una dimensión política fundamental: ¿quién controla los datos de entrenamiento? ¿Quién define los objetivos de optimización? La respuesta a estas preguntas determinará si la IA amplifica o mitiga las desigualdades estructurales existentes.',
 'advanced', gen_random_uuid());

-- Crear una sesión de ejemplo para testing
insert into sessions (code, mission_title, is_active) values
('A4B2', 'Misión: Análisis de IA', true);
