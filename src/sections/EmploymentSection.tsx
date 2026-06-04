import { BriefcaseBusiness, GraduationCap, Lightbulb, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import type { PostulacionEmpleo } from '../types';

const benefits = [
  { title: 'Desarrollo profesional', description: 'Capacitación continua y crecimiento en la carrera educativa.', icon: GraduationCap },
  { title: 'Equipo colaborativo', description: 'Ambiente de trabajo positivo, organizado y participativo.', icon: UsersRound },
  { title: 'Innovación educativa', description: 'Proyecto pedagógico moderno y orientado a la mejora continua.', icon: Lightbulb },
];

const positions = ['Docente de Nivel Inicial', 'Docente de Nivel Primario', 'Profesores de Nivel Secundario', 'Personal Administrativo'];

const initialForm: PostulacionEmpleo = {
  nombre_candidato: '',
  email: '',
  telefono: '',
  puesto_interes: positions[0],
  enlace_cv: '',
  mensaje: '',
};

export function EmploymentSection() {
  const [form, setForm] = useState<PostulacionEmpleo>(initialForm);
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Enviando postulación...');
    try {
      await api.crearPostulacion(form);
      setForm(initialForm);
      setStatus('Postulación recibida correctamente.');
    } catch {
      setStatus('No se pudo enviar la postulación. Verificá que el backend esté en ejecución.');
    }
  }

  return (
    <section id="empleo" className="section section-white">
      <div className="container">
        <SectionHeader
          eyebrow="Convocatoria"
          title="Trabajá con Nosotros"
          description="Estamos formando el equipo de trabajo para el ciclo lectivo 2027. Buscamos profesionales comprometidos con la excelencia educativa."
        />

        <div className="benefits-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article className="info-card" key={benefit.title}>
                <div className="card-icon subtle"><Icon size={28} /></div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>

        <div className="employment-panel">
          <div>
            <h3><BriefcaseBusiness size={26} /> Vacantes disponibles</h3>
            <div className="positions-list">
              {positions.map((position) => (
                <button type="button" key={position} onClick={() => setForm({ ...form, puesto_interes: position })}>
                  {position}
                  <span>Tiempo completo / parcial</span>
                </button>
              ))}
            </div>
          </div>

          <form className="form-card flat-form" onSubmit={handleSubmit}>
            <label>
              Nombre del candidato
              <input required value={form.nombre_candidato} onChange={(event) => setForm({ ...form, nombre_candidato: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                Email
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                Teléfono
                <input required value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
              </label>
            </div>
            <label>
              Puesto de interés
              <select required value={form.puesto_interes} onChange={(event) => setForm({ ...form, puesto_interes: event.target.value })}>
                {positions.map((position) => <option key={position}>{position}</option>)}
              </select>
            </label>
            <label>
              Enlace al CV
              <input value={form.enlace_cv} onChange={(event) => setForm({ ...form, enlace_cv: event.target.value })} placeholder="https://..." />
            </label>
            <label>
              Mensaje
              <textarea rows={4} value={form.mensaje} onChange={(event) => setForm({ ...form, mensaje: event.target.value })} />
            </label>
            <Button type="submit">Enviar postulación</Button>
            {status && <span className="form-status">{status}</span>}
          </form>
        </div>
      </div>
    </section>
  );
}
