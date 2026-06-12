# 🌿 UT COMEXAGRO – Sistema de Gestión Administrativa

Sistema web para la **Unión Temporal COMEXAGRO**, orientado al desarrollo agrícola, asistencia técnica y capacitación rural a nivel nacional en Colombia.

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | HTML5, CSS3 Vanilla, JavaScript ES6+ |
| **Backend** | PHP 8.x – REST API |
| **Base de Datos** | MySQL 8 (XAMPP) |
| **Seguridad** | JWT HS256 con control de inactividad |
| **Servidor local** | XAMPP (Apache + MySQL) |

## 📦 Módulos del Sistema

| Módulo | Estado |
|---|---|
| 🌐 Landing Page pública | ✅ Completado |
| 👤 Registro de Postulados (modal 5 pasos) | ✅ Completado |
| 📋 Radicación de PQRs | ✅ Completado |
| 🔐 Login + JWT | 🔄 En desarrollo |
| ⚙️ CONFIGURACIÓN (usuarios, roles, permisos) | 🔄 Pendiente |
| 📄 CONTRATACIÓN (evaluación + contratos + nómina) | 🔄 Pendiente |
| 👥 POSTULADOS (gestión admin) | 🔄 Pendiente |
| 💰 PRESUPUESTO | 🔄 Pendiente |
| 📦 INVENTARIOS | 🔄 Pendiente |
| 📊 ENCUESTAS | 🔄 Pendiente |
| 🎓 CAPACITACIONES (+ API sesiones virtuales) | 🔄 Pendiente |

## ⚙️ Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/utcomexagro.git
cd xampp/htdocs/utcomexagro
```

### 2. Configurar la base de datos
```bash
# En phpMyAdmin o MySQL CLI:
mysql -u root -p < database/utcomexagro.sql
```

### 3. Configurar el archivo de configuración
```bash
cp api/config/config.example.php api/config/config.php
# Editar config.php con tus credenciales de BD
```

### 4. Crear directorios de uploads
```bash
mkdir -p uploads/postulados uploads/pqrs uploads/contratos
```

### 5. Acceder en el navegador
```
http://localhost/utcomexagro/
```

## 🔐 Seguridad

- `api/config/config.php` → **NO se sube a GitHub** (contiene credenciales)
- `uploads/` → Los archivos subidos por usuarios **no se sincronizan** al repo
- JWT con expiración de 15 min + control de inactividad de 30 min
- RBAC granular: permisos por módulo y acción (crear/leer/editar/eliminar)

## 👤 Usuario Administrador Inicial

| Campo | Valor |
|---|---|
| Email | `admin@utcomexagro.com` |
| Contraseña | `Admin2024!` ← **Cambiar en primer acceso** |

## 📁 Estructura del Proyecto

```
utcomexagro/
├── index.html                  ← Landing pública
├── login.html                  ← Login administrativo
├── admin/                      ← Panel admin (Fase 2)
├── api/
│   ├── config/
│   │   ├── config.example.php  ← Plantilla (se sube al repo)
│   │   ├── config.php          ← Credenciales reales (NO en repo)
│   │   ├── db.php
│   │   ├── jwt.php
│   │   └── cors.php
│   ├── auth/                   ← Login, refresh, logout (Fase 2)
│   ├── postulados/
│   ├── pqrs/
│   └── contratacion/           ← Fase 4+
├── assets/
│   ├── css/main.css
│   └── js/
│       ├── main.js
│       └── colombia-data.js
├── database/
│   ├── utcomexagro.sql         ← Script principal
│   └── migrations/             ← Cambios incrementales
└── uploads/                    ← Documentos (NO en repo)
```

## 🤝 Flujo de trabajo con Git

```bash
# Obtener últimos cambios (siempre antes de trabajar)
git pull origin main

# Ver cambios realizados
git status

# Agregar y subir cambios
git add .
git commit -m "descripción del cambio"
git push origin main
```

---
*Desarrollado para UT COMEXAGRO – Desarrollo Agrícola Nacional* 🌿
