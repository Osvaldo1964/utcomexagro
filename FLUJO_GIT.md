# 🔄 Guía de Trabajo con Git – UT COMEXAGRO

> Documento de referencia rápida para sincronizar el proyecto entre la oficina y la casa.

---

## 📋 Resumen Rápido

| Situación | Comando clave |
|---|---|
| Llegar a trabajar | `git pull origin main` |
| Ver qué cambié | `git status` |
| Guardar y subir | `git add .` → `git commit -m "..."` → `git push` |
| Ver historial | `git log --oneline -10` |

---

## 🏢 En la Oficina

### Al llegar (traer cambios de casa)
```bash
git pull origin main
```

### Durante el trabajo – ver qué archivos cambiaste
```bash
git status
```

### Al terminar el día – guardar y subir
```bash
# 1. Agregar todos los cambios
git add .

# 2. Hacer commit con descripción clara
git commit -m "feat: descripción de lo que hiciste hoy"

# 3. Subir a GitHub
git push origin main
```

---

## 🏠 En Casa – Primera vez (clonar)

Solo se hace **una vez** al configurar el PC de la casa.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Osvaldo1964/utcomexagro.git

# 2. Entrar a la carpeta (moverla a htdocs de XAMPP)
#    Cortar y pegar la carpeta utcomexagro en: C:\xampp\htdocs\

# 3. Copiar el archivo de configuración
copy api\config\config.example.php api\config\config.php

# 4. Editar config.php con el editor y poner tus credenciales de BD local

# 5. Crear la base de datos
#    Abrir phpMyAdmin → Importar → database/utcomexagro.sql

# 6. Probar en el navegador
#    http://localhost/utcomexagro/
```

---

## 🏠 En Casa – Días siguientes

```bash
# SIEMPRE primero: traer lo nuevo de la oficina
git pull origin main

# ... trabajar, hacer cambios ...

# Al terminar: guardar y subir
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 📝 Cómo escribir buenos mensajes de commit

Usar un prefijo que indique el tipo de cambio:

| Prefijo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat:` | Nueva funcionalidad | `feat: agregar módulo de contratos` |
| `fix:` | Corrección de error | `fix: validación de email en postulados` |
| `style:` | Cambios de diseño/CSS | `style: ajustar colores del navbar` |
| `db:` | Cambios en la BD | `db: agregar tabla de capacitaciones` |
| `docs:` | Documentación | `docs: actualizar README` |
| `wip:` | Trabajo en progreso | `wip: panel admin en construcción` |

---

## ⚠️ Reglas importantes

> [!IMPORTANT]
> **`api/config/config.php` NUNCA se sube a GitHub.**
> Cada PC tiene su propio `config.php` con sus credenciales locales.
> Si lo borras accidentalmente, copia `config.example.php` y vuelve a configurar.

> [!WARNING]
> **Siempre haz `git pull` ANTES de empezar a trabajar.**
> Si olvidaste hacer pull y ya modificaste archivos, podría haber conflictos.

> [!NOTE]
> **Los archivos subidos por usuarios (`/uploads/`) no se sincronizan.**
> Eso es intencional – los documentos de postulados no van al repositorio.

---

## 🛠️ Solución de problemas comunes

### "There is no tracking information for the current branch"
```bash
git push --set-upstream origin main
```

### Conflicto al hacer pull (alguien editó el mismo archivo)
```bash
# Git marcará el archivo con conflicto, búscalo con:
git status

# Abre el archivo, busca las marcas <<<<<<< y resuelve manualmente
# Luego:
git add .
git commit -m "fix: resolver conflicto en [archivo]"
```

### Ver qué cambió en un archivo antes de subir
```bash
git diff nombre-del-archivo.php
```

### Deshacer el último commit (sin perder los cambios)
```bash
git reset --soft HEAD~1
```

### Ver historial de commits
```bash
git log --oneline -10
```

---

## 🔗 Repositorio del Proyecto

- **URL:** https://github.com/Osvaldo1964/utcomexagro
- **Rama principal:** `main`
- **Local (oficina):** `C:\xampp\htdocs\utcomexagro\`
