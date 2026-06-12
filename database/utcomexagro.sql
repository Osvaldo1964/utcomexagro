-- ============================================================
-- UT COMEXAGRO – Script de Base de Datos
-- Versión: 1.0 | Fecha: 2024
-- Ejecutar en phpMyAdmin o CLI: mysql -u root -p < utcomexagro.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS utcomexagro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE utcomexagro;

-- ============================================================
-- MÓDULO: SEGURIDAD Y ACCESO
-- ============================================================

-- Roles del sistema
CREATE TABLE roles (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(50)  NOT NULL UNIQUE,
  descripcion TEXT,
  activo    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Permisos granulares (modulo + accion)
CREATE TABLE permisos (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  modulo    VARCHAR(50)  NOT NULL,
  accion    VARCHAR(50)  NOT NULL,
  descripcion VARCHAR(200),
  UNIQUE KEY uq_modulo_accion (modulo, accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación Rol ↔ Permisos
CREATE TABLE rol_permisos (
  rol_id     INT UNSIGNED NOT NULL,
  permiso_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Usuarios del sistema administrativo
CREATE TABLE usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100)  NOT NULL,
  apellidos     VARCHAR(100),
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol_id        INT UNSIGNED,
  activo        TINYINT(1)    NOT NULL DEFAULT 0,  -- 0=pendiente activación
  avatar        VARCHAR(255),
  ultimo_acceso TIMESTAMP     NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens JWT
CREATE TABLE refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revocado    TINYINT(1)   NOT NULL DEFAULT 0,
  user_agent  VARCHAR(300),
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Log de accesos
CREATE TABLE log_accesos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED,
  accion      VARCHAR(100) NOT NULL,
  modulo      VARCHAR(50),
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(300),
  detalle     TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: CONFIGURACIÓN / PARÁMETROS
-- ============================================================

-- Programas disponibles para postulación
CREATE TABLE programas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin    DATE,
  cupos        INT UNSIGNED DEFAULT 0,
  activo       TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cargos/Roles disponibles por programa
CREATE TABLE cargos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  programa_id INT UNSIGNED,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  perfil_requerido TEXT,
  activo      TINYINT(1)  NOT NULL DEFAULT 1,
  FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Parámetros del sistema
CREATE TABLE parametros (
  clave       VARCHAR(100) PRIMARY KEY,
  valor       TEXT NOT NULL,
  descripcion VARCHAR(300),
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: POSTULADOS (Registro Público)
-- ============================================================

CREATE TABLE postulados (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Programa
  programa_id     INT UNSIGNED,
  cargo_id        INT UNSIGNED,
  -- Documento
  tipo_doc        ENUM('CC','CE','TI','Pasaporte','PEP','PPT') NOT NULL,
  num_doc         VARCHAR(30) NOT NULL UNIQUE,
  -- Nombres
  p_apellido      VARCHAR(60) NOT NULL,
  s_apellido      VARCHAR(60),
  p_nombre        VARCHAR(60) NOT NULL,
  s_nombre        VARCHAR(60),
  -- Contacto
  direccion       VARCHAR(250),
  email           VARCHAR(150),
  telefono        VARCHAR(25),
  -- Datos personales
  sexo            ENUM('Masculino','Femenino','Otro','No informa'),
  rh              ENUM('O+','O-','A+','A-','B+','B-','AB+','AB-'),
  fecha_nacimiento DATE,
  -- Dotación
  talla_camisa    ENUM('XS','S','M','L','XL','XXL','XXXL'),
  talla_pantalon  VARCHAR(10),
  -- Seguridad Social
  eps             VARCHAR(100),
  afp             VARCHAR(100),
  arl             VARCHAR(100),
  discapacidad    VARCHAR(300),
  -- Ubicación
  pais_origen     VARCHAR(80) DEFAULT 'Colombia',
  departamento    VARCHAR(80),
  municipio       VARCHAR(100),
  -- Evaluación (uso interno)
  estado_evaluacion ENUM('pendiente','aplica','no_aplica','seleccionado','contratado') DEFAULT 'pendiente',
  puntaje_evaluacion DECIMAL(5,2),
  observaciones_evaluacion TEXT,
  evaluado_por    INT UNSIGNED,
  fecha_evaluacion TIMESTAMP NULL,
  -- Metadatos
  ip_registro     VARCHAR(45),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL,
  FOREIGN KEY (cargo_id)    REFERENCES cargos(id)    ON DELETE SET NULL,
  FOREIGN KEY (evaluado_por) REFERENCES usuarios(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Documentos adjuntos de cada postulado
CREATE TABLE documentos_postulado (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  postulado_id    INT UNSIGNED NOT NULL,
  tipo_doc        ENUM(
    'cedula',
    'consentimiento',
    'hoja_vida',
    'formacion_academica',
    'cert_experiencia',
    'cert_residencia',
    'otro'
  ) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  nombre_archivo  VARCHAR(255) NOT NULL,
  ruta_relativa   VARCHAR(500) NOT NULL,
  tamano_bytes    INT UNSIGNED,
  mime_type       VARCHAR(100),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postulado_id) REFERENCES postulados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: CONTRATACIÓN
-- ============================================================

-- Plantillas de contratos (minutas)
CREATE TABLE plantillas_contrato (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  tipo_contrato   VARCHAR(100),
  contenido_html  LONGTEXT NOT NULL,
  variables_json  JSON,         -- Lista de variables: {{nombre}}, {{cargo}}, etc.
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_by      INT UNSIGNED,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contratos generados
CREATE TABLE contratos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  postulado_id    INT UNSIGNED NOT NULL,
  plantilla_id    INT UNSIGNED,
  numero_contrato VARCHAR(30) NOT NULL UNIQUE,
  tipo_contrato   VARCHAR(100),
  cargo           VARCHAR(150),
  lugar_trabajo   VARCHAR(200),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE,
  valor_mensual   DECIMAL(12,2),
  contenido_final LONGTEXT,    -- HTML procesado con datos del contratista
  ruta_pdf        VARCHAR(500),
  estado          ENUM('borrador','generado','firmado','activo','suspendido','liquidado') DEFAULT 'borrador',
  generado_por    INT UNSIGNED,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (postulado_id) REFERENCES postulados(id),
  FOREIGN KEY (plantilla_id) REFERENCES plantillas_contrato(id) ON DELETE SET NULL,
  FOREIGN KEY (generado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: NÓMINA
-- ============================================================

CREATE TABLE nomina_periodos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  estado       ENUM('abierto','liquidado','pagado') DEFAULT 'abierto',
  creado_por   INT UNSIGNED,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nomina_detalle (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  periodo_id      INT UNSIGNED NOT NULL,
  contrato_id     INT UNSIGNED NOT NULL,
  salario_base    DECIMAL(12,2) NOT NULL,
  dias_trabajados TINYINT UNSIGNED DEFAULT 30,
  -- Deducciones
  salud           DECIMAL(10,2) DEFAULT 0,
  pension         DECIMAL(10,2) DEFAULT 0,
  fondo_solidaridad DECIMAL(10,2) DEFAULT 0,
  otras_deducciones DECIMAL(10,2) DEFAULT 0,
  detalle_deducciones JSON,
  -- Totales
  total_deducciones DECIMAL(12,2) DEFAULT 0,
  neto_pagar      DECIMAL(12,2) NOT NULL,
  estado_pago     ENUM('pendiente','pagado') DEFAULT 'pendiente',
  fecha_pago      DATE,
  observaciones   TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (periodo_id)  REFERENCES nomina_periodos(id),
  FOREIGN KEY (contrato_id) REFERENCES contratos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: PQRs (Peticiones, Quejas, Reclamos)
-- ============================================================

CREATE TABLE pqrs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  radicado    VARCHAR(25) NOT NULL UNIQUE,
  tipo        ENUM('Peticion','Queja','Reclamo','Sugerencia','Denuncia') NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  documento   VARCHAR(30),
  email       VARCHAR(150),
  telefono    VARCHAR(25),
  descripcion TEXT NOT NULL,
  adjunto     VARCHAR(500),
  estado      ENUM('recibido','en_proceso','resuelto','cerrado') DEFAULT 'recibido',
  respuesta   TEXT,
  gestionado_por INT UNSIGNED,
  fecha_gestion  TIMESTAMP NULL,
  ip_registro VARCHAR(45),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gestionado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: BENEFICIARIOS (estructura base – por definir)
-- ============================================================

CREATE TABLE beneficiarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_doc        ENUM('CC','CE','TI','Pasaporte') NOT NULL,
  num_doc         VARCHAR(30) NOT NULL UNIQUE,
  p_apellido      VARCHAR(60) NOT NULL,
  s_apellido      VARCHAR(60),
  p_nombre        VARCHAR(60) NOT NULL,
  s_nombre        VARCHAR(60),
  email           VARCHAR(150),
  telefono        VARCHAR(25),
  departamento    VARCHAR(80),
  municipio       VARCHAR(100),
  programa_id     INT UNSIGNED,
  estado          ENUM('activo','inactivo') DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: PRESUPUESTO (estructura base)
-- ============================================================

CREATE TABLE presupuesto_rubros (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  valor_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  valor_ejecutado DECIMAL(14,2) NOT NULL DEFAULT 0,
  programa_id INT UNSIGNED,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: INVENTARIOS (estructura base)
-- ============================================================

CREATE TABLE inventario_categorias (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL,
  descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventario_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id    INT UNSIGNED,
  codigo          VARCHAR(50) UNIQUE,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  unidad          VARCHAR(30),
  cantidad        DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_minima DECIMAL(10,2) DEFAULT 0,
  ubicacion       VARCHAR(200),
  estado          ENUM('disponible','agotado','mantenimiento','dado_baja') DEFAULT 'disponible',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES inventario_categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- MÓDULO: ENCUESTAS (estructura base)
-- ============================================================

CREATE TABLE encuestas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  preguntas   JSON NOT NULL,
  publico     TINYINT(1) DEFAULT 0,
  activa      TINYINT(1) DEFAULT 1,
  fecha_inicio DATE,
  fecha_fin    DATE,
  created_by   INT UNSIGNED,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE encuesta_respuestas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  encuesta_id INT UNSIGNED NOT NULL,
  respondente_id INT UNSIGNED,
  respuestas  JSON NOT NULL,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Superadmin',    'Acceso total al sistema sin restricciones'),
('Administrador', 'Gestión general de todos los módulos'),
('Evaluador',     'Evaluación de postulados y contratos'),
('RRHH',          'Gestión de nómina y contratación'),
('Consultor',     'Solo lectura en módulos asignados');

-- Permisos granulares
INSERT INTO permisos (modulo, accion, descripcion) VALUES
-- Postulados
('postulados', 'leer',     'Ver listado de postulados'),
('postulados', 'crear',    'Registrar nuevo postulado (admin)'),
('postulados', 'editar',   'Editar datos de postulado'),
('postulados', 'eliminar', 'Eliminar postulado'),
('postulados', 'exportar', 'Exportar datos a Excel/PDF'),
-- Contratación
('contratacion', 'evaluar',          'Marcar aplica/no aplica postulados'),
('contratacion', 'generar_contrato', 'Generar contratos automáticos'),
('contratacion', 'ver_contratos',    'Ver contratos generados'),
('contratacion', 'editar_contrato',  'Editar contratos'),
('contratacion', 'nomina_leer',      'Ver nómina'),
('contratacion', 'nomina_gestionar', 'Gestionar y liquidar nómina'),
-- Beneficiarios
('beneficiarios', 'leer',     'Ver beneficiarios'),
('beneficiarios', 'crear',    'Registrar beneficiario'),
('beneficiarios', 'editar',   'Editar beneficiario'),
('beneficiarios', 'eliminar', 'Eliminar beneficiario'),
-- Presupuesto
('presupuesto', 'leer',    'Ver presupuesto'),
('presupuesto', 'crear',   'Crear rubro presupuestal'),
('presupuesto', 'editar',  'Editar presupuesto'),
('presupuesto', 'aprobar', 'Aprobar movimientos'),
-- Inventarios
('inventarios', 'leer',    'Ver inventarios'),
('inventarios', 'crear',   'Agregar ítems'),
('inventarios', 'editar',  'Editar ítems'),
('inventarios', 'eliminar','Eliminar ítems'),
-- Encuestas
('encuestas', 'leer',           'Ver encuestas'),
('encuestas', 'crear',          'Crear encuesta'),
('encuestas', 'publicar',       'Publicar/activar encuesta'),
('encuestas', 'ver_resultados', 'Ver resultados y estadísticas'),
-- PQRs
('pqrs', 'leer',     'Ver PQRs radicadas'),
('pqrs', 'gestionar','Gestionar y responder PQRs'),
-- Configuración
('configuracion', 'usuarios', 'Gestionar usuarios del sistema'),
('configuracion', 'roles',    'Gestionar roles'),
('configuracion', 'permisos', 'Asignar permisos a roles'),
('configuracion', 'parametros','Configurar parámetros del sistema');

-- Superadmin tiene todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Administrador: todo excepto configuración de permisos y eliminar
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE NOT (modulo = 'configuracion' AND accion = 'permisos')
  AND accion != 'eliminar';

-- Evaluador: solo evaluación
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE modulo IN ('postulados','contratacion')
  AND accion IN ('leer','evaluar','ver_contratos');

-- RRHH: postulados + contratación + nómina
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 4, id FROM permisos WHERE modulo IN ('postulados','contratacion')
  AND accion != 'eliminar';

-- Consultor: solo leer
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 5, id FROM permisos WHERE accion IN ('leer','ver_contratos','ver_resultados');

-- Parámetros del sistema
INSERT INTO parametros (clave, valor, descripcion) VALUES
('jwt_inactividad_minutos', '30',       'Minutos de inactividad antes de cerrar sesión'),
('jwt_expiry_minutos',      '15',       'Duración del access token JWT en minutos'),
('max_file_size_mb',        '3',        'Tamaño máximo de archivos subidos en MB'),
('cupos_disponibles',       '200',      'Cupos totales de contratación'),
('nombre_empresa',          'UT COMEXAGRO', 'Nombre de la empresa'),
('nit_empresa',             '000000000-0',  'NIT de la empresa'),
('email_notificaciones',    'info@utcomexagro.com', 'Email para notificaciones del sistema');

-- Programas iniciales
INSERT INTO programas (codigo, nombre, descripcion, cupos) VALUES
('PROG-AGR-001', 'Programa de Asistencia Técnica Agrícola',
  'Asistencia técnica directa a productores agrícolas en todo el territorio nacional', 80),
('PROG-CAP-001', 'Programa de Capacitación Técnica Rural',
  'Capacitación y formación técnica para comunidades rurales', 60),
('PROG-COM-001', 'Programa de Comercialización Agropecuaria',
  'Apoyo a la comercialización de productos del sector agropecuario', 40),
('PROG-INV-001', 'Programa de Investigación y Extensión',
  'Investigación aplicada y extensión rural en el sector agro', 20);

-- Cargos por programa
INSERT INTO cargos (programa_id, nombre, descripcion) VALUES
(1, 'Ingeniero Agrónomo',     'Profesional en ingeniería agronómica con experiencia en asistencia técnica'),
(1, 'Técnico Agrícola',       'Técnico o tecnólogo en áreas agrícolas'),
(1, 'Promotor Rural',         'Bachiller o técnico con experiencia en comunidades rurales'),
(2, 'Facilitador/Capacitador','Profesional o técnico con experiencia en formación'),
(2, 'Coordinador Pedagógico', 'Profesional con experiencia en diseño curricular'),
(3, 'Promotor Comercial',     'Profesional o técnico en comercio agropecuario'),
(3, 'Analista de Mercados',   'Profesional en administración o economía agraria'),
(4, 'Investigador Agrícola',  'Profesional con posgrado en ciencias agrarias'),
(4, 'Auxiliar de Investigación','Estudiante o recién egresado en ciencias agrarias');

-- Usuario administrador inicial
-- IMPORTANTE: Cambiar contraseña después del primer acceso
-- Password por defecto: Admin2024!
INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol_id, activo) VALUES
('Administrador', 'Sistema', 'admin@utcomexagro.com',
 '$2y$12$LKXAGNEPvN5/F8k5J3oGXeN8O.mBjZdQ5hnFP3F5L2CKw5R9pU4Ci', 1, 1);
-- Hash corresponde a: Admin2024!

-- ============================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX idx_postulados_estado     ON postulados(estado_evaluacion);
CREATE INDEX idx_postulados_programa   ON postulados(programa_id);
CREATE INDEX idx_postulados_tipo_doc   ON postulados(tipo_doc, num_doc);
CREATE INDEX idx_pqrs_estado           ON pqrs(estado);
CREATE INDEX idx_pqrs_radicado         ON pqrs(radicado);
CREATE INDEX idx_refresh_tokens_hash   ON refresh_tokens(token_hash);
CREATE INDEX idx_log_accesos_usuario   ON log_accesos(usuario_id, created_at);
