import express from 'express';
import cors from 'cors';
import { db, initializeDatabase } from './database.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

initializeDatabase();

app.use(cors());
app.use(express.json());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sendDbError(res, error) {
  res.status(500).json({ error: 'Error de base de datos.', detalle: error.message });
}

function requireFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
}

function selectFields(body, allowedFields) {
  return allowedFields.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function insertRecord(table, data) {
  if (table === 'cursos' && hasColumn(table, 'nombre') && !data.nombre) {
    data.nombre = [data.anio, data.division].filter(Boolean).join(' ') || data.nivel;
  }
  if (table === 'servicios' && hasColumn(table, 'icono') && !data.icono) {
    data.icono = 'school';
  }
  if (table === 'instalaciones' && hasColumn(table, 'imagen_url') && !data.imagen_url) {
    data.imagen_url = 'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900';
  }
  const fields = Object.keys(data);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map((field) => data[field]);
  const result = db
    .prepare(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`)
    .run(...values);
  return result.lastInsertRowid;
}

function updateRecord(table, id, data) {
  if (table === 'cursos' && hasColumn(table, 'nombre') && (data.anio || data.division)) {
    const current = getById(table, id) ?? {};
    data.nombre = [data.anio ?? current.anio, data.division ?? current.division].filter(Boolean).join(' ') || (data.nivel ?? current.nivel);
  }
  const fields = Object.keys(data);
  if (fields.length === 0) return 0;
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);
  return db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, id).changes;
}

function getById(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
}

function crudRoutes({ basePath, table, allowedFields, requiredFields, orderBy = 'id DESC', softDeleteField }) {
  app.get(basePath, (_req, res) => {
    try {
      res.json(db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all());
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get(`${basePath}/:id`, (req, res) => {
    try {
      const record = getById(table, req.params.id);
      if (!record) return res.status(404).json({ error: 'Registro no encontrado.' });
      res.json(record);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.post(basePath, (req, res) => {
    const missing = requireFields(req.body, requiredFields);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    }

    try {
      const data = selectFields(req.body, allowedFields);
      const id = insertRecord(table, data);
      res.status(201).json(getById(table, id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.put(`${basePath}/:id`, (req, res) => {
    try {
      const data = selectFields(req.body, allowedFields);
      const changes = updateRecord(table, req.params.id, data);
      if (!changes) return res.status(404).json({ error: 'Registro no encontrado o sin cambios.' });
      res.json(getById(table, req.params.id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.delete(`${basePath}/:id`, (req, res) => {
    try {
      let changes;
      if (softDeleteField) {
        changes = db.prepare(`UPDATE ${table} SET ${softDeleteField} = ? WHERE id = ?`).run('inactivo', req.params.id).changes;
      } else {
        changes = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id).changes;
      }
      if (!changes) return res.status(404).json({ error: 'Registro no encontrado.' });
      res.json({ ok: true });
    } catch (error) {
      sendDbError(res, error);
    }
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', proyecto: 'Educar para Transformar' });
});

app.get('/api/niveles', (_req, res) => {
  res.json(db.prepare('SELECT * FROM niveles_educativos ORDER BY id').all());
});

crudRoutes({
  basePath: '/api/alumnos',
  table: 'alumnos',
  allowedFields: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'nivel', 'curso', 'division', 'tutor_nombre', 'tutor_email', 'tutor_telefono', 'estado'],
  requiredFields: ['nombre', 'apellido', 'nivel'],
  orderBy: 'created_at DESC, id DESC',
  softDeleteField: 'estado',
});

crudRoutes({
  basePath: '/api/docentes',
  table: 'docentes',
  allowedFields: ['nombre', 'apellido', 'dni', 'email', 'telefono', 'especialidad', 'estado'],
  requiredFields: ['nombre', 'apellido', 'email', 'especialidad'],
  orderBy: 'created_at DESC, id DESC',
  softDeleteField: 'estado',
});

crudRoutes({
  basePath: '/api/cursos',
  table: 'cursos',
  allowedFields: ['nivel', 'anio', 'division', 'turno', 'descripcion'],
  requiredFields: ['nivel', 'anio', 'turno'],
  orderBy: 'nivel, anio, division',
});

crudRoutes({
  basePath: '/api/asignaciones-docentes',
  table: 'asignaciones_docentes',
  allowedFields: ['docente_id', 'curso_id', 'materia', 'dia', 'horario'],
  requiredFields: ['docente_id', 'curso_id', 'materia'],
  orderBy: 'id DESC',
});

crudRoutes({
  basePath: '/api/servicios',
  table: 'servicios',
  allowedFields: ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'],
  requiredFields: ['nombre', 'descripcion'],
  orderBy: 'id',
});

crudRoutes({
  basePath: '/api/instalaciones',
  table: 'instalaciones',
  allowedFields: ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'],
  requiredFields: ['nombre', 'descripcion'],
  orderBy: 'id',
});

app.get('/api/noticias', (req, res) => {
  try {
    const where = req.query.all === '1' ? '' : 'WHERE visible = 1';
    res.json(db.prepare(`SELECT * FROM noticias ${where} ORDER BY fecha_publicacion DESC, id DESC`).all());
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/noticias/:id', (req, res) => {
  const noticia = getById('noticias', req.params.id);
  if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada.' });
  res.json(noticia);
});

app.post('/api/noticias', (req, res) => {
  const missing = requireFields(req.body, ['titulo', 'descripcion', 'tipo']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });

  try {
    const id = insertRecord('noticias', {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      contenido: req.body.contenido ?? req.body.descripcion,
      fecha_publicacion: req.body.fecha_publicacion ?? today(),
      tipo: req.body.tipo,
      visible: req.body.visible ?? 1,
      imagen_url: req.body.imagen_url ?? '',
    });
    res.status(201).json(getById('noticias', id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/noticias/:id', (req, res) => {
  try {
    const data = selectFields(req.body, ['titulo', 'descripcion', 'contenido', 'fecha_publicacion', 'tipo', 'visible', 'imagen_url']);
    const changes = updateRecord('noticias', req.params.id, data);
    if (!changes) return res.status(404).json({ error: 'Noticia no encontrada o sin cambios.' });
    res.json(getById('noticias', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.delete('/api/noticias/:id', (req, res) => {
  try {
    const changes = db.prepare('UPDATE noticias SET visible = 0 WHERE id = ?').run(req.params.id).changes;
    if (!changes) return res.status(404).json({ error: 'Noticia no encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/opiniones', (req, res) => {
  try {
    const where = req.query.all === '1' ? '' : "WHERE estado_moderacion = 'visible' AND visible = 1";
    res.json(db.prepare(`SELECT * FROM opiniones_web ${where} ORDER BY fecha_publicacion DESC, id DESC`).all());
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/opiniones', (req, res) => {
  const { autor_anonimo, comentario } = req.body;
  if (!autor_anonimo || !comentario) {
    return res.status(400).json({ error: 'Autor y comentario son obligatorios.' });
  }

  try {
    const id = insertRecord('opiniones_web', {
      autor_anonimo,
      comentario,
      estado_moderacion: req.body.estado_moderacion ?? 'pendiente',
      visible: req.body.visible ?? 0,
    });
    res.status(201).json(getById('opiniones_web', id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/opiniones/:id/moderar', (req, res) => {
  try {
    const estado = req.body.estado_moderacion ?? req.body.estado ?? 'visible';
    const visible = estado === 'visible' ? 1 : 0;
    const changes = db
      .prepare('UPDATE opiniones_web SET estado_moderacion = ?, visible = ? WHERE id = ?')
      .run(estado, visible, req.params.id).changes;
    if (!changes) return res.status(404).json({ error: 'Opinion no encontrada.' });
    res.json(getById('opiniones_web', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/solicitudes-inscripcion', (_req, res) => {
  res.json(db.prepare('SELECT * FROM solicitudes_inscripcion ORDER BY fecha_solicitud DESC, id DESC').all());
});

app.post('/api/solicitudes-inscripcion', (req, res) => {
  const missing = requireFields(req.body, ['nombre_tutor', 'nombre_aspirante', 'nivel_solicitado', 'email_contacto', 'telefono']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(req.body.email_contacto)) return res.status(400).json({ error: 'Email de contacto invalido.' });

  try {
    const id = insertRecord('solicitudes_inscripcion', {
      nombre_tutor: req.body.nombre_tutor,
      nombre_aspirante: req.body.nombre_aspirante,
      nivel_solicitado: req.body.nivel_solicitado,
      email_contacto: req.body.email_contacto,
      telefono: req.body.telefono,
      mensaje: req.body.mensaje ?? '',
    });
    res.status(201).json(getById('solicitudes_inscripcion', id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/solicitudes-inscripcion/:id/estado', (req, res) => {
  try {
    const estado = req.body.estado_tramite ?? req.body.estado ?? 'en revision';
    const changes = db.prepare('UPDATE solicitudes_inscripcion SET estado_tramite = ? WHERE id = ?').run(estado, req.params.id).changes;
    if (!changes) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    res.json(getById('solicitudes_inscripcion', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

function getPostulaciones(_req, res) {
  res.json(db.prepare('SELECT * FROM postulaciones_empleo ORDER BY fecha_recepcion DESC, id DESC').all());
}

function createPostulacion(req, res) {
  const missing = requireFields(req.body, ['nombre_candidato', 'email', 'telefono', 'puesto_interes']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(req.body.email)) return res.status(400).json({ error: 'Email invalido.' });

  try {
    const id = insertRecord('postulaciones_empleo', {
      nombre_candidato: req.body.nombre_candidato,
      email: req.body.email,
      telefono: req.body.telefono,
      puesto_interes: req.body.puesto_interes,
      enlace_cv: req.body.enlace_cv ?? '',
      mensaje: req.body.mensaje ?? '',
      estado: req.body.estado ?? 'recibida',
    });
    res.status(201).json(getById('postulaciones_empleo', id));
  } catch (error) {
    sendDbError(res, error);
  }
}

app.get('/api/postulaciones', getPostulaciones);
app.get('/api/postulaciones-empleo', getPostulaciones);
app.post('/api/postulaciones', createPostulacion);
app.post('/api/postulaciones-empleo', createPostulacion);

app.put('/api/postulaciones/:id/estado', (req, res) => {
  try {
    const estado = req.body.estado ?? 'en revision';
    const changes = db.prepare('UPDATE postulaciones_empleo SET estado = ? WHERE id = ?').run(estado, req.params.id).changes;
    if (!changes) return res.status(404).json({ error: 'Postulacion no encontrada.' });
    res.json(getById('postulaciones_empleo', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

function getUsuarios(_req, res) {
  res.json(db.prepare('SELECT id, nombre, nombre_usuario, email, rol, estado, created_at FROM usuarios_acceso ORDER BY rol, id').all());
}

app.get('/api/usuarios', getUsuarios);
app.get('/api/usuarios-acceso', getUsuarios);

app.post('/api/usuarios', (req, res) => {
  const missing = requireFields(req.body, ['nombre', 'email', 'password_demo', 'rol']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(req.body.email)) return res.status(400).json({ error: 'Email invalido.' });

  try {
    const id = insertRecord('usuarios_acceso', {
      nombre: req.body.nombre,
      nombre_usuario: req.body.nombre_usuario ?? req.body.email.split('@')[0],
      email: req.body.email,
      password_demo: req.body.password_demo,
      rol: req.body.rol,
      estado: req.body.estado ?? 'activo',
      referencia_id: req.body.referencia_id ?? null,
    });
    const { password_demo, ...usuario } = getById('usuarios_acceso', id);
    res.status(201).json(usuario);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/usuarios/:id', (req, res) => {
  try {
    const data = selectFields(req.body, ['nombre', 'nombre_usuario', 'email', 'password_demo', 'rol', 'estado', 'referencia_id']);
    const changes = updateRecord('usuarios_acceso', req.params.id, data);
    if (!changes) return res.status(404).json({ error: 'Usuario no encontrado o sin cambios.' });
    const { password_demo, ...usuario } = getById('usuarios_acceso', req.params.id);
    res.json(usuario);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/login-demo', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password son obligatorios.' });

  const user = db
    .prepare("SELECT * FROM usuarios_acceso WHERE email = ? AND password_demo = ? AND estado = 'activo'")
    .get(email, password);

  if (!user) return res.status(401).json({ error: 'Credenciales demo invalidas.' });
  const { password_demo, ...safeUser } = user;
  res.json({ usuario: safeUser });
});

crudRoutes({
  basePath: '/api/actividades',
  table: 'actividades_escolares',
  allowedFields: ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'],
  requiredFields: ['titulo', 'descripcion', 'nivel', 'fecha'],
  orderBy: 'fecha ASC, id DESC',
});

crudRoutes({
  basePath: '/api/galeria',
  table: 'galeria_imagenes',
  allowedFields: ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'],
  requiredFields: ['titulo', 'url_imagen'],
  orderBy: 'id DESC',
});

app.post('/api/contacto', (req, res) => {
  const missing = requireFields(req.body, ['nombre', 'email', 'mensaje']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(req.body.email)) return res.status(400).json({ error: 'Email invalido.' });

  try {
    const id = insertRecord('contacto_mensajes', {
      nombre: req.body.nombre,
      email: req.body.email,
      asunto: req.body.asunto ?? 'Consulta web',
      mensaje: req.body.mensaje,
    });
    res.status(201).json(getById('contacto_mensajes', id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/contacto', (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacto_mensajes ORDER BY fecha_recepcion DESC, id DESC').all());
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`API Educar para Transformar disponible en http://localhost:${PORT}`);
});
