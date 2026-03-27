-- =========================================================================
-- MARCO DE COMPETENCIAS TIC DOCENTES UMCE
-- 3 dominios × 12 ámbitos × 3 niveles = 36 descriptores
-- Fuente: Marco-Competencias-TIC-UMCE.docx (UDFV 2025)
-- =========================================================================

-- PASO 1: TABLAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS portal.tic_dominios (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal.tic_ambitos (
    id SERIAL PRIMARY KEY,
    dominio_id INT REFERENCES portal.tic_dominios(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal.tic_descriptores (
    id SERIAL PRIMARY KEY,
    ambito_id INT REFERENCES portal.tic_ambitos(id) ON DELETE CASCADE,
    nivel TEXT NOT NULL CHECK (nivel IN ('inicial', 'intermedio', 'avanzado')),
    descriptor TEXT NOT NULL,
    cursos_asociados TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ambito_id, nivel)
);

-- PASO 2: SEED — DOMINIOS
-- =========================================================================

INSERT INTO portal.tic_dominios (slug, nombre, descripcion, orden) VALUES
('ensenanza_aprendizaje', 'Enseñanza y Aprendizaje mediadas con TIC', 'Competencias Pedagógicas', 1),
('desarrollo_profesional', 'Desarrollo Profesional TIC', 'Desarrollo de la Ciudadanía', 2),
('plataformas_recursos', 'Plataformas, Recursos y Ciudadanía Digital', NULL, 3)
ON CONFLICT (slug) DO NOTHING;

-- PASO 3: SEED — ÁMBITOS (12)
-- =========================================================================

-- Dominio 1: Enseñanza y Aprendizaje
INSERT INTO portal.tic_ambitos (dominio_id, slug, nombre, orden) VALUES
((SELECT id FROM portal.tic_dominios WHERE slug='ensenanza_aprendizaje'), 'preparacion_ensenanza', 'Preparación de la Enseñanza', 1),
((SELECT id FROM portal.tic_dominios WHERE slug='ensenanza_aprendizaje'), 'estrategias_ensenanza', 'Estrategias de Enseñanza-Aprendizaje', 2),
((SELECT id FROM portal.tic_dominios WHERE slug='ensenanza_aprendizaje'), 'evaluacion_tic', 'Evaluación mediada por TIC', 3),
((SELECT id FROM portal.tic_dominios WHERE slug='ensenanza_aprendizaje'), 'retroalimentacion_tic', 'Retroalimentación mediada por TIC', 4)
ON CONFLICT (slug) DO NOTHING;

-- Dominio 2: Desarrollo Profesional
INSERT INTO portal.tic_ambitos (dominio_id, slug, nombre, orden) VALUES
((SELECT id FROM portal.tic_dominios WHERE slug='desarrollo_profesional'), 'reflexion_tic', 'Reflexión y análisis del uso de las TIC en educación', 5),
((SELECT id FROM portal.tic_dominios WHERE slug='desarrollo_profesional'), 'comunicacion_colaboracion', 'Comunicación y colaboración en línea', 6),
((SELECT id FROM portal.tic_dominios WHERE slug='desarrollo_profesional'), 'perfeccionamiento_continuo', 'Perfeccionamiento continuo y sistemático', 7),
((SELECT id FROM portal.tic_dominios WHERE slug='desarrollo_profesional'), 'investigacion_innovacion', 'Investigación en innovación educativa y uso de TIC en Docencia', 8)
ON CONFLICT (slug) DO NOTHING;

-- Dominio 3: Plataformas y Recursos
INSERT INTO portal.tic_ambitos (dominio_id, slug, nombre, orden) VALUES
((SELECT id FROM portal.tic_dominios WHERE slug='plataformas_recursos'), 'entornos_virtuales', 'Entornos Virtuales de Aprendizaje', 9),
((SELECT id FROM portal.tic_dominios WHERE slug='plataformas_recursos'), 'administracion_informacion', 'Administración de Información, datos y referencias en fuentes digitales', 10),
((SELECT id FROM portal.tic_dominios WHERE slug='plataformas_recursos'), 'etica_seguridad', 'Ética, Seguridad y Bienestar digital', 11),
((SELECT id FROM portal.tic_dominios WHERE slug='plataformas_recursos'), 'sistemas_programacion', 'Sistemas informáticos, solución de problemas y orientación a la programación', 12)
ON CONFLICT (slug) DO NOTHING;

-- PASO 4: SEED — DESCRIPTORES (36)
-- =========================================================================

-- Ámbito 1: Preparación de la Enseñanza
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='preparacion_ensenanza'), 'inicial',
'Conoce herramientas y recursos tecnológicos-comunicacionales identificando características y posibilidades para el diseño de actividades, estrategias de enseñanza-aprendizaje y el logro de los resultados formativos de las actividades curriculares que imparte.',
ARRAY['ChatGPT Productividad (3h)', 'Cápsulas CANVA (3h)', 'Recursos CANVA (2h)', 'Audiovisuales (3h)', 'Materiales Didácticos Digitales (9h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='preparacion_ensenanza'), 'intermedio',
'Integra herramientas y recursos tecnológicos-comunicacionales en el diseño de actividades de enseñanza-aprendizaje, incluyendo elaboración de material didáctico con énfasis en el uso de metodologías activas de aprendizaje, para el logro de los resultados formativos de las actividades curriculares que imparte y el desarrollo de la competencia genérica TIC de estudiantes.',
ARRAY['ChatGPT Productividad (3h)', 'Cápsulas CANVA (3h)', 'Recursos CANVA (2h)', 'Audiovisuales (3h)', 'Materiales Didácticos Digitales (9h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='preparacion_ensenanza'), 'avanzado',
'Desarrolla material didáctico y/o recursos de aprendizaje a través de software de programación, diseño o edición de audio/video para la implementación de las actividades curriculares que imparte con énfasis en el uso de metodologías activas respondiendo a necesidades formativas internas y del medio externo relevante.',
ARRAY['ChatGPT Productividad (3h)', 'Cápsulas CANVA (3h)', 'Recursos CANVA (2h)', 'Audiovisuales (3h)', 'Materiales Didácticos Digitales (9h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 2: Estrategias de Enseñanza-Aprendizaje
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='estrategias_ensenanza'), 'inicial',
'Conoce metodologías y modelos de enseñanza-aprendizaje que involucran el uso de TIC e identifica sus posibles aportes en la formación inicial docente.',
ARRAY['Introducción IA y aplicaciones educativas (36h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='estrategias_ensenanza'), 'intermedio',
'Aplica metodologías activas, estrategias didácticas, modelos de enseñanza aprendizaje en el desarrollo de experiencias de aprendizaje mediadas por tecnología, tributando al logro de la competencia genérica TIC de los estudiantes UMCE.',
ARRAY['Introducción IA y aplicaciones educativas (36h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='estrategias_ensenanza'), 'avanzado',
'Fomenta en estudiantes y pares la aplicación de estrategias didácticas y metodologías activas de aprendizaje mediadas por tecnología, tributando al logro de la competencia genérica TIC de los estudiantes UMCE.',
ARRAY['Introducción IA y aplicaciones educativas (36h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 3: Evaluación mediada por TIC
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='evaluacion_tic'), 'inicial',
'Conoce instrumentos de evaluación variados y la posibilidad de producirlos mediante softwares y plataformas LMS que faciliten su aplicación, administración y análisis de resultados.',
ARRAY['Evaluación en Ambientes Virtuales (8h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='evaluacion_tic'), 'intermedio',
'Aplica diversas técnicas e instrumentos de evaluación mediante softwares y plataformas LMS que faciliten su aplicación, cotejo y análisis de resultados, con foco en la generación de datos que permitan realizar mejoras en los procesos de enseñanza-aprendizaje.',
ARRAY['Evaluación en Ambientes Virtuales (8h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='evaluacion_tic'), 'avanzado',
'Desarrolla métodos y técnicas de evaluación complejas mediadas por TIC, con foco en procesos y resultados dinámicos, fomentando en la comunidad la interdisciplinariedad, la innovación y una cultura de recogida de datos que permita una mejora continua en los procesos de enseñanza-aprendizaje.',
ARRAY['Evaluación en Ambientes Virtuales (8h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 4: Retroalimentación mediada por TIC
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='retroalimentacion_tic'), 'inicial',
'Conoce herramientas y plataformas tecnológicas que facilitan la comunicación con sus estudiantes y comprende su potencial para proporcionar retroalimentación sobre procesos, resultados y productos.',
ARRAY['Herramientas Planificación Clases (4h)', 'Zoom y aplicaciones (2h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='retroalimentacion_tic'), 'intermedio',
'Utiliza herramientas y plataformas tecnológicas que facilitan la comunicación con sus estudiantes para la retroalimentación de procesos, resultados de aprendizaje y productos.',
ARRAY['Herramientas Planificación Clases (4h)', 'Zoom y aplicaciones (2h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='retroalimentacion_tic'), 'avanzado',
'Fomenta el uso de herramientas y plataformas tecnológicas que facilitan la comunicación entre pares y estudiantes para la retroalimentación constante de procesos, resultados de aprendizaje y productos.',
ARRAY['Herramientas Planificación Clases (4h)', 'Zoom y aplicaciones (2h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 5: Reflexión y análisis del uso de las TIC en educación
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='reflexion_tic'), 'inicial',
'Conoce antecedentes teóricos y políticas públicas que sustentan la integración de las TIC para la educación en todos sus niveles, identificando su relación con metodologías activas y estrategias didácticas.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='reflexion_tic'), 'intermedio',
'Integra conocimientos de política pública, tecnología y educación, promoviendo en la comunidad universitaria la reflexión y análisis crítico sobre las TIC en el ámbito educativo, social y disciplinar.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='reflexion_tic'), 'avanzado',
'Desarrolla proyectos de investigación y/o vinculación con el medio en el ámbito educativo, tecnológico y/o disciplinar, con foco en innovación, acceso, equidad e inclusión.',
'{}')
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 6: Comunicación y colaboración en línea
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='comunicacion_colaboracion'), 'inicial',
'Conoce sitios web de colaboración en línea con foco en la búsqueda de referencias para la docencia, la auto instrucción y el conocimiento.',
ARRAY['Google Workspace colaboración (27h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='comunicacion_colaboracion'), 'intermedio',
'Participa activamente en sitios web, comunidades y plataformas de colaboración en línea en el ámbito académico, demostrando dominio en los lenguajes comunicacional, oral, escrito, estético, visual, audiovisual y sonoro.',
ARRAY['Google Workspace colaboración (27h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='comunicacion_colaboracion'), 'avanzado',
'Desarrolla sitios de colaboración en línea para estudiantes, docentes y comunidades del medio, generando espacios de diálogo transversal, multidireccional e inclusivo, contribuyendo a la reducción de brechas educacionales para la sociedad en su conjunto, con foco en la optimización de recursos en el campo de la creación, producción y difusión de conocimiento.',
ARRAY['Google Workspace colaboración (27h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 7: Perfeccionamiento continuo y sistemático
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='perfeccionamiento_continuo'), 'inicial',
'Conoce de instancias de formación y capacitación que apuntan a la utilización de recursos tecnológicos para el aprendizaje de la institución, a las que asiste ocasionalmente.',
ARRAY['Inducción tutores práctica (2h)', 'Jornada competencias digitales (4h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='perfeccionamiento_continuo'), 'intermedio',
'Asiste frecuentemente a instancias de capacitación en el área de las TIC con miras a actualizar sus conocimientos y/o fomentar su desarrollo profesional.',
ARRAY['Inducción tutores práctica (2h)', 'Jornada competencias digitales (4h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='perfeccionamiento_continuo'), 'avanzado',
'Colabora en el desarrollo de cursos de perfeccionamiento y/o aprendizaje continuo en el área de las TIC, participando en etapas de diseño, planificación, producción y/o implementación.',
ARRAY['Inducción tutores práctica (2h)', 'Jornada competencias digitales (4h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 8: Investigación en innovación educativa
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='investigacion_innovacion'), 'inicial',
'Consulta artículos y estudios que mencionan las TIC en educación, así como didácticas, técnicas y metodologías innovadoras relacionadas.',
ARRAY['Conociendo la Competencia Genérica TIC (1h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='investigacion_innovacion'), 'intermedio',
'Integra la reflexión y el uso de las TIC en su práctica docente, actualizando constantemente sus conocimientos y metodologías acorde a las últimas investigaciones de la materia.',
ARRAY['Conociendo la Competencia Genérica TIC (1h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='investigacion_innovacion'), 'avanzado',
'Desarrolla investigación, creación y publicaciones en el área de las TIC, fomentando la reflexión, innovación e integración con éstas en el medio educacional, disciplinar y social.',
ARRAY['Conociendo la Competencia Genérica TIC (1h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 9: Entornos Virtuales de Aprendizaje
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='entornos_virtuales'), 'inicial',
'Conoce plataformas y herramientas para el aprendizaje en entornos virtuales, identificando sus posibilidades didácticas y metodologías activas relacionadas.',
ARRAY['Formación tutoría virtual (15h)', 'Diseño instruccional (54h)', 'Portafolios Google Sites (4h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='entornos_virtuales'), 'intermedio',
'Utiliza plataformas para el aprendizaje en entornos virtuales, seleccionando criteriosamente los recursos, herramientas y contenidos en función de los intereses y necesidades de los estudiantes y la experiencia de aprendizaje que espera lograr.',
ARRAY['Formación tutoría virtual (15h)', 'Diseño instruccional (54h)', 'Portafolios Google Sites (4h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='entornos_virtuales'), 'avanzado',
'Diseña experiencias de aprendizaje en entornos virtuales utilizando plataformas LMS y metodologías activas mediadas por TIC, evidenciando destrezas o conocimientos en la personalización de los espacios virtuales, el uso de herramientas de evaluación en línea, la creación de contenido audiovisual y la articulación de lenguajes de programación.',
ARRAY['Formación tutoría virtual (15h)', 'Diseño instruccional (54h)', 'Portafolios Google Sites (4h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 10: Administración de Información
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='administracion_informacion'), 'inicial',
'Conoce sitios y buscadores de internet especializados en investigación y difusión de conocimiento académico, identificando los más relevantes para su área y sus posibilidades de licencia de uso en relación a las normativas relacionadas a los derechos de autor y creative commons.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='administracion_informacion'), 'intermedio',
'Utiliza buscadores y sitios de internet especializados en investigación y difusión de conocimiento académico, priorizando los más relevantes para su área y aquellos que faciliten la distribución del conocimiento por medio de licencias creative commons o de dominio público.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='administracion_informacion'), 'avanzado',
'Administra información, datos y referencias académicas recogidas desde la web, utilizando filtros y herramientas avanzadas de búsqueda e indexación en línea, que permitan el trabajo en investigaciones propias, apoyo a estudiantes y colaboración en línea con otros académicos; privilegiando el uso de sistemas de almacenamiento seguros y licencias creative commons o de dominio público que faciliten el acceso al conocimiento.',
'{}')
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 11: Ética, Seguridad y Bienestar digital
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='etica_seguridad'), 'inicial',
'Reflexiona sobre el uso de las TIC y sus implicancias en la seguridad y el bienestar físico, emocional y social; con foco en la protección de niñas, niños y adolescentes, y el respeto por la diversidad cultural, étnica, de género y sexualidad.',
ARRAY['TIC Aplicadas Universidad (4h)', 'Educación Ciudadanía Digital (15h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='etica_seguridad'), 'intermedio',
'Adopta conductas de autocuidado en temas de seguridad de datos y bienestar físico, social y emocional, relacionado al uso de dispositivos electrónicos y plataformas en línea.',
ARRAY['TIC Aplicadas Universidad (4h)', 'Educación Ciudadanía Digital (15h)']),
((SELECT id FROM portal.tic_ambitos WHERE slug='etica_seguridad'), 'avanzado',
'Promueve entre estudiantes, docentes y actores del medio, el uso de recursos digitales y conductas para el autocuidado en temas de seguridad de datos y bienestar físico, emocional y social, relacionado al uso de dispositivos electrónicos y plataformas en línea.',
ARRAY['TIC Aplicadas Universidad (4h)', 'Educación Ciudadanía Digital (15h)'])
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- Ámbito 12: Sistemas informáticos y programación
INSERT INTO portal.tic_descriptores (ambito_id, nivel, descriptor, cursos_asociados) VALUES
((SELECT id FROM portal.tic_ambitos WHERE slug='sistemas_programacion'), 'inicial',
'Identifica una variedad de dispositivos, periféricos, componentes y sus características generales, que le permiten seleccionar los indicados para un desarrollo fluido de sus clases y quehaceres académicos, reconociendo a qué unidad, departamento o profesional acudir en caso de presentarse algún problema.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='sistemas_programacion'), 'intermedio',
'Utiliza recursos tecnológicos para el aprendizaje, demostrando dominio técnico en su uso y conocimiento de características específicas que le permitan solucionar problemas comunes de funcionamiento, configuración y conexión que se presenten, manteniendo un vínculo constante con las unidades, departamentos, técnicos y profesionales que administran los recursos para el aprendizaje de la institución.',
'{}'),
((SELECT id FROM portal.tic_ambitos WHERE slug='sistemas_programacion'), 'avanzado',
'Propone soluciones a problemáticas sociales, educacionales e institucionales mediante el uso de sistemas informáticos y lógicas de programación, que permitan innovar o sistematizar acciones con miras al desarrollo sustentable de las comunidades, la equidad, la inclusión, y el acceso a educación, cultura y conocimiento.',
'{}')
ON CONFLICT (ambito_id, nivel) DO NOTHING;

-- PASO 5: RLS
-- =========================================================================

ALTER TABLE portal.tic_dominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.tic_ambitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.tic_descriptores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tic_dominios_read" ON portal.tic_dominios FOR SELECT USING (true);
CREATE POLICY "tic_ambitos_read" ON portal.tic_ambitos FOR SELECT USING (true);
CREATE POLICY "tic_descriptores_read" ON portal.tic_descriptores FOR SELECT USING (true);

GRANT SELECT ON portal.tic_dominios TO anon, authenticated, service_role;
GRANT SELECT ON portal.tic_ambitos TO anon, authenticated, service_role;
GRANT SELECT ON portal.tic_descriptores TO anon, authenticated, service_role;
