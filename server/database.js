import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseDir = process.env.VERCEL ? tmpdir() : join(__dirname, '..', 'database');
mkdirSync(databaseDir, { recursive: true });

export const db = new DatabaseSync(join(databaseDir, 'educar_transformar.sqlite'));

export function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS niveles_educativos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      etiqueta TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alumnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      dni TEXT DEFAULT '',
      fecha_nacimiento TEXT DEFAULT '',
      nivel TEXT NOT NULL,
      curso TEXT DEFAULT '',
      division TEXT DEFAULT '',
      tutor_nombre TEXT DEFAULT '',
      tutor_email TEXT DEFAULT '',
      tutor_telefono TEXT DEFAULT '',
      estado TEXT DEFAULT 'activo',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS docentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      dni TEXT DEFAULT '',
      email TEXT NOT NULL,
      telefono TEXT DEFAULT '',
      especialidad TEXT NOT NULL,
      estado TEXT DEFAULT 'activo',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nivel TEXT NOT NULL,
      anio TEXT DEFAULT '',
      division TEXT DEFAULT '',
      turno TEXT NOT NULL,
      descripcion TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS asignaciones_docentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      docente_id INTEGER NOT NULL,
      curso_id INTEGER NOT NULL,
      materia TEXT NOT NULL,
      dia TEXT DEFAULT '',
      horario TEXT DEFAULT '',
      FOREIGN KEY (docente_id) REFERENCES docentes(id),
      FOREIGN KEY (curso_id) REFERENCES cursos(id)
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      tipo TEXT DEFAULT 'general',
      disponible INTEGER DEFAULT 1,
      icono TEXT DEFAULT 'school'
    );

    CREATE TABLE IF NOT EXISTS instalaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      tipo TEXT DEFAULT 'educativa',
      disponible INTEGER DEFAULT 1,
      imagen_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS alumnos_servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    CREATE TABLE IF NOT EXISTS asistencias_diarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      presente INTEGER NOT NULL,
      observacion TEXT,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
    );

    CREATE TABLE IF NOT EXISTS evaluaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curso_id INTEGER NOT NULL,
      materia TEXT NOT NULL,
      titulo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (curso_id) REFERENCES cursos(id)
    );

    CREATE TABLE IF NOT EXISTS calificaciones_alumnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id INTEGER NOT NULL,
      evaluacion_id INTEGER NOT NULL,
      calificacion REAL,
      observacion TEXT,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
      FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
    );

    CREATE TABLE IF NOT EXISTS usuarios_acceso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT DEFAULT '',
      nombre_usuario TEXT DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      password_demo TEXT DEFAULT '',
      rol TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'docente', 'personal', 'admin')),
      estado TEXT DEFAULT 'activo',
      referencia_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opiniones_web (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      autor_anonimo TEXT NOT NULL,
      comentario TEXT NOT NULL,
      fecha_publicacion TEXT DEFAULT CURRENT_TIMESTAMP,
      estado_moderacion TEXT DEFAULT 'pendiente',
      visible INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_tutor TEXT NOT NULL,
      nombre_aspirante TEXT NOT NULL,
      nivel_solicitado TEXT NOT NULL,
      email_contacto TEXT NOT NULL,
      telefono TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
      estado_tramite TEXT DEFAULT 'recibida'
    );

    CREATE TABLE IF NOT EXISTS postulaciones_empleo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_candidato TEXT NOT NULL,
      email TEXT NOT NULL,
      telefono TEXT NOT NULL,
      puesto_interes TEXT NOT NULL,
      enlace_cv TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
      estado TEXT DEFAULT 'recibida'
    );

    CREATE TABLE IF NOT EXISTS noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      contenido TEXT DEFAULT '',
      fecha_publicacion TEXT NOT NULL,
      tipo TEXT NOT NULL,
      visible INTEGER DEFAULT 1,
      imagen_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS actividades_escolares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      nivel TEXT NOT NULL,
      fecha TEXT NOT NULL,
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS galeria_imagenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT DEFAULT '',
      url_imagen TEXT NOT NULL,
      categoria TEXT DEFAULT 'Institucional',
      visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS contacto_mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      asunto TEXT DEFAULT 'Consulta web',
      mensaje TEXT NOT NULL,
      fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
      estado TEXT DEFAULT 'nuevo'
    );
  `);

  runMigrations();
  seedDatabase();
}

function runMigrations() {
  [
    ['alumnos', 'dni', "TEXT DEFAULT ''"],
    ['alumnos', 'fecha_nacimiento', "TEXT DEFAULT ''"],
    ['alumnos', 'curso', "TEXT DEFAULT ''"],
    ['alumnos', 'division', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_nombre', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_email', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_telefono', "TEXT DEFAULT ''"],
    ['alumnos', 'estado', "TEXT DEFAULT 'activo'"],
    ['alumnos', 'created_at', "TEXT DEFAULT ''"],
    ['docentes', 'dni', "TEXT DEFAULT ''"],
    ['docentes', 'telefono', "TEXT DEFAULT ''"],
    ['docentes', 'estado', "TEXT DEFAULT 'activo'"],
    ['docentes', 'created_at', "TEXT DEFAULT ''"],
    ['cursos', 'anio', "TEXT DEFAULT ''"],
    ['cursos', 'division', "TEXT DEFAULT ''"],
    ['cursos', 'descripcion', "TEXT DEFAULT ''"],
    ['asignaciones_docentes', 'dia', "TEXT DEFAULT ''"],
    ['asignaciones_docentes', 'horario', "TEXT DEFAULT ''"],
    ['servicios', 'tipo', "TEXT DEFAULT 'general'"],
    ['servicios', 'disponible', 'INTEGER DEFAULT 1'],
    ['servicios', 'icono', "TEXT DEFAULT 'school'"],
    ['instalaciones', 'tipo', "TEXT DEFAULT 'educativa'"],
    ['instalaciones', 'disponible', 'INTEGER DEFAULT 1'],
    ['instalaciones', 'imagen_url', "TEXT DEFAULT ''"],
    ['noticias', 'contenido', "TEXT DEFAULT ''"],
    ['noticias', 'imagen_url', "TEXT DEFAULT ''"],
    ['opiniones_web', 'visible', 'INTEGER DEFAULT 1'],
    ['postulaciones_empleo', 'estado', "TEXT DEFAULT 'recibida'"],
    ['usuarios_acceso', 'nombre', "TEXT DEFAULT ''"],
    ['usuarios_acceso', 'password_demo', "TEXT DEFAULT ''"],
    ['usuarios_acceso', 'estado', "TEXT DEFAULT 'activo'"],
    ['usuarios_acceso', 'created_at', "TEXT DEFAULT ''"],
  ].forEach(([table, column, definition]) => ensureColumn(table, column, definition));

  if (hasColumn('cursos', 'nombre')) {
    db.exec("UPDATE cursos SET anio = COALESCE(NULLIF(anio, ''), nombre) WHERE anio = '' OR anio IS NULL");
  }

  if (hasColumn('alumnos', 'fecha_alta')) {
    db.exec("UPDATE alumnos SET created_at = COALESCE(created_at, fecha_alta) WHERE created_at IS NULL");
  }

  if (hasColumn('docentes', 'activo')) {
    db.exec("UPDATE docentes SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'inactivo' END WHERE estado IS NULL OR estado = ''");
  }

  if (hasColumn('usuarios_acceso', 'activo')) {
    db.exec("UPDATE usuarios_acceso SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'inactivo' END WHERE estado IS NULL OR estado = ''");
  }
}

function ensureColumn(tableName, columnName, definition) {
  if (!hasColumn(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function hasColumn(tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);
}

function tableIsEmpty(tableName) {
  return db.prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get().total === 0;
}

function seedDatabase() {
  seedNiveles();
  seedServicios();
  seedInstalaciones();
  seedNoticias();
  seedOpiniones();
  seedDocentes();
  seedCursos();
  seedAlumnos();
  seedAsignaciones();
  seedUsuarios();
  seedActividades();
  seedGaleria();
}

function seedNiveles() {
  if (!tableIsEmpty('niveles_educativos')) return;
  const insert = db.prepare('INSERT INTO niveles_educativos (nombre, descripcion, etiqueta) VALUES (?, ?, ?)');
  [
    ['Nivel Inicial', 'Educacion temprana basada en el juego, la exploracion y el desarrollo socioemocional.', 'Salas de 3, 4 y 5'],
    ['Nivel Primario', 'Formacion integral para construir habitos de estudio, pensamiento critico y valores comunitarios.', '1ro a 7mo grado'],
    ['Nivel Secundario', 'Preparacion academica con orientacion vocacional, tecnologia e idiomas.', 'Ciclo basico y orientado'],
  ].forEach((row) => insert.run(...row));
}

function seedServicios() {
  if (!tableIsEmpty('servicios')) return;
  const insert = db.prepare('INSERT INTO servicios (nombre, descripcion, tipo, disponible, icono) VALUES (?, ?, ?, ?, ?)');
  [
    ['Comedor', 'Menu escolar planificado para acompanar la jornada extendida.', 'bienestar', 1, 'utensils'],
    ['Enfermeria', 'Atencion primaria y seguimiento de situaciones de salud dentro de la institucion.', 'salud', 1, 'heart-pulse'],
    ['Idiomas', 'Ingles y talleres complementarios para todos los niveles.', 'academico', 1, 'languages'],
    ['Deportes', 'Actividades deportivas, torneos y acompanamiento fisico saludable.', 'deportivo', 1, 'trophy'],
    ['Transporte', 'Servicio de traslado planificado para familias de Resistencia y alrededores.', 'logistica', 1, 'bus'],
  ].forEach((row) => insert.run(...row));
}

function seedInstalaciones() {
  if (!tableIsEmpty('instalaciones')) return;
  const insert = db.prepare('INSERT INTO instalaciones (nombre, descripcion, tipo, disponible, imagen_url) VALUES (?, ?, ?, ?, ?)');
  [
    ['Aulas equipadas', 'Espacios luminosos con mobiliario flexible y recursos digitales.', 'academica', 1, 'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Laboratorios', 'Ambientes preparados para ciencias, tecnologia y experiencias practicas.', 'academica', 1, 'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Gimnasio', 'Area cubierta para educacion fisica, encuentros y actividades institucionales.', 'deportiva', 1, 'https://images.unsplash.com/photo-1759641801965-a15a53b877b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Pileta', 'Espacio recreativo y deportivo para propuestas acuaticas supervisadas.', 'deportiva', 1, 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Canchas', 'Sectores exteriores para deportes, recreos y actividades grupales.', 'deportiva', 1, 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
  ].forEach((row) => insert.run(...row));
}

function seedNoticias() {
  if (!tableIsEmpty('noticias')) return;
  const insert = db.prepare(`
    INSERT INTO noticias (titulo, descripcion, contenido, fecha_publicacion, tipo, visible, imagen_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Proceso de inscripcion 2027 abierto', 'Ya se encuentra disponible la solicitud de inscripcion para familias interesadas.', 'Las familias pueden completar el formulario web y esperar el contacto administrativo para avanzar con la entrevista inicial.', '2026-05-01', 'Inscripcion', 1, 'https://images.unsplash.com/photo-1758270705639-9727f350f026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Recorrida por las nuevas instalaciones', 'Invitamos a conocer los espacios proyectados para aulas, laboratorios y deporte.', 'La recorrida institucional permite presentar el campus educativo y responder consultas de las familias.', '2026-04-15', 'Institucional', 1, 'https://images.unsplash.com/photo-1774386897531-1f5d7741409c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ['Presentacion del proyecto pedagogico', 'La institucion presento su propuesta centrada en excelencia academica e innovacion.', 'El proyecto articula acompanamiento, tecnologia, idiomas, deportes y actividades escolares.', '2026-04-10', 'Academica', 1, 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
  ].forEach((row) => insert.run(...row));
}

function seedOpiniones() {
  if (!tableIsEmpty('opiniones_web')) return;
  const insert = db.prepare('INSERT INTO opiniones_web (autor_anonimo, comentario, estado_moderacion, visible) VALUES (?, ?, ?, ?)');
  [
    ['Madre de familia', 'La propuesta institucional transmite organizacion, cercania y una mirada integral sobre cada estudiante.', 'visible', 1],
    ['Tutor interesado', 'Nos gusto que el proyecto combine formacion academica, deportes, idiomas y acompanamiento personalizado.', 'visible', 1],
    ['Docente postulante', 'Se percibe un espacio de trabajo serio, colaborativo y con oportunidades de crecimiento profesional.', 'pendiente', 0],
  ].forEach((row) => insert.run(...row));
}

function seedDocentes() {
  if (!tableIsEmpty('docentes')) return;
  const insert = db.prepare('INSERT INTO docentes (nombre, apellido, dni, email, telefono, especialidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)');
  [
    ['Laura', 'Benitez', '30111222', 'laura.benitez@educar.com', '3624001001', 'Nivel Inicial', 'activo'],
    ['Martin', 'Aguirre', '28999888', 'martin.aguirre@educar.com', '3624001002', 'Nivel Primario', 'activo'],
    ['Carolina', 'Molina', '32777444', 'carolina.molina@educar.com', '3624001003', 'Ciencias', 'activo'],
  ].forEach((row) => insert.run(...row));
}

function seedCursos() {
  if (!tableIsEmpty('cursos')) return;
  const insert = db.prepare('INSERT INTO cursos (nivel, anio, division, turno, descripcion) VALUES (?, ?, ?, ?, ?)');
  [
    ['Inicial', 'Sala de 5', 'A', 'Manana', 'Grupo de preparacion para primer grado.'],
    ['Primario', '4to', 'A', 'Manana', 'Curso de nivel primario con jornada extendida opcional.'],
    ['Secundario', '1ro', 'A', 'Tarde', 'Primer ano del ciclo basico secundario.'],
  ].forEach((row) => insert.run(...row));
}

function seedAlumnos() {
  if (!tableIsEmpty('alumnos')) return;
  const insert = db.prepare(`
    INSERT INTO alumnos
    (nombre, apellido, dni, fecha_nacimiento, nivel, curso, division, tutor_nombre, tutor_email, tutor_telefono, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Sofia', 'Ramirez', '53111222', '2021-08-12', 'Inicial', 'Sala de 5', 'A', 'Mariana Ramirez', 'mariana.demo@educar.com', '3624011001', 'activo'],
    ['Tomas', 'Pereyra', '50122333', '2016-03-25', 'Primario', '4to', 'A', 'Lucas Pereyra', 'lucas.demo@educar.com', '3624011002', 'activo'],
    ['Valentina', 'Gomez', '48133444', '2013-10-05', 'Secundario', '1ro', 'A', 'Paula Gomez', 'paula.demo@educar.com', '3624011003', 'activo'],
  ].forEach((row) => insert.run(...row));
}

function seedAsignaciones() {
  if (!tableIsEmpty('asignaciones_docentes')) return;
  const insert = db.prepare('INSERT INTO asignaciones_docentes (docente_id, curso_id, materia, dia, horario) VALUES (?, ?, ?, ?, ?)');
  [
    [1, 1, 'Ambiente natural y social', 'Lunes', '08:00 - 10:00'],
    [2, 2, 'Matematica', 'Martes', '09:00 - 11:00'],
    [3, 3, 'Ciencias Naturales', 'Miercoles', '14:00 - 16:00'],
  ].forEach((row) => insert.run(...row));
}

function seedUsuarios() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO usuarios_acceso
    (nombre, nombre_usuario, email, password_demo, rol, estado, referencia_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Administrador Demo', 'admin_educar', 'admin@educar.com', 'admin123', 'admin', 'activo', null],
    ['Docente Demo', 'docente_educar', 'docente@educar.com', 'docente123', 'docente', 'activo', 1],
    ['Padre Demo', 'padre_educar', 'padre@educar.com', 'padre123', 'padre', 'activo', null],
    ['Alumno Demo', 'alumno_educar', 'alumno@educar.com', 'alumno123', 'alumno', 'activo', 1],
    ['Personal Demo', 'personal_educar', 'personal@educar.com', 'personal123', 'personal', 'activo', null],
  ].forEach((row) => insert.run(...row));
}

function seedActividades() {
  if (!tableIsEmpty('actividades_escolares')) return;
  const insert = db.prepare('INSERT INTO actividades_escolares (titulo, descripcion, nivel, fecha, visible) VALUES (?, ?, ?, ?, ?)');
  [
    ['Jornada de bienvenida familiar', 'Encuentro institucional para presentar equipos, espacios y modalidad de trabajo.', 'Todos los niveles', '2027-03-04', 1],
    ['Taller de lectura compartida', 'Actividad de promocion lectora para estudiantes de nivel primario.', 'Primario', '2027-04-12', 1],
    ['Muestra de ciencias y tecnologia', 'Presentacion de experiencias de laboratorio y proyectos interdisciplinarios.', 'Secundario', '2027-06-18', 1],
  ].forEach((row) => insert.run(...row));
}

function seedGaleria() {
  if (!tableIsEmpty('galeria_imagenes')) return;
  const insert = db.prepare('INSERT INTO galeria_imagenes (titulo, descripcion, url_imagen, categoria, visible) VALUES (?, ?, ?, ?, ?)');
  [
    ['Aulas equipadas', 'Espacios flexibles para el aprendizaje.', 'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Instalaciones', 1],
    ['Laboratorio escolar', 'Practicas de ciencias y tecnologia.', 'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Academico', 1],
    ['Actividad deportiva', 'Propuestas fisicas y recreativas.', 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Deportes', 1],
    ['Campus educativo', 'Predio amplio en las afueras de Resistencia.', 'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Institucional', 1],
  ].forEach((row) => insert.run(...row));
}
