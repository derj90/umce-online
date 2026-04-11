# Inventario Notion UDFV — 6 abril 2026
> Inventario plano de todo lo encontrado en el workspace. Sin juicios, sin propuestas.
> Para que David o Claude Code pueda trabajarlo por partes.

---

## BASES DE DATOS encontradas

| # | Nombre | ID | Tipo | Relaciones |
|---|---|---|---|---|
| 1 | 🎯 Proyectos | 1a0927a437224885846985d0308c9dad | DB con data source 4641d095 | → Cursos virtuales, Tareas, Tutoras/es, Incidencias |
| 2 | Cursos virtuales | 73021873771d450681a7bea7697b4d93 | DB, data source 814da2a2 | → Proyectos, Tutoras/es, Incidencias |
| 3 | Tareas | (data source 2afad82d) | DS relacionada desde Proyectos | → Proyectos |
| 4 | Registro de tutoras/es | 7d324f96c57043849791c5762024c30b | DB, data source 912cfea2 | → Proyectos, Cursos virtuales |
| 5 | Reporte de incidencias y apoyo | e4e4737ca97a486abda5e6a6e11bec64 | DB, data source f6f35d55 | → Proyectos, Cursos virtuales |
| 6 | Base de datos de registros | 06b2eb8cd4f9410286f209ffd019bcdd | DB | — |
| 7 | Proyectos UDFV 2026 | a8aac618278d408a9dc6fd497ef848a2 | DB en Hub, data source 43daabe7 | Sin relaciones |
| 8 | BD acciones equipo | 7982e3dfa130422f9cf5dbff185daff9 | DB/page en Hub | — |
| 9 | BD Recordatorios UDFV | e567722953d247e0bc6163cf4d9d3b62 | DB en Hub | — |
| 10 | Base de datos cursos virtual/evirtual/practica | 27f07785527980b7abb8c9b266c704a5 | DB | — |
| 11 | 📝 Registro de Sesiones | cdc0dc4ad1264322843316f0d53e1932 | DB | — |
| 12 | Wiki UDFV | 31407785527980219ecddd40d3a4e2f0 | DB (wiki) | — |
| 13 | Base de datos (sin nombre) | 1d807785527980439d75ebd8bae3e2a6 | DB | — |
| 14 | 🍽️ Registro de Alimentación | 46a8378f5ddb40519b8543fa32286f6b | DB (personal?) | — |

Nota: las BDs de Bitácora Coordinación y Reuniones están inline dentro de páginas, no confirmé sus IDs separados.

---

## ESTRUCTURA DEL HUB (hijos directos e indirectos)

### 🏠 UDFV Hub (2ea0778552798150861bc68d08090236)

#### Sección: 🎓 Cursos y Programas (33a0778552798131b39fc0682b534302)
| Página | ID |
|---|---|
| Prosecución Ed Básica | 2a1077855279800bb206c301798fffd2 |
| Prosecución Física Química | 2a107785527980178eaff86fffe00ba6 |
| Prosecución Ciencias | 33407785527980afbfc3f39d224db635 |
| Orientaciones PIAC | 2696ea8a1d8f43a68458dea55f29606a |
| Protocolo grabaciones | 1bb07785527980efb39be73bb3947beb |
| 📋 Guía DI Externos | 2f807785527981649b82fe0f30c06131 |
| 🔧 Guía de Estandarización de Proyectos | 2ea0778552798121b385d99a7ff133d6 |
| 🎓 Cursos Moodle | 330077855279815e8225f09ac49b0249 |
| Tutorial ingreso | 22b077855279801e8e55c0c0e24a64ca |
| Storyboard Sustentabilidad | 33a07785527981bfa4fac24e9b89186c |

#### Sección: 📁 Proyectos (33a07785527981cf9d46de7da77fb3ab)
| Página | ID |
|---|---|
| Acompaña UMCE | 1ee07785527980ba9adbf86966c0a61e |
| Formulario Contacto Chatbot | 1ee07785527980e7a3e9f0d727ddccfe |
| Plataforma EDUCAR | 1e007785527980c9927bd73d9076a462 |
| Huawei ICT Academy | 22307785527980aca0cbc1fdb634bf91 |
| MOCA — Modelo Configuración Adaptativa | 339077855279811a9824e91d5b2e32b4 |
| Análisis Problemas | 32e0778552798188bb3bed8b6a7b72dd |
| Curso CRUCH | 2d1077855279804da817f92696a86f66 |
| Curso IA Educativa | 1bc07785527980acb7c8eaf030714a20 |
| Isabel proyecto | 336077855279803c8b7ded64be1e0607 |
| Dashboard Seguimiento | 280077855279803698a3f14769d76654 |
| Investigación competitiva posicionamiento | 32e07785527981fca8ccfbc506a52a56 |
| Proyecto UMCE.online | 32e0778552798118ab7dcf2563971f21 |
| (+ posiblemente más) | — |

#### Sección: 📝 Documentación (33a07785527981d2a0dbc8e646ecf704)
| Página | ID |
|---|---|
| Solicitud continuidad | 29507785527980c6b16ad1c77792bb18 |
| Solicitud Renovación | 29407785527980e5b182d155c77b96bc |
| Oferta Formativa UMCE | 32e07785527981509598d06d5a3af388 |
| Actualización unidad | 10d07785527980b78194f457cb2d55be |
| Plan Operativo UDFV | 571b8107173a4534a99decead0412482 |
| Instructivo de Diseño Instruccional | 2b407785527980e09c80fef8af58a967 |
| Memorándum Software | 330077855279818b95cdeb089d214f1f |
| Esfuerzos Anteriores | 2b4077855279804d9fd4ce1e2d2000e6 |
| Guía Tablet | 2a907785527980fa9046c65ef5d7287f |
| (+ BD Documentos Institucionales inline) | — |

#### Sección: 📅 Reuniones (33a07785527981aa800cf825357b9fdd)
| Página | ID |
|---|---|
| Registro Reuniones | 1ab0778552798092829cec2eca750234 |
| Reunión Dipos | 27f07785527980098309cdaa5c69f0c1 |
| Reunión magíster | 2ea07785527980ce81ded3cd3f9fecd7 |
| Acta UDFV-DEC | 2be07785527980bbb510ee3fd96ba627 |
| Coordinación UDA-UDFV | 1c90778552798035a019d634a9e87639 |
| Coordinación elaboración programas DI | 2bf0778552798091acf2fac8479dc217 |
| Evaluación Programas Virtuales (reunión) | 2ef0778552798027a009ca6f1d52c54a |
| Reunión comité académico Magíster Básica | 1d10778552798006b629fb5b3a3d5bb9 |
| Reunión coordinación Magíster | 23a077855279800bb3a8cdd3df524a14 |
| Reunión con coordinadora Magíster | 1b907785527980798b28d8eb039685df |
| Levantamiento Cargo Formación TIC | 2e2077855279807fad4bcfac2d4b3751 |
| 2a reunión Mesa 1 | 2e207785527980ccacf6c42fb21df72d |
| Trampolín | 32e077855279805aaa93d78840396d54 |
| Reunión Proyecto Futuros Docentes | 3220778552798067aeccc3612dee6724 |
| TTT - propuesta curso | 2f50778552798014b6b1da0177e0ca00 |
| REU PACE | 1d007785527980189c3eca6b9659d3a4 |
| 📋 Plantilla Acta Reunión | 2ea077855279814b80ffdfd34242dd6a |
| (+ BD Bitácora + BD Reunión inline) | — |

#### Sección: 🔧 Técnico (33a07785527981139ebcdd349ea322d3)
| Página | ID |
|---|---|
| 🔗 Integración MCP | 2ea07785527981dd87d4c7c74b20358e |
| Dashboard Bug Moodle | (dentro de Técnico) |
| Recordatorio licencias | 646aa9840fcd42249e100f8b277f228d |
| (+ posiblemente más) | — |

#### Directos en Hub (sin sección):
| Página | ID |
|---|---|
| 👥 Equipo UDFV | 2860778552798048959acb0ef0d6ca49 |
| BD acciones equipo | 7982e3dfa130422f9cf5dbff185daff9 |
| BD Proyectos UDFV 2026 | a8aac618278d408a9dc6fd497ef848a2 |
| BD Recordatorios UDFV | e567722953d247e0bc6163cf4d9d3b62 |

#### 🗄️ Archivo Histórico (33a0778552798112ad0ce323cac316e5)
| Página | ID |
|---|---|
| Unidad (legacy) | d56670a508b346a1a9d0840b9fd49b99 |
| UDFV (legacy) | 697b862c152145ac99866d01fdb8dd57 |
| 📋 Operaciones | 330077855279814dbfa9fc1d003c31f4 |
| 👥 Equipo (tabla básica) | 330077855279812591a4f65337e7c22e |
| Equipo humano v1 | 285077855279808ebb67c46a887fa339 |
| Wiki UDFV | 31407785527980219ecddd40d3a4e2f0 |
| (+ posiblemente más) | — |

#### 📦 Archivados (revisar) (33a0778552798189bb2dcf7c423c37cf)
| Página | ID |
|---|---|
| Análisis y Propuesta Reorganización Notion UDFV | 2e6077855279811ea2f2d63670e919d3 |
| (+ posiblemente más) | — |

---

## PÁGINAS FUERA DEL HUB (nivel workspace u otra ubicación)

| Página | ID | Nota |
|---|---|---|
| 🧩 Personal | 330077855279818daf9cf544cb00972d | Espacio personal de David |
| MEIGLIP (virtualización y DI) | b653180cae6047d49bca65ad0d69f83e | Página independiente |
| Marco Evaluación Programas Virtuales | 97a7a317b58e4e91b36f1c336e998498 | — |
| Marco Competencias TIC Docentes UMCE 2025 | 33007785527981ee980bd3f465c1f8bf | — |
| Competencias Digitales SDPA | 33007785527981cca5c2cee706302584 | — |
| Ruta Formativa IA | 3300778552798171b8c5db17afa14d57 | — |
| Propuesta Competencia Digital | 3300778552798178b337e4cefb44667e | — |
| Sistematización TIC | 63f7ba11bcaf4d2299bb99711101f1a6 | — |
| SDPA UMCE 2022 | 330077855279810fa9b4f7ee8285fa06 | — |
| Capacitación Zoom | 334077855279800882caecfbd74d0561 | — |
| Plan Formativo | 7ba197af22604ba18a26915e6262a48d | Dentro de 🎯 Proyectos |
| 📂 Archivo Histórico Colaboradores UDFV | 2e60778552798181953cd512f9dd4fbf | — |
| Problema diseño lento | 32e07785527981e39f5fdbe772798d41 | — |
| Diseño TTT | 33007785527980a19e23eb0f95b77f32 | — |
| 11-ia-diseño-instruccional | 2e607785527981ca90eff6eb05cfc7ff | — |
| Implementación y evaluación entorno virtual MPED | 11807785527980d6bbdedc6036844eec | — |
| Revisión accesibilidad programas | 31433ab4db30477498d74b708c6b8b5c | — |
| acompana_umce (código) | 2b8077855279801b9726c2d5ea0872e6 | — |
| Encuesta Brevo - base de datos profes | 2ed077855279809eb6fec954ac64312a | — |
| Acta reunión Magíster Ed. Básica | c56a17693508432e939542afac525874 | — |
| Reunión coordinación Magíster | 23a077855279800bb3a8cdd3df524a14 | — |

---

## REGISTROS EN BD 🎯 Proyectos (25+ encontrados)

### Tipo: Magíster
| Registro | ID | Estado | Cohortes |
|---|---|---|---|
| MPED — Magíster Política Educacional | 26107785527980e48c9ee5318a2a1437 | Terminado | 2024, 2025 |
| MEDESP — Magíster Educación Especial (proyecto) | 2610778552798045ac67df9aa6ca5c59 | — | — |
| Magíster Educación Especial (cohorte?) | 31b07785527980ae978bf1c1f67036eb | — | — |
| Magíster Educación Especial (cohorte?) | 29b077855279801fa87ac0f1fb140950 | — | — |
| Magíster Educación Especial (cohorte?) | 29b07785527980759c74cab071a7d9ce | — | — |
| Magíster Educación Especial (cohorte?) | 29b07785527980eb8e4bd47e9acce702 | — | — |
| Magíster Didácticas Integradas | 31b077855279807ebadce0fa28ba5a13 | — | — |
| Magíster Didácticas Integradas Ed. Básica | 195f33eba40548aa9a6319d24feaabdf | — | — |
| Magíster Políticas Educativas | 31b07785527980fc955feff43372c7d4 | — | — |
| Magíster Educación Intercultural (MEIGLIP) | 31b07785527980ca9e43f3d8a002bc04 | — | — |
| Magíster Ciencias Aplicadas Movimiento | 702252cc3065463fbd12e345d74e9a19 | — | — |
| Magíster Ciencias Aplicadas Movimiento | 31b077855279809ba072e54455771655 | — | — |
| Magíster Ciencias Aplicadas Movimiento y Cognición | e677cd2f143a4f0996f89cfdd450eba1 | — | — |
| Magíster Ed. Física, Salud y Deportes | bf38f416d70c4618b820b9fdbc8cbb03 | — | — |
| Magíster Ed. Física y Salud | 31b077855279804c917ec979ff7e8722 | — | — |
| Magíster Gestión Pedagógica Ed. Superior | 2e90778552798001ad74ed63f7a2081b | — | — |
| Magíster Didácticas Contemporáneas Artes Visuales | 839cee07981f4b84b110a6ee2b10918a | — | — |
| Acreditación Magister Pol Ed. | 31a07785527980608f7ad7b4feb14c22 | — | — |

### Tipo: Prosecución
| Registro | ID | Estado |
|---|---|---|
| Prosecución Ed. Básica | 9d3d98157e024426a5dd8e1c48846fb9 | — |
| Prosecución Ed. Básica (cohorte?) | 29b07785527980bab74bdf9f8cd1dd0e | — |
| Prosecución Ed. Básica (cohorte?) | 29b077855279806184bfdc4c6d366ca5 | — |
| Prosecución Artes Escénicas | f8a1eb8ea3e34040ad4dce3a763efe6a | — |
| Prosecución Física y Química | 27e077855279804882a5e86b4655061f | En progreso |

### Tipo: Otro
| Registro | ID |
|---|---|
| Apoyo UMCE Virtual | e17a43e995994da5b20f8ea7eeb124bb |
| Plan Formativo | 7ba197af22604ba18a26915e6262a48d |

---

## NOTAS

- Hay registros duplicados por programa en 🎯 Proyectos (ej: Magíster Ed. Especial aparece 4+ veces, probablemente una por cohorte)
- Hay páginas de programas tanto dentro de 🎯 Proyectos como en la sección Cursos y Programas del Hub
- Hay páginas que no logré ubicar en ninguna sección — pueden estar sueltas a nivel workspace
- Las BDs inline (Bitácora, Reuniones, Documentos Institucionales) no tienen IDs confirmados
- Este inventario viene de búsquedas semánticas — puede haber páginas que no aparecieron en ninguna búsqueda
- NO leí el contenido de todas las páginas, solo las más importantes
