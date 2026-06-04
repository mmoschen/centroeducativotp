import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { galeriaFallback } from '../services/fallbackData';
import type { GaleriaImagen } from '../types';

export function GallerySection() {
  const [imagenes, setImagenes] = useState<GaleriaImagen[]>(galeriaFallback);

  useEffect(() => {
    api.getGaleria().then(setImagenes).catch(() => setImagenes(galeriaFallback));
  }, []);

  return (
    <section id="galeria" className="section gallery-strip">
      <div className="container gallery-strip-header">
        <span className="eyebrow">Galeria</span>
        <h2>Vida institucional proyectada</h2>
      </div>
      <div className="gallery-mosaic" aria-label="Galeria de imagenes institucionales">
        {imagenes.slice(0, 5).map((item) => (
          <img key={item.id} src={item.url_imagen} alt={item.titulo} />
        ))}
      </div>
    </section>
  );
}
