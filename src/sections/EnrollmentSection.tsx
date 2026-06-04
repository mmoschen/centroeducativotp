import { FormEvent, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import type { SolicitudInscripcion } from '../types';

const initialForm: SolicitudInscripcion = {
  nombre_tutor: '',
  nombre_aspirante: '',
  nivel_solicitado: 'Nivel Inicial',
  email_contacto: '',
  telefono: '',
  mensaje: '',
};

export function EnrollmentSection() {
  const [form, setForm] = useState<SolicitudInscripcion>(initialForm);
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Enviando solicitud...');
    try {
      await api.crearSolicitud(form);
      setForm(initialForm);
      setStatus('Solicitud recibida. El estado inicial del trámite es "recibida".');
    } catch {
      setStatus('No se pudo enviar la solicitud. Verificá que el backend esté en ejecución.');
    }
  }

  return (
    <section id="inscripcion" className="section section-gray">
      <div className="container split-layout">
        <div>
          <SectionHeader
            eyebrow="Ciclo lectivo 2027"
            title="Solicitud de Inscripción"
            description="Formulario inicial para registrar familias interesadas. Los datos son de prueba y quedan guardados en SQLite para desarrollo."
          />
          <div className="process-card">
            <ClipboardCheck size={32} />
            <div>
              <h3>Estado inicial del trámite</h3>
              <p>Las solicitudes ingresan como recibidas para su posterior revisión administrativa.</p>
            </div>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            Nombre del tutor
            <input required value={form.nombre_tutor} onChange={(event) => setForm({ ...form, nombre_tutor: event.target.value })} />
          </label>
          <label>
            Nombre del aspirante
            <input required value={form.nombre_aspirante} onChange={(event) => setForm({ ...form, nombre_aspirante: event.target.value })} />
          </label>
          <label>
            Nivel solicitado
            <select required value={form.nivel_solicitado} onChange={(event) => setForm({ ...form, nivel_solicitado: event.target.value })}>
              <option>Nivel Inicial</option>
              <option>Nivel Primario</option>
              <option>Nivel Secundario</option>
            </select>
          </label>
          <div className="form-row">
            <label>
              Email
              <input required type="email" value={form.email_contacto} onChange={(event) => setForm({ ...form, email_contacto: event.target.value })} />
            </label>
            <label>
              Teléfono
              <input required value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
            </label>
          </div>
          <label>
            Mensaje
            <textarea rows={4} value={form.mensaje} onChange={(event) => setForm({ ...form, mensaje: event.target.value })} />
          </label>
          <Button type="submit">Enviar solicitud</Button>
          {status && <span className="form-status">{status}</span>}
        </form>
      </div>
    </section>
  );
}
