import type { SourceType } from "../../lib/types";

const sourceTypeLabels: Record<SourceType, string> = {
  webpage: "Página web",
  article: "Artículo",
  news: "Noticia",
  blog: "Blog",
  unknown: "Fuente",
};

interface PageInfoProps {
  title: string;
  sourceType: SourceType;
}

export default function PageInfo({ title, sourceType }: PageInfoProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-ui-border">
      <h2
        className="font-brand font-bold text-rich-black text-[15px] leading-tight line-clamp-2"
        title={title}
      >
        {title}
      </h2>
      <span className="inline-block mt-1.5 px-2 py-0.5 bg-action-cyan/15 text-action-cyan text-[11px] font-medium tracking-wide rounded">
        {sourceTypeLabels[sourceType]}
      </span>
    </div>
  );
}
