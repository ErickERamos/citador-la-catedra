import type { SourceType, ReliabilityScore } from "../../lib/types";

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
  reliability?: ReliabilityScore;
}

export default function PageInfo({ title, sourceType, reliability }: PageInfoProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-ui-border">
      <div className="flex items-start justify-between gap-3">
        <h2
          className="font-brand font-bold text-rich-black text-[15px] leading-tight line-clamp-2"
          title={title}
        >
          {title}
        </h2>
        
        {reliability && (
          <div 
            className="flex-shrink-0 group relative"
            title={reliability.message}
          >
            <div className={`flex items-center justify-center w-7 h-7 rounded-full border ${
              reliability.color === 'green' ? 'bg-green-100 border-green-300 text-green-700' :
              reliability.color === 'yellow' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
              'bg-red-100 border-red-300 text-red-700'
            }`}>
              <span className="text-xs font-bold font-brand">{reliability.score.toFixed(1)}</span>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-rich-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
              <div className="font-bold mb-1">
                {reliability.color === 'green' ? '🟢 Fiabilidad Alta' :
                 reliability.color === 'yellow' ? '🟡 Fiabilidad Media' :
                 '🔴 Fiabilidad Baja'}
              </div>
              {reliability.message}
            </div>
          </div>
        )}
      </div>
      <span className="inline-block mt-1.5 px-2 py-0.5 bg-action-cyan/15 text-action-cyan text-[11px] font-medium tracking-wide rounded">
        {sourceTypeLabels[sourceType]}
      </span>
    </div>
  );
}
