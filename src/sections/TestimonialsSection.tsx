import { MessageSquareQuote, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { opinionesFallback } from '../services/fallbackData';
import type { Opinion } from '../types';

export function TestimonialsSection() {
  const [opiniones, setOpiniones] = useState<Opinion[]>(opinionesFallback);
  const [form, setForm] = useState({ autor_anonimo: '', comentario: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.getOpiniones().then(setOpiniones).catch(() => setOpiniones(opinionesFallback));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Enviando opinión...');
    try {
      const nuevaOpinion = await api.crearOpinion(form);
      setOpiniones((items) => [nuevaOpinion, ...items]);
      setForm({ autor_anonimo: '', comentario: '' });
      setStatus('Gracias. Tu opinión quedó registrada.');
    } catch {
      setStatus('No se pudo enviar la opinión. Verificá que el backend esté en ejecución.');
    }
  }

  return (
    <section id="opiniones" className="section section-white">
      <div className="container testimonials-layout">
        <div>
          <SectionHeader
            title="Lo que dicen de nosotros"
            description="Opiniones de ejemplo para mostrar cómo se verá la participación de la comunidad educativa."
          />
          <div className="testimonial-list">
            {opiniones.slice(0, 3).map((opinion) => (
              <article className="testimonial-card" key={opinion.id}>
                <MessageSquareQuote size={34} />
                <p>“{opinion.comentario}”</p>
                <strong>{opinion.autor_anonimo}</strong>
              </article>
            ))}
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h3>Compartí tu experiencia</h3>
          <p>No requiere iniciar sesión para comentar.</p>
          <label>
            Nombre o referencia
            <input
              required
              value={form.autor_anonimo}
              onChange={(event) => setForm({ ...form, autor_anonimo: event.target.value })}
              placeholder="Ej.: Madre de familia"
            />
          </label>
          <label>
            Opinión
            <textarea
              required
              rows={5}
              value={form.comentario}
              onChange={(event) => setForm({ ...form, comentario: event.target.value })}
              placeholder="Escribí un comentario breve"
            />
          </label>
          <Button type="submit"><Send size={18} /> Enviar opinión</Button>
          {status && <span className="form-status">{status}</span>}
        </form>
      </div>
    </section>
  );
}
