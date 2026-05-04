# LecturaViva - Laboratorio de Lectura Crítica

Un laboratorio virtual de lectura crítica y análisis semiótico diseñado para educación secundaria y superior.

## Características Principales

- **Split-Screen**: Texto siempre visible mientras trabajas
- **Cero Fricción**: Acceso con código de 4 letras, sin contraseñas
- **Feedback con IA**: Integración con Ollama local para tutoría personalizada
- **Gamificación**: Sistema de XP y rachas tipo Duolingo
- **Niveles Adaptativos**: Básico, Intermedio y Avanzado (estilo Newsela)
- **Dashboard Docente**: Seguimiento en tiempo real con Supabase Realtime
- **PWA**: Funciona offline después de la primera carga
- **Metacognición**: Pre-test (Gnosis) y post-test (Anamnesis)

## Stack Tecnológico

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **IA**: Ollama (Local)
- **Estado**: Zustand + TanStack Query

## Configuración Local

1. Clona el repositorio
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea archivo `.env` basado en `.env.example`:
   ```
   VITE_SUPABASE_URL=https://xtcepaijzlsamzdvpimf.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_m3LaPEV5RHFv7mvApv1Sqg_BsbFYKZ0
   VITE_OLLAMA_URL=http://localhost:11434
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue

### Opción 1: Vercel (Recomendado)
```bash
npx vercel --prod
```

### Opción 2: GitHub Pages
```bash
npm run deploy
```

### Opción 3: Netlify
```bash
npx netlify deploy --prod --dir=dist
```

## Estructura del Proyecto

```
src/
  components/
    TextReader.tsx       # Panel izquierdo - Lector de textos
    GnosisPreTest.tsx    # Pre-test de confianza
    EvidenceCollector.tsx # Recolección de evidencias
    GuidedWriting.tsx    # Escritura guiada con IA
    FinalReview.tsx      # Revisión final y reflexión
  layouts/
    LabLayout.tsx        # Layout split-screen principal
  pages/
    Login.tsx            # Pantalla de login cero fricción
    TeacherDashboard.tsx # Dashboard docente
  store/
    useSessionStore.ts   # Estado global con Zustand
  lib/
    supabase.ts          # Cliente de Supabase
```

## Modelo de Datos

### Tablas Principales
- **sessions**: Sesiones de clase con código de 4 letras
- **students**: Estudiantes con XP y rachas
- **reading_texts**: Textos en 3 niveles (basic/intermediate/advanced)
- **student_progress**: Progreso individual con evidencias y feedback

## Funcionalidades por Fase

1. **Gnosis Inicial**: Slider de confianza 1-5
2. **Lectura Activa**: Texto con selector de nivel y TTS
3. **Evidencias**: Selección de texto + categorización (Hecho/Opinión/Contexto)
4. **Escritura**: Sentence stems + feedback de IA (3 iteraciones)
5. **Revisión**: Reflexión final + resumen de progreso

## IA Local (Ollama)

Para usar el feedback de IA localmente:
1. Instala Ollama: https://ollama.com
2. Descarga un modelo: `ollama pull llama3.2`
3. Inicia Ollama: `ollama serve`
4. La app se conectará automáticamente a `http://localhost:11434`

## Licencia

MIT
