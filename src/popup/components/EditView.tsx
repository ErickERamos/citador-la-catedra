import { useState } from "react";
import type { PageMetadata } from "../../lib/types";

interface EditViewProps {
  metadata: PageMetadata;
  onSave: (updated: PageMetadata) => void;
}

export default function EditView({ metadata, onSave }: EditViewProps) {
  const [title, setTitle] = useState(metadata.title);
  const [authors, setAuthors] = useState(
    metadata.authors.map((a) => a.name).join("; ")
  );
  const [datePublished, setDatePublished] = useState(
    metadata.datePublished || ""
  );
  const [siteName, setSiteName] = useState(metadata.siteName || "");
  const [url, setUrl] = useState(metadata.url);

  const handleSave = () => {
    const parsedAuthors = authors
      .split(";")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        type: metadata.authors.find((ma) => ma.name === name)?.type || ("person" as const),
      }));

    onSave({
      ...metadata,
      title: title.trim(),
      authors: parsedAuthors,
      datePublished: datePublished.trim() || null,
      siteName: siteName.trim() || null,
      url: url.trim(),
    });
  };

  const inputClass =
    "w-full px-3 py-2 text-[13px] bg-white border border-ui-border rounded-md text-rich-black focus:outline-none focus:border-action-cyan focus:ring-1 focus:ring-action-cyan/30 transition-colors";
  const labelClass = "text-ui text-[10px] text-charcoal/60 mb-1 block";

  return (
    <div className="p-4 space-y-4">
      <p className="text-[11px] text-charcoal/50 font-body">
        Corrige los datos extraídos si es necesario. Los cambios se reflejarán
        en la cita generada.
      </p>

      <div>
        <label className={labelClass}>Autor(es)</label>
        <input
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Separar con punto y coma (;)"
          className={inputClass}
        />
        <p className="text-[10px] text-charcoal/40 mt-0.5">
          Separar múltiples autores con punto y coma (;)
        </p>
      </div>

      <div>
        <label className={labelClass}>Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Fecha de publicación</label>
        <input
          type="text"
          value={datePublished}
          onChange={(e) => setDatePublished(e.target.value)}
          placeholder="Ej: 2024-03-15 o marzo 2024"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Nombre del sitio</label>
        <input
          type="text"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-primary-blue text-white font-ui font-semibold text-xs uppercase tracking-wider rounded-md hover:bg-primary-blue/90 active:bg-primary-blue transition-colors cursor-pointer"
      >
        Guardar y ver cita
      </button>
    </div>
  );
}
