# Aporte UDFV a la Mesa N°2: Virtualización Institucional

**Fecha**: 26 de marzo de 2026
**Contexto**: Reunión de metodología 2026 — Mesa N°2 Virtualización Institucional
**Preparado por**: UDFV (Unidad de Desarrollo y Formación Virtual)

---

## 1. Qué tiene hoy la UDFV (operativo)

### Portal umce.online (en producción)

La UDFV opera **umce.online**, un ecosistema académico virtual que integra las plataformas institucionales en un punto único de acceso para estudiantes, docentes y diseñadores instruccionales. Está en producción desde marzo 2026 (evolución de virtual.udfv.cloud).

**Capacidades actuales:**

- **Autenticación institucional única**: Google OAuth restringido al dominio @umce.cl. Sesión con cookie HMAC-SHA256. Sin passwords adicionales — el estudiante entra con su cuenta UMCE y accede a todo.

- **5 plataformas Moodle conectadas vía REST API**: eVirtual (formación continua), Práctica (experimentación pedagógica), Virtual (apoyo a la docencia), Pregrado y Postgrado. El portal consulta las 5 en tiempo real para mostrar al estudiante todos sus cursos en un solo lugar.

- **Catálogo de programas**: 13 programas formativos con información centralizada desde Supabase (self-hosted en supabase.udfv.cloud).

- **Panel de administración**: Gestión de contenidos (programas, cursos, equipo, noticias, testimonios) con roles diferenciados (admin, editor).

- **Chatbot IA**: Asistente integrado con Claude como motor, disponible en todo el portal para consultas de estudiantes.

- **App móvil**: Estructura preparada para Capacitor (notificaciones push vía Firebase).

- **Infraestructura propia**: VPS con Docker, Traefik (reverse proxy + SSL automático), CI/CD con GitHub Actions. Sin dependencia de servicios cloud externos.

### Formación docente

- Talleres de formación en tecnología educativa para docentes.
- Apoyo metodológico al diseño instruccional de cursos virtuales y semipresenciales.
- Experiencia en diseño de cursos en Moodle con estándares de calidad.

---

## 2. Qué está en desarrollo (próximo)

### Sistema PIAC inteligente (Fases 2-5 completadas, en deploy)

Un sistema que **lee el Plan Instruccional de Actividades del Curso (PIAC)** desde Google Drive y lo cruza automáticamente con la implementación real del curso en Moodle, detectando discrepancias. Esto permite asegurar que lo declarado por el docente se cumpla en la plataforma.

**Lo que hace:**

- **Lee el PIAC** (documento Word en Drive) y lo convierte en datos estructurados usando IA (Claude). Extrae: identificación, núcleos, resultados formativos, criterios de evaluación, repertorio evaluativo, metodología, bibliografía.

- **Fotografía el curso Moodle** vía API: secciones, actividades, foros, tareas, URLs, recursos, visibilidad.

- **Motor de matching**: Cruza automáticamente lo declarado en el PIAC con lo que existe en Moodle. Identifica qué falta, qué sobra y qué no coincide.

- **Clasificación de discrepancias** por severidad: crítica (sección oculta que debería estar visible, tarea sin fecha), warning (foro sin descripción, nombre no coincide), informativa (elementos extra no declarados).

- **Motor cron automático**: Cada 6 horas revisa los cursos publicados, detecta cambios en Moodle (secciones habilitadas/ocultadas, actividades agregadas/eliminadas) y alerta al diseñador instruccional.

- **Vista de curso virtual para el estudiante**: Un visor que presenta al estudiante su curso de forma ordenada y personalizada, con progresión (barras de avance por núcleo), notas inline, grabaciones por sesión, calendario de eventos, notificaciones, y chatbot contextual que conoce el contenido del curso.

- **Panel del DI**: Interfaz donde el diseñador instruccional configura qué mostrar al estudiante, visa elementos, publica/despublica, y recibe alertas.

### Open Badges 3.0 (aprobado, en preparación)

Dependencias ya integradas en el proyecto para emitir **credenciales digitales verificables** bajo el estándar Open Badges 3.0:
- Firma criptográfica Ed25519
- Verificable Credentials (W3C)
- Compatibles con wallets digitales y verificación independiente

Esto permitiría a la UMCE emitir certificados digitales de formación continua, talleres, diplomados y competencias que sean verificables por terceros sin depender de la universidad como intermediario.

---

## 3. Cruce con los temas de la Mesa N°2

La mesa identifica una serie de ejes técnicos para la política de virtualización. A continuación, cómo la UDFV ya aborda o puede abordar cada uno:

### Autenticación única

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Política de autenticación única institucional | **Ya implementado**: Google OAuth @umce.cl como método único. Sin passwords propios, sin registros duplicados. El estudiante usa su cuenta UMCE para acceder a todo. |
| Coordinación con DTI/DIPOS | El modelo actual puede servir como caso de éxito y referencia técnica para extender la autenticación única a otros sistemas. |

### Plataformas virtuales

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Definir plataformas virtuales institucionales | **Ya operativo**: 5 instancias Moodle integradas vía API REST. umce.online las unifica en un punto de acceso. |
| Experiencia fragmentada del estudiante | **Resuelto**: "Mis Cursos" muestra los cursos de las 5 plataformas en una sola vista. El curso virtual presenta el contenido de forma ordenada independiente de la plataforma origen. |

### Credenciales institucionales

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Credenciales digitales | **Listo para implementar**: Open Badges 3.0 con firma Ed25519. Estándar W3C verificable internacionalmente. |
| Verificabilidad y portabilidad | Los badges OB3.0 son verificables sin intermediario y el receptor los puede portar en wallets digitales. |

### Gobernanza y protección de datos

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Política de gobernanza de datos | Supabase self-hosted (no cloud externo). Los datos académicos viven en infraestructura controlada por la universidad. |
| Protección de datos estudiantiles | La IA del sistema **solo observa y reporta** — nunca crea ni modifica contenido en Moodle ni en Drive. Los datos de progresión del estudiante se cachean localmente y no se comparten con terceros. |
| Repositorios institucionales | La base de datos centralizada (Supabase) con schema extensible puede servir como repositorio de programas, cursos, PIACs, y credenciales. |

### Continuidad operativa

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Continuidad operativa de plataformas | Infraestructura Docker con deploy automatizado (CI/CD). Si el servidor cae, se reconstruye en minutos. SSL automático vía Traefik. |
| Monitoreo | El motor cron del PIAC ya monitorea el estado de los cursos Moodle cada 6 horas y alerta si hay cambios inesperados. |

### Aseguramiento de calidad

| Mesa N°2 dice | UDFV tiene/propone |
|---|---|
| Calidad de los cursos virtuales | **Sistema PIAC**: verificación automática de que lo declarado en la planificación se implementa en Moodle. Discrepancias clasificadas por severidad. |
| Textos mártires / borradores base | La UDFV puede aportar borradores técnicos para los productos de la mesa, basados en la experiencia operativa. |

---

## 4. Lo que la UDFV puede aportar a la mesa

1. **Caso operativo**: umce.online es un producto funcionando, no una propuesta teórica. Puede usarse como base para las definiciones técnicas de la política de virtualización.

2. **Textos mártires técnicos**: La UDFV puede redactar borradores de los componentes técnicos de la política (autenticación, plataformas, credenciales, gobernanza de datos) basados en lo que ya está implementado.

3. **Demostración funcional**: Se puede mostrar el portal, el curso virtual, el matching PIAC↔Moodle, y las credenciales digitales como prueba de concepto ante la mesa o ante las autoridades.

4. **Experiencia en integración de plataformas**: 5 Moodles conectados, Google Drive API, chatbot IA, sistema de notificaciones — experiencia concreta en hacer que sistemas distintos funcionen juntos.

5. **Visión de internacionalización**: La mención a UNESCO y la experimentación de un curso en línea se conectan directamente con las credenciales verificables (Open Badges) que permiten reconocimiento internacional.

---

## 5. Línea de tiempo de lo que viene

| Qué | Cuándo | Relación con la mesa |
|---|---|---|
| Deploy sistema PIAC completo | Abril 2026 | Herramienta de aseguramiento de calidad |
| Pulido visual curso virtual | Abril 2026 | Experiencia del estudiante |
| Open Badges 3.0 operativo | Por definir | Credenciales institucionales |
| Integración Acompaña UMCE | Por definir | Datos académicos centralizados (malla, horarios) |
