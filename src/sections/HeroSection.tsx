import { ArrowRight, CalendarDays } from 'lucide-react';
import { Button } from '../components/Button';

export function HeroSection() {
  return (
    <section id="inicio" className="hero-section">
      <div className="hero-overlay" />
      <div className="container hero-content">
        <span className="hero-badge"><CalendarDays size={18} /> Apertura marzo 2027</span>
        <h1>Formando el futuro de Resistencia</h1>
        <p>Institución de gestión privada de alta calidad educativa, con una propuesta integral para nivel inicial, primario y secundario.</p>
        <div className="hero-actions">
          <a className="btn btn-secondary" href="#inscripcion">
            Solicitud de Inscripción <ArrowRight size={18} />
          </a>
          <a className="btn btn-outline-light" href="#quienes-somos">Conocer el proyecto</a>
        </div>
      </div>
    </section>
  );
}
