# Análisis Estratégico: Reunión UMCE-UChile sobre Plataforma Open EdX
## 7 de abril de 2026

**Tipo**: Análisis post-reunión con cruce de contexto UDFV
**Fuente primaria**: Transcripción de reunión (edx-reunion-texto.txt)
**Fuentes secundarias**: NARRATIVA-MESA1-BORRADOR.md, investigacion-microcredenciales-ob3-abril2026.md, memory/project_edx_fondef.md
**Nota metodológica**: Este documento distingue [DATO] de [ANÁLISIS]. Los datos provienen directamente de la transcripción o de los archivos de contexto UDFV. Los análisis son inferencias y recomendaciones basadas en el cruce de fuentes.

---

## 1. Datos Duros Extraídos

### 1.1 Montos económicos

[DATO] Convenio firmado por $64 millones en 4 cuotas de $16 millones. Todas las cuotas han sido pagadas.

[DATO] El compromiso de acompañamiento se extiende hasta junio 2027, más allá del pago del convenio. Esto implica que la plataforma tiene soporte activo sin costo adicional por al menos 14 meses desde la fecha de la reunión.

[DATO] UChile generó aproximadamente $300 millones el año pasado con su plataforma Open EdX.

[DATO] Universidad Abierta (U Abierta) generó aproximadamente $25 millones con 4-5 cursos a $15.000 por certificado.

[DATO] El curso de IA de la Universidad de Chile vendió entre $25 y $40 millones con difusión en medios.

[DATO] La memoria del proyecto EdX/FONDEF señala que el convenio equivale a un SaaS de aproximadamente $30 millones por año hasta junio 2027.

### 1.2 Etapas y fechas

[DATO] Etapa 0 (instalación): completada entre junio y agosto 2024.

[DATO] Etapa 1 (capacitaciones): completada entre agosto y septiembre 2024.

[DATO] Etapa 2 (pequeña escala): en curso, hasta julio 2025.

[DATO] Etapa 3 (producción): planificada para agosto 2026 a junio 2027.

[DATO] El convenio fue firmado el 5 de junio de 2024.

[DATO] El curso piloto "Potencia tu labor docente con IA" (Eric Silva) tenía un avance del 60% al momento de la reunión, con estimación de completarse a fines de marzo.

[ANÁLISIS] La Etapa 3 (producción real) no comenzará hasta agosto 2026, lo que significa que hay una ventana de cuatro meses (mayo-agosto) para hacer preparativos institucionales antes del momento de mayor exposición pública de la plataforma. Ese período coincide con la entrega de productos de Mesa 1.

### 1.3 Personas y roles mencionados

[DATO] Darío Riquelme: contraparte principal de UChile/EOL (EOL = plataforma Open EdX de UChile).

[DATO] Marisol Hernández: coordina el proyecto en UMCE, por mandato de Tatiana (rectora o autoridad superior, cambio de autoridades octubre 2025). Lidera el equipo institucional de virtualización.

[DATO] Andrea: contraparte del proyecto del lado de UChile (área de gestión EOL/UChile). NO es personal UMCE. La contraparte UMCE es Marisol Hernández (DIPOS).

[DATO] Cecilia Saint-Pierre: directora del FONDEF ID25I10459 ($237 millones, 24 meses) en UChile.

[DATO] Richard Weber: UChile, vinculado al FONDEF.

[DATO] Eric Silva: docente UMCE creando el curso piloto de IA.

[DATO] Francisco Segovia: persona en UMCE con quien se coordinará el traspaso de plataforma a servidores UMCE. Ha validado el sistema de respaldo y restauración.

[DATO] Braulio Ibarra: doctorando de UChile investigando comportamiento de usuarios en la plataforma.

[DATO] Guillermo: referenciado como modelo de formato de reuniones quincenales (no se especifica institución).

[DATO] David (Reyes): presentó el enfoque de "capa amigable" que integra múltiples plataformas mediante APIs, y es lider de Mesa 1 de virtualización UMCE.

[DATO] Solange Tenorio: mencionada como actora UMCE en la memoria del proyecto.

### 1.4 Compromisos y plazos concretos

[DATO] Darío (UChile): terminar el curso de Eric Silva para fines de mes.

[DATO] David y Marisol: reunirse para revisar propuesta de piloto y presentarla a la rectora.

[DATO] David: coordinar con Francisco Segovia reunión sobre traspaso de plataforma a servidores UMCE.

[DATO] Equipo UChile: realizar cambios de imagen por cambio de dependencia administrativa.

[DATO] Equipo conjunto: planificar lanzamiento del curso piloto con académicos UMCE, CUECH y UNESCO.

[DATO] Equipo conjunto: establecer reuniones quincenales de coordinación.

[DATO] Equipo conjunto: considerar redacción de publicación conjunta sobre la experiencia.

[DATO] Equipo UChile: preparar documentación NDA para protección de datos de usuarios.

### 1.5 Estado técnico de la plataforma

[DATO] Plataforma Open EdX instalada y funcionando en cursos.umce.cl.

[DATO] Sistema de respaldo y restauración operativo, validado con Francisco Segovia.

[DATO] Capacitaciones realizadas en configuración de cursos, certificados y reportería.

[DATO] Las máquinas están físicamente en Torre 15 de UChile pero son virtuales (VM).

[DATO] UMCE tiene la versión 3 de Open EdX. UChile va en versión 10.

[DATO] La plataforma tiene API nativa rica para integraciones.

[DATO] La plataforma incluye Experience API para análisis de aprendizaje.

[DATO] Existe sistema de e-commerce y boleta electrónica en planificación (no implementado aún).

### 1.6 FONDEF

[DATO] UChile ganó un FONDEF sobre dashboard para profesores.

[DATO] UChile ganó un segundo FONDEF sobre acompañamiento a estudiantes usando métricas.

[DATO] La memoria del proyecto señala el FONDEF ID25I10459 ($237 millones, 24 meses, directora Cecilia Saint-Pierre), con UMCE como entidad asociada. Los datos de estudiantes UMCE alimentan investigación de learning analytics y ML. UMCE es simultáneamente cliente y sujeto de investigación.

---

## 2. Oportunidades No Visibles en el Resumen

### 2a. Open Badges 3.0 sobre EdX

**Qué es**: EdX tiene su propio sistema de certificados (Certificate de Open EdX). Paralelamente, la UDFV tiene infraestructura OB 3.0 lista (6 librerías MIT DCC instaladas, schema SQL de badges y microcredenciales diseñado, firma Ed25519 lista). La pregunta es si se pueden emitir credenciales verificables desde los cursos EdX usando la infraestructura OB 3.0 de la UDFV, en lugar del sistema de certificados nativo de EdX.

**Por qué importa para la UDFV**: El sistema de certificados nativo de Open EdX emite PDFs y tiene integración con Accredible y Badgr (plataformas comerciales). Ninguna de estas opciones produce credenciales OB 3.0 con infraestructura propia y soberanía de datos. Si la UDFV quiere que los cursos EdX de la UMCE emitan credenciales verificables de primer nivel, necesita un puente entre la API de EdX y el sistema OB 3.0 propio.

**Cómo conecta con lo que ya tenemos**: La API nativa de Open EdX expone los eventos de completitud de cursos (enrollment, grade, certificate). El sistema OB 3.0 de la UDFV puede suscribirse a esos eventos y emitir una credencial verificable automáticamente cuando un estudiante aprueba. Técnicamente: EdX emite su certificado PDF estándar y, en paralelo, la API de la UDFV emite la credencial OB 3.0. El estudiante recibe ambos. El receptor que quiera verificar usa el OB 3.0. Esto no requiere modificar EdX: solo un webhook o consulta periódica a la API de completitud de EdX.

**Qué haría falta**: Un servicio Node.js (dentro del stack de umce-online, Express) que consulte la API de EdX para detectar nuevas completitudes, y que dispare la emisión OB 3.0 contra el sistema que ya está diseñado. El endpoint de edición de credenciales ya está especificado (17 endpoints planificados). La complejidad técnica es baja porque ambos sistemas tienen API REST.

**Riesgo de no actuar**: Si se lanza el curso piloto de IA y los participantes reciben solo un PDF de EdX, se pierde la oportunidad de demostrar las credenciales verificables en un escenario real. El piloto con académicos UMCE y CUECH es exactamente el tipo de audiencia que valoraría tener una credencial verificable en LinkedIn. La ventana para incluir esto en el lanzamiento piloto es estrecha.

[ANÁLISIS] Este es el punto de mayor convergencia técnica inmediata. No requiere cambios institucionales ni aprobaciones. Solo requiere que la UDFV conecte sus dos sistemas existentes (EdX API + OB 3.0 stack) antes del lanzamiento del piloto.

---

### 2b. Dashboard + FONDEF: Colaboración o Competencia

**Qué es**: UChile tiene dos FONDEF relacionados con EdX: uno sobre dashboard para profesores y otro sobre acompañamiento a estudiantes. La UDFV tiene dashboard.udfv.cloud (v4.1.1) operativo, que integra datos de 5 plataformas Moodle. Son sistemas distintos sobre plataformas distintas, pero el objetivo es el mismo: dar visibilidad de datos de aprendizaje a docentes e instituciones.

**Por qué importa para la UDFV**: El FONDEF que financia UChile tiene a UMCE como entidad asociada. Esto significa que los datos de estudiantes UMCE se usan en la investigación. Lo que no está claro en la transcripción es si los outputs del FONDEF (el dashboard desarrollado por UChile) estarán disponibles para la UMCE, o si solo sirven como fuente de datos para la investigación de UChile.

**Cómo conecta con lo que ya tenemos**: dashboard.udfv.cloud ya integra datos de Moodle, UCampus (schema en Supabase), y tiene arquitectura para agregar fuentes. Si el dashboard de UChile estuviera disponible para la UMCE, podría coexistir con el de la UDFV para distintos propósitos: el de UChile para datos EdX específicos, el de la UDFV para la vista integrada multi-plataforma. La alternativa es construir la integración EdX directamente en dashboard.udfv.cloud.

**Qué haría falta**: Clarificar en la próxima reunión con Marisol o Darío cuáles son los entregables del FONDEF para la UMCE como entidad asociada. ¿Hay compromisos formales de compartir el dashboard con la UMCE? ¿O la UMCE solo aporta datos y no recibe outputs?

**Riesgo de no actuar**: Si la UMCE no pregunta, asume tácitamente que el FONDEF solo la usa como fuente de datos. Eso significa que los datos de estudiantes UMCE alimentan investigación que produce conocimiento y herramientas que quedará en UChile, mientras la UMCE no capitaliza nada técnicamente. La clarificación de este punto tiene valor económico real: si los outputs del FONDEF son utilizables por la UMCE, no habría que construir lo que ya está siendo financiado.

[ANÁLISIS] Hay una asimetría de poder no declarada: UMCE es "cliente y sujeto de investigación" al mismo tiempo. David levantó una alerta de gobernanza en octubre 2025. Esta reunión es la oportunidad de formalizar qué recibe la UMCE a cambio de sus datos, no solo qué paga y qué obtiene en plataforma.

---

### 2c. Learning Analytics y xAPI: Integración con Ralph LRS

**Qué es**: Open EdX tiene soporte nativo para Experience API (xAPI). La UDFV tiene Ralph LRS operativo en lrs.udfv.cloud, actualmente usado para el proyecto de Inducción UMCE 2026 en virtual.umce.cl. El punto de convergencia es que los statements xAPI generados por EdX podrían ir al mismo LRS donde ya van los de Moodle, creando una base de datos de trayectorias de aprendizaje unificada.

**Por qué importa para la UDFV**: Hoy la UDFV tiene learning analytics de Moodle y no tiene learning analytics de EdX. Si EdX reporta xAPI a Ralph LRS, la visibilidad de lo que hacen los estudiantes en EdX (pausas en videos, intentos en ejercicios, completitud de módulos) quedaría en la misma infraestructura que ya gestiona la UDFV, bajo soberanía institucional. Esto es directamente relevante para el FONDEF: UChile estudia el comportamiento de usuarios (Braulio Ibarra, doctorado). Si la UMCE tiene sus propios datos xAPI en Ralph LRS, tiene su propia capa de análisis independiente de los resultados del FONDEF.

**Cómo conecta con lo que ya tenemos**: Ralph LRS acepta statements xAPI estándar. Open EdX puede configurarse para enviar tracking events como statements xAPI a un endpoint externo. La conexión requiere configuración en EdX (xAPI plugin o XBlock xAPI) y tiene el endpoint receptor listo en lrs.udfv.cloud/xAPI/. No requiere desarrollo nuevo: solo configuración.

**Qué haría falta**: Coordinar con Darío que se active el plugin xAPI de EdX apuntando al Ralph LRS de la UDFV. Esto requiere una decisión técnica y probablemente la aprobación de Francisco Segovia (quien maneja la plataforma en el lado UMCE). El NDA que está preparando UChile para protección de datos de usuarios es relevante: antes de activar el flujo xAPI, debe estar claro quién es el custodio de esos datos.

**Riesgo de no actuar**: La investigación del FONDEF sobre comportamiento de usuarios (Braulio Ibarra) tiene acceso a los datos de EdX. Si la UDFV no construye su propia capa de xAPI, toda la analítica de EdX queda del lado de UChile y la UMCE solo ve lo que UChile le muestra. Para los tableros de indicadores de Mesa 1 (Producto 4), los datos xAPI de EdX serían un activo de alto valor.

---

### 2d. Modelo de Ingresos y PESFUERF 2026

**Qué es**: UChile genera $300 millones anuales con su plataforma. El modelo principal es cobro de certificados (contenido gratuito, certificado de pago) o pago por inscripción. UChile usó un modelo de incentivos económicos donde el equipo académico recibe el 35% de las utilidades de los cursos que desarrolla. La transcripción menciona el PESFUERF 2026 como marco institucional con objetivo de sostenibilidad económica y eficiencia de recursos.

**Por qué importa para la UDFV**: El piloto de IA para docentes es el primer caso de uso real de EdX en la UMCE. La decisión de si será gratuito o de pago sienta precedente para el modelo de toda la plataforma. Si el piloto es gratuito (para académicos UMCE y CUECH), demuestra valor institucional pero no genera ingresos. Si incorpora un componente de pago (certificado de $15.000 por ejemplo, como U Abierta), genera ingresos y demuestra que el modelo funciona.

**Cómo conecta con lo que ya tenemos**: El sistema de e-commerce y boleta electrónica está en planificación pero no implementado. Antes de cualquier lanzamiento con cobro, se necesita resolver ese punto. La UDFV tiene experiencia con Supabase y podría gestionar el backend de pagos si se decide avanzar, aunque esto requeriría integración con sistemas de facturación institucional de la UMCE.

**Qué haría falta**: Definir, en la reunión con Marisol, si el piloto es gratuito o de pago. Si es de pago, necesita presupuesto para resolver e-commerce. Si es gratuito, se debe establecer criterio de sustentabilidad para los cursos siguientes. El PESFUERF 2026 menciona formación flexible y articulada entre educación continua, pregrado y posgrado: los cursos de extensión son candidatos naturales al cobro, mientras los CFG (CUECH/Súbete) seguirían siendo gratuitos.

**Riesgo de no actuar**: El convenio con UChile tiene un costo implícito por cuota ya pagado. Si EdX no genera ingresos antes del fin del convenio (junio 2027), el costo neto para la UMCE es de $64 millones sin retorno. El modelo de ingresos no es opcional: es la condición para que la plataforma sea sostenible después de junio 2027.

[ANÁLISIS] El modelo más rápido de implementar para la UMCE es el de U Abierta: landing WordPress externo con contenido gratuito y cobro solo del certificado. No requiere e-commerce complejo: puede hacerse con Webpay o transacción manual para el piloto. El aprendizaje de UChile con su curso de IA ($25-40 millones con difusión en medios) es directamente replicable si el curso de Eric Silva tiene calidad suficiente.

---

### 2e. CUECH + UNESCO: Extensión del Piloto

**Qué es**: La transcripción menciona que el plan es extender el curso piloto de IA para docentes a académicos del CUECH y a la red UNESCO. Esto no es una idea vaga: es un compromiso del equipo conjunto.

**Por qué importa para la UDFV**: El Programa Súbete del CUECH ya tiene coordinador en la UMCE (Elías Sánchez González, movilidad@umce.cl, DRICI). Si el curso de IA para docentes se lanza bajo el paraguas del CUECH, la UMCE pasa de ser una plataforma más a ser la primera universidad estatal con un curso MOOC extendido a toda la red del consorcio. Esto coincide directamente con la propuesta de Mesa 1 de posicionar a la UMCE como referente técnico en el CUECH.

**Cómo conecta con lo que ya tenemos**: La investigación de microcredenciales identifica que ninguna universidad del CUECH emite credenciales verificables OB 3.0 para los cursos Súbete. Si el curso de IA para docentes emite credenciales OB 3.0 (ver punto 2a), y se lanza a académicos del CUECH, la UMCE demuestra el modelo completo: plataforma abierta, contenido de calidad, credencial verificable, red de distribución CUECH. Esa combinación no existe en ninguna universidad estatal chilena hoy.

**Qué haría falta**: Coordinar con Elías Sánchez antes del lanzamiento para determinar si el curso puede formalizarse como curso Súbete (requiere que sea CFG de 2 SCT) o si opera como extensión voluntaria para académicos. La diferencia es administrativa, no técnica. Para UNESCO, el canal no está identificado en la transcripción: habría que preguntar a Darío quién gestiona esa vinculación.

**Riesgo de no actuar**: Si el lanzamiento al CUECH se hace sin coordinar con Elías Sánchez y sin credenciales verificables, el impacto queda limitado a un evento de difusión. La oportunidad de posicionamiento requiere que el sistema completo funcione: plataforma + credencial + red de distribución.

---

### 2f. Traspaso a Servidores UMCE: Implicaciones para umce.online

**Qué es**: UMCE instaló un datacenter moderno. Se está planificando trasladar las máquinas virtuales de EdX desde Torre 15 de UChile a servidores propios de la UMCE. David debe coordinar con Francisco Segovia una reunión sobre este tema.

**Por qué importa para la UDFV**: El traspaso implica que el equipo TI de UMCE deberá mantener Open EdX de forma independiente. Esto es un cambio de responsabilidad: hoy es UChile quien gestiona la infraestructura. Más relevante para umce-online: si EdX migra a servidores UMCE, la integración entre EdX y el ecosistema UDFV (dashboard, Ralph LRS, OB 3.0, UCampus) se vuelve más directa porque todo estaría en la misma red institucional.

**Cómo conecta con lo que ya tenemos**: El VPS UMCE (82.29.61.165) ya aloja el ecosistema UDFV (Supabase self-hosted, n8n, dashboard, Gestor de Sesiones, umce.online en producción). Si EdX migra al datacenter UMCE, la integración entre sistemas puede hacerse por red interna en lugar de pasar por internet público, lo que reduce latencia y simplifica autenticación entre servicios. El equipo UDFV tiene experiencia en Docker y CI/CD (deploy.yml en GitHub Actions) que podría ser valioso para el equipo TI de UMCE cuando asuma el mantenimiento de EdX.

**Qué haría falta**: Antes de la reunión con Francisco Segovia, mapear qué servicios UDFV podrían integrarse de manera más directa una vez que EdX esté en red UMCE. Esto incluye: Ralph LRS (xAPI), dashboard.udfv.cloud, sistema OB 3.0, y potencialmente SSO con Google @umce.cl.

**Riesgo de no actuar**: Si el traspaso se hace sin que la UDFV esté en la mesa, la arquitectura resultante puede dificultar las integraciones futuras. El equipo TI de UMCE puede instalar EdX sin considerar los endpoints de xAPI, webhooks de certificados o APIs de UCampus que la UDFV necesita. El momento de influir en la arquitectura es durante la planificación del traspaso, no después.

---

### 2g. Versión 3 vs. Versión 10: Capacidades Perdidas

**Qué es**: UMCE tiene Open EdX versión 3. UChile va en versión 10. Hay 7 versiones de diferencia.

**Por qué importa para la UDFV**: No se pueden usar las instrucciones técnicas de UChile (que opera v10) directamente en la instalación de UMCE (v3). Los plugins, APIs y configuraciones pueden ser distintos. Las librerías xAPI, los sistemas de certificados, los módulos de reportería, el LTI support y la API REST tienen diferencias significativas entre versiones. Si la UDFV planifica integraciones basándose en documentación de EdX v10, puede encontrar que no funcionan en v3.

**Cómo conecta con lo que ya tenemos**: La API de EdX que la transcripción menciona como "rica y nativa" puede referirse a la versión que UChile tiene, no a la que la UMCE tiene. Antes de diseñar cualquier integración (xAPI, OB 3.0 webhooks, UCampus), se debe verificar qué endpoints están disponibles en EdX v3.

**Qué haría falta**: Obtener de Darío (o de la documentación técnica de EOL) la lista de capacidades disponibles en EdX v3. La transcripción menciona que "hay mejoras significativas en uniformidad de código entre versiones", lo que sugiere que v10 tiene mejor código pero no necesariamente mejores funcionalidades de usuario. La pregunta concreta es: ¿EdX v3 tiene el plugin xAPI habilitado? ¿Tiene la REST API de completitud de cursos? ¿Puede emitir webhooks?

**Riesgo de no actuar**: Construir integraciones que no funcionan. Este es un riesgo técnico concreto y verificable. La reunión con Darío o Francisco Segovia es el momento para clarificarlo. El tiempo para actualizar a versiones más recientes debería considerarse en el plan de traspaso al datacenter UMCE.

---

### 2h. UCampus: El Puente que la UDFV Puede Construir

**Qué es**: La transcripción menciona que la integración con UCampus y el sistema de matrículas está pendiente para EdX. Simultáneamente, la UDFV ya está integrando UCampus con su propio esquema en Supabase (17 tablas, cron 2 veces al día) y usando la UCampus REST API para consultar estudiantes y docentes.

**Por qué importa para la UDFV**: La integración UCampus-EdX que Marisol y la institución necesitan es exactamente lo que la UDFV ya sabe hacer. Hoy en la UMCE nadie más tiene la experiencia de haber integrado UCampus con un sistema de gestión académica. Esto es un activo técnico que posiciona a la UDFV como el actor natural para ejecutar esa integración.

**Cómo conecta con lo que ya tenemos**: El schema `ucampus` en Supabase tiene las tablas necesarias para saber qué estudiantes están inscritos en qué programa. Si EdX necesita verificar matrícula antes de dar acceso a un curso, o si necesita importar estudiantes por cohorte, el flujo puede pasar por el schema `ucampus` ya existente en lugar de construir una integración nueva desde cero. La UDFV sería el intermediario técnico entre UCampus y EdX.

**Qué haría falta**: Proponer a Marisol que la integración UCampus-EdX sea ejecutada por la UDFV como parte de la "capa amigable" que David ya presentó en la reunión. Esto requiere definir el scope técnico: ¿qué datos necesita EdX de UCampus? ¿matrícula vigente? ¿RUT para autenticación? ¿programas inscritos?

**Riesgo de no actuar**: Si la integración UCampus-EdX la hace el equipo TI de UMCE o UChile sin la UDFV, se construye en paralelo a lo que ya existe en Supabase, duplicando trabajo y creando inconsistencias en los datos. La UDFV queda desplazada de un proceso donde tiene la mayor capacidad técnica.

---

### 2i. Single Sign-On: Google OAuth como Puente

**Qué es**: La transcripción menciona que UMCE no tiene SSO institucional implementado, y que esto es un desafío de integración para EdX. La UDFV tiene implementado Google OAuth con dominio @umce.cl para umce-online (restricción `hd: umce.cl`).

**Por qué importa para la UDFV**: Open EdX soporta autenticación OAuth2 con proveedores externos, incluyendo Google. Si se configura EdX para usar el mismo proveedor de identidad que umce-online (Google @umce.cl), los usuarios de la UMCE podrían usar las mismas credenciales para acceder a EdX, dashboard.udfv.cloud, umce-online y cualquier otro sistema que use Google OAuth. Esto no es un SSO institucional completo (que requeriría un servidor SAML o un servidor OAuth propio), pero es una solución funcional de corto plazo.

**Cómo conecta con lo que ya tenemos**: El sistema de auth de umce-online ya tiene implementado el flujo OAuth con Google (`hd: umce.cl`). Si EdX se configura para usar el mismo OAuth client, no se necesita infraestructura adicional. El usuario entra con su cuenta @umce.cl en EdX exactamente igual que en umce-online.

**Qué haría falta**: Verificar que EdX v3 soporte OAuth2/OpenID Connect con Google (es una capacidad estándar de Open EdX). Obtener las credenciales del OAuth client que ya está configurado en GCP para umce-online o crear uno nuevo. Coordinar la configuración con Darío o Francisco Segovia.

**Riesgo de no actuar**: Sin SSO, cada plataforma tiene sus propias credenciales. Los usuarios tienen que recordar contraseñas distintas para EdX, Moodle, umce-online, dashboard. Esto reduce la adopción. El costo de no resolver el SSO es medible en abandono de plataforma.

---

### 2j. Publicación Conjunta: El Aporte Específico de la UDFV

**Qué es**: La transcripción menciona que el equipo conjunto considerará la redacción de una publicación conjunta sobre la experiencia.

**Por qué importa para la UDFV**: Una publicación académica conjunta UChile-UMCE tiene valor para ambas instituciones, pero para la UDFV tiene valor adicional: es evidencia concreta para la acreditación CNA (Criterio 4 sobre investigación e innovación docente) y posiciona el trabajo de la UDFV en la literatura académica de educación virtual en Chile.

**Cómo conecta con lo que ya tenemos**: Los productos de Mesa 1 (ADDIE adaptado, sistema de cálculo SCT, planificador de diseño instruccional, rúbrica QA, tablero de indicadores) son contribuciones originales con fundamento teórico documentado en la NARRATIVA-MESA1-BORRADOR.md. La investigación de microcredenciales-ob3-abril2026.md es un documento de investigación con fuentes verificadas. El modelo MOCA tiene fundamentación teórica avanzada (6 de abril 2026). Hay suficiente material original para una contribución de valor real a una publicación conjunta.

**Qué haría falta**: Proponer que la publicación no sea solo sobre la implementación técnica de EdX (lo que aportaría principalmente UChile) sino sobre el modelo institucional completo de virtualización que incluye: diseño instruccional con ADDIE adaptado, cálculo SCT, QA de cursos, y análisis de learning analytics. Eso es lo que la UDFV puede aportar que UChile no tiene.

**Riesgo de no actuar**: Si no se define el aporte de la UDFV antes de que UChile proponga el scope de la publicación, la UMCE quedará como caso de estudio (sujeto) y no como co-autora con contribución propia. Ese es exactamente el mismo patrón que ocurre con el FONDEF.

---

## 3. Elementos No Resueltos y Riesgos Detectados

### 3.1 Compromisos sin responsable claro

[ANÁLISIS] El ítem "Equipo conjunto: planificar lanzamiento del curso piloto con académicos UMCE, CUECH y UNESCO" no tiene fecha ni responsable específico. El lanzamiento involucra a Darío (UChile, debe terminar el curso), a David y Marisol (deben presentar propuesta a rectora), y a Elías Sánchez (DRICI, canal CUECH). Ninguno de ellos es convocado formalmente en los ítems de acción.

[ANÁLISIS] El ítem "NDA para protección de datos de usuarios" quedó del lado de UChile pero sin fecha. Si hay un piloto con estudiantes reales antes de que exista el NDA, hay un problema legal. El NDA debe preceder al lanzamiento del piloto, no seguirlo.

### 3.2 Dependencias de decisiones políticas

[ANÁLISIS] La reunión entre David y Marisol para "revisar propuesta de piloto y presentar a la rectora" es un cuello de botella crítico. Todo el plan (lanzamiento del piloto, extensión a CUECH, publicación conjunta, coordinación quincenales) depende de que la rectora apruebe o valide la propuesta. No se sabe si esa reunión tiene fecha.

[ANÁLISIS] Los cambios de imagen por cambio de dependencia administrativa (ítem de UChile) sugieren que la plataforma EdX estaba vinculada a una dependencia anterior que cambió con el cambio de autoridades. El reposicionamiento institucional mencionado ("para lograr mayor adherencia") indica que el proyecto no tiene aún el respaldo político pleno que necesita para la Etapa 3.

[ANÁLISIS] La DIPOS (Dirección de Postgrado) y otras unidades académicas no están presentes en la reunión. El proyecto sigue siendo un esfuerzo de la UDFV y el VRI, sin que las facultades que deberían usar la plataforma tengan representación.

### 3.3 Timelines potencialmente imposibles

[ANÁLISIS] El curso de IA tenía 60% de avance con estimación de completarse a fines de marzo. La reunión es el 7 de abril. Si no está terminado, el timeline del piloto ya se retrasó. El lanzamiento del piloto con CUECH y UNESCO requiere coordinación adicional que no se hará en días.

[ANÁLISIS] La Etapa 3 (producción) empieza en agosto 2026. Entre hoy (7 de abril) y agosto hay 4 meses. En ese período la UMCE debe: terminar el curso piloto, lanzarlo, recoger aprendizajes, resolver UCampus/matrícula/e-commerce, y preparar la plataforma para producción. Cada uno de esos ítems tiene su propio cuello de botella institucional.

### 3.4 Desalineamientos entre equipos

[ANÁLISIS] Hay una tensión no resuelta entre el rol técnico de la UDFV (que construyó la "capa amigable" y tiene las integraciones) y el liderazgo institucional de Marisol (que toma las decisiones). La transcripción menciona que la UDFV está "siendo desplazada del liderazgo" (memoria del proyecto). Si la UDFV no tiene un rol formal en la estructura de gobierno del proyecto EdX, sus capacidades técnicas quedan subordinadas a decisiones que toman otros.

[ANÁLISIS] El equipo TI de UMCE no está presente en la reunión, pero deberá mantener la plataforma después del traspaso. Esta ausencia significa que cuando llegue el traspaso, el equipo TI estará entrando al proyecto sin haber participado en las decisiones de diseño. Eso es un riesgo operativo.

[ANÁLISIS] La relación FONDEF (UMCE como sujeto de investigación) versus el interés de la UDFV en construir sus propias capacidades de learning analytics crea una tensión no declarada. Si UChile publica los resultados de su análisis sobre comportamiento de usuarios UMCE, la UMCE queda como caso de estudio en la literatura académica de otra institución.

---

## 4. Conexión con los Productos de Mesa 1

### 4.1 EdX en los cinco momentos

**Momento 1 (Definir créditos y horas)**: EdX como plataforma no cambia la necesidad del sistema de cálculo SCT. Los cursos EdX también necesitan créditos y horas definidos institucionalmente, especialmente si se quieren ofrecer como cursos Súbete de 2 SCT. El sistema de cálculo SCT aplica a EdX exactamente igual que a Moodle.

**Momento 2 (Diseñar el PAC)**: El PAC precede a la plataforma. Si un curso va a EdX en lugar de Moodle, el proceso de elaboración del PAC no cambia. Lo que cambia es el Momento 4.

**Momento 3 (Diseñar el PIAC con el planificador instruccional)**: El planificador está diseñado para cuatro unidades de cálculo: semestral, módulo de ocho semanas, microcredencial y curso Súbete de 2 SCT. EdX es el tipo de plataforma para la que están diseñadas las dos últimas unidades: los cursos MOOC son por naturaleza más cortos que un semestre completo. Esto significa que el planificador instruccional es más relevante para EdX que para Moodle en muchos casos de uso.

[ANÁLISIS] El planificador instruccional debe incluir explícitamente EdX como plataforma de implementación en su catálogo de herramientas. Hoy las 37 e-actividades están calibradas para el entorno Moodle. Para EdX, el catálogo de herramientas disponibles es diferente (XBlocks, componentes de video, problemas OLX, etc.). Agregar EdX como opción de plataforma en el planificador no requiere rediseñar el sistema: solo requiere agregar los tipos de e-actividad específicos de EdX al catálogo.

**Momento 4 (Implementar en LMS)**: Aquí es donde EdX cambia más respecto a Moodle. Los procesos SGIC describen el flujo para Moodle. Si EdX se usa como plataforma adicional, se necesita un procedimiento paralelo para EdX. Esto es trabajo para la UDFV en coordinación con Darío: documentar el proceso de construcción de un curso en EdX con el mismo nivel de detalle que existe para Moodle.

**Momento 5 (Monitorear y retroalimentar)**: El tablero de indicadores (Producto 4 de Mesa 1) necesita datos. Para los cursos EdX, esos datos vienen de la API de EdX y del Ralph LRS si se activa xAPI. Sin integración xAPI, el Momento 5 de los cursos EdX queda sin datos. Con la integración, el tablero puede mostrar métricas de EdX junto a las de Moodle en una vista unificada.

### 4.2 La calculadora SCT y EdX

[ANÁLISIS] La calculadora SCT aplica con mayor urgencia a EdX que a Moodle en el contexto actual. Los cursos de Moodle generalmente ya tienen créditos definidos por resolución exenta. Los cursos nuevos que se creen para EdX (como el piloto de IA, como los cursos CUECH) necesitarán créditos definidos desde cero. La calculadora SCT es el instrumento para hacerlo con rigor.

Para los cursos EdX que no tienen créditos (cursos de extensión sin equivalente SCT), la calculadora puede usarse en modo referencial: cuántas horas debería tomar el curso al estudiante, independientemente de si se emite un crédito formal.

### 4.3 La rúbrica QA y los cursos EdX

[ANÁLISIS] La rúbrica QA de Mesa 1 está diseñada para evaluar cursos virtuales según criterios pedagógicos. Si la rúbrica se construye con criterios neutros respecto a la plataforma (estructura, actividades, evaluación, retroalimentación, carga), puede aplicar tanto a Moodle como a EdX. Si se construye con criterios específicos de Moodle (configura esto en la sección X de Moodle), no aplica a EdX sin modificaciones.

Recomendación técnica: la rúbrica QA debería separar los criterios pedagógicos (independientes de la plataforma) de los criterios de implementación técnica (específicos de cada plataforma). Eso la hace aplicable a EdX sin rediseño conceptual.

### 4.4 El planificador instruccional y EdX

[ANÁLISIS] Esta es la conexión más directa y accionable de Mesa 1 con EdX. El planificador instruccional puede diseñar cursos para EdX si se agregan los XBlocks disponibles al catálogo de e-actividades. Los cursos MOOC tienen una lógica de diseño instruccional específica (módulos cortos, video como e-actividad central, problemas de práctica auto-corregidos, certificado al final) que el planificador debería poder capturar. La unidad de cálculo "microcredencial" y "curso Súbete de 2 SCT" que ya están en el planificador son exactamente el tipo de curso para el que EdX está diseñado.

---

## 5. Recomendaciones Concretas para David

### 5.1 Esta semana (7-11 de abril 2026)

**Acción 1: Clarificar el estado del curso piloto de IA.** El curso de Eric Silva debía estar terminado a fines de marzo. Si no está terminado, el plan de lanzamiento piloto está retrasado. Antes de la reunión con Marisol, conviene saber el estado real del curso para presentar un plan con fechas realistas y no comprometerse a plazos que no se cumplirán.

**Acción 2: Verificar capacidades de EdX v3.** Antes de diseñar cualquier integración, verificar con Darío o en la documentación técnica de EOL si EdX v3 tiene: (a) REST API de completitud de cursos activa, (b) soporte de xAPI habilitado o habilitatable, (c) OAuth2 con Google habilitado. Esta verificación toma menos de 30 minutos y define qué es técnicamente posible en el corto plazo.

**Acción 3: Preparar agenda para la reunión con Marisol.** La reunión con Marisol no debería ser solo "revisar propuesta de piloto". Debería incluir explícitamente: (a) rol formal de la UDFV en la estructura de gobierno del proyecto EdX, (b) qué recibe la UMCE a cambio de participar como entidad asociada en el FONDEF (outputs concretos, no solo datos de entrada), (c) decisión de modelo de ingresos para el piloto (gratuito vs. pago), (d) cronograma realista para Etapa 3.

### 5.2 Qué proponer en la reunión con Marisol

**Propuesta 1: Rol técnico formal de la UDFV en EdX.** La UDFV construyó la integración de 5 plataformas Moodle. Tiene el único equipo institucional con capacidad de integrar UCampus con un LMS. Tiene el Ralph LRS para xAPI. Tiene la infraestructura OB 3.0 lista. Proponer que la UDFV sea el equipo técnico responsable de las integraciones EdX, con mandato explícito de Marisol. Sin ese mandato, la UDFV seguirá actuando en los márgenes.

**Propuesta 2: Lanzamiento del piloto con credenciales verificables.** Proponer que el curso piloto de IA emita credenciales OB 3.0 verificables, no solo el certificado PDF de EdX. La razón es estratégica: si el piloto va al CUECH y a UNESCO, los participantes que reciben una credencial verificable en LinkedIn son demostración pública del sistema completo. El costo técnico es bajo (el sistema OB 3.0 ya está diseñado), el impacto comunicacional es alto.

**Propuesta 3: Integración UCampus como proyecto UDFV.** La integración UCampus-EdX está pendiente y nadie la tiene en su lista de tareas con responsable claro. Proponer que la UDFV la ejecute usando el schema `ucampus` ya existente en Supabase como intermediario. Esto posiciona a la UDFV como actor indispensable antes de la Etapa 3.

**Propuesta 4: Clarificar la contraprestación del FONDEF.** Antes de que la UMCE aporte más datos al FONDEF, establecer por escrito qué recibe la UMCE a cambio: ¿acceso al dashboard desarrollado por UChile? ¿co-autoría en publicaciones? ¿transferencia tecnológica? La posición "UMCE es cliente y sujeto de investigación" es una asimetría que puede renegociarse ahora que hay nuevo equipo institucional liderado por Marisol.

### 5.3 Qué posicionar estratégicamente

**Posicionamiento 1: La UDFV como integradora, no como usuaria.** El mensaje estratégico para la institución es que la UDFV no solo "usa" EdX: la UDFV es quien puede hacer que EdX funcione con el resto del ecosistema UMCE. Eso es un activo diferencial que ninguna otra unidad institucional tiene. Ese posicionamiento debe ser explícito en la reunión con Marisol y en cualquier comunicación hacia arriba en la jerarquía.

**Posicionamiento 2: Los productos de Mesa 1 aplican a EdX.** El planificador instruccional, la calculadora SCT, la rúbrica QA, y el tablero de indicadores no son "herramientas para Moodle". Son herramientas para la virtualización institucional de la UMCE, independientemente de la plataforma. Que EdX se incorpore al ecosistema UMCE no hace obsoletos los productos de Mesa 1: los hace más necesarios, porque ahora hay una segunda plataforma que necesita los mismos instrumentos de diseño y calidad.

**Posicionamiento 3: La UMCE puede ser first mover en credenciales verificables para el CUECH.** Ninguna universidad del CUECH emite credenciales OB 3.0. El piloto de IA con académicos del CUECH es la oportunidad de ser los primeros. Si eso se hace bien, la UMCE puede proponer al consorcio la adopción del estándar. Ese es el tipo de liderazgo técnico que la investigación de microcredenciales identificó como oportunidad estratégica.

**Posicionamiento 4: La publicación conjunta debe reflejar el aporte real de la UDFV.** Si se avanza en la publicación conjunta con UChile, el aporte de la UMCE/UDFV debe ir más allá de "así implementamos EdX". La narrativa debe incluir el modelo institucional completo: ADDIE adaptado, cálculo SCT, diseño instruccional, credenciales verificables. Ese es el aporte original que la UMCE tiene y UChile no. Coordinar con Darío el scope de la publicación antes de que UChile lo defina unilateralmente.

---

*Documento generado el 7 de abril de 2026 como insumo estratégico para la UDFV. Fuentes: transcripción de reunión UMCE-UChile, NARRATIVA-MESA1-BORRADOR.md, investigacion-microcredenciales-ob3-abril2026.md, memory/project_edx_fondef.md.*
