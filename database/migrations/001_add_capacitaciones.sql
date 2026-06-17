-- ============================================================
-- MIGRACIÓN: Módulo CAPACITACIONES
-- Archivo: database/migrations/001_add_capacitaciones.sql
-- Fecha: 2026
-- ============================================================

USE utcomexagro;

-- Tabla principal de capacitaciones / sesiones virtuales
CREATE TABLE IF NOT EXISTS capacitaciones (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  tipo            ENUM('charla','taller','reunion_virtual','webinar','otro') DEFAULT 'charla',
  modalidad       ENUM('virtual','presencial','hibrida') DEFAULT 'virtual',
  programa_id     INT UNSIGNED,
  facilitador_id  INT UNSIGNED,           -- usuario del sistema que facilita
  fecha_inicio    DATETIME,
  fecha_fin       DATETIME,
  duracion_min    INT UNSIGNED DEFAULT 60,
  max_participantes INT UNSIGNED DEFAULT 0, -- 0 = sin límite
  -- Integración con plataforma externa (Zoom, Meet, Jitsi, etc.)
  enlace_reunion  VARCHAR(500),            -- URL de la sala virtual
  id_reunion_ext  VARCHAR(200),            -- ID en la plataforma externa
  plataforma      VARCHAR(50),             -- 'zoom','google_meet','jitsi','teams','otro'
  password_reunion VARCHAR(50),            -- Password de la sala si aplica
  -- Control de estado
  estado          ENUM('programada','en_curso','finalizada','cancelada') DEFAULT 'programada',
  grabacion_url   VARCHAR(500),            -- URL de grabación post-sesión
  -- Metadatos
  created_by      INT UNSIGNED,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (programa_id)    REFERENCES programas(id)  ON DELETE SET NULL,
  FOREIGN KEY (facilitador_id) REFERENCES usuarios(id)   ON DELETE SET NULL,
  FOREIGN KEY (created_by)     REFERENCES usuarios(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Participantes inscritos / asistencia
CREATE TABLE IF NOT EXISTS capacitacion_participantes (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  capacitacion_id   INT UNSIGNED NOT NULL,
  -- El participante puede ser postulado, beneficiario o externo
  postulado_id      INT UNSIGNED,
  beneficiario_id   INT UNSIGNED,
  nombre_externo    VARCHAR(150),          -- Para participantes sin cuenta
  email_externo     VARCHAR(150),
  -- Estado de asistencia
  estado_asistencia ENUM('inscrito','asistio','no_asistio','certificado') DEFAULT 'inscrito',
  minutos_asistidos INT UNSIGNED DEFAULT 0,
  certificado_ruta  VARCHAR(500),
  -- Seguimiento
  fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capacitacion_id) REFERENCES capacitaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (postulado_id)    REFERENCES postulados(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Permisos para el módulo
INSERT IGNORE INTO permisos (modulo, accion, descripcion) VALUES
('capacitaciones', 'leer',      'Ver listado de capacitaciones y sesiones'),
('capacitaciones', 'crear',     'Programar nueva capacitacion o sesion virtual'),
('capacitaciones', 'editar',    'Editar datos de la capacitacion'),
('capacitaciones', 'eliminar',  'Cancelar o eliminar capacitacion'),
('capacitaciones', 'gestionar', 'Gestionar participantes, asistencia y certificados');

-- Dar todos los permisos al Superadmin
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos WHERE modulo = 'capacitaciones';

-- Dar permisos de lectura y gestión al Administrador
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE modulo = 'capacitaciones' AND accion != 'eliminar';
