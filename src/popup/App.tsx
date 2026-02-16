import { useEffect, useState, useCallback } from "react";
import type {
  PageMetadata,
  AuthorDisplayMode,
  CitationResult,
} from "../lib/types";
import { CitationGenerator } from "../lib/citation-generator";
import Header from "./components/Header";
import PageInfo from "./components/PageInfo";
import TabSwitcher from "./components/TabSwitcher";
import CiteView from "./components/CiteView";
import EditView from "./components/EditView";

type Tab = "citar" | "editar";
type Status = "loading" | "success" | "error";

export default function App() {
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [citation, setCitation] = useState<CitationResult | null>(null);
  const [authorMode, setAuthorMode] = useState<AuthorDisplayMode>("person");
  const [activeTab, setActiveTab] = useState<Tab>("citar");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Load saved author mode preference
  useEffect(() => {
    chrome.storage.local.get("authorMode", (result) => {
      if (result.authorMode) {
        setAuthorMode(result.authorMode as AuthorDisplayMode);
      }
    });
  }, []);

  // Extract metadata on mount
  useEffect(() => {
    setStatus("loading");
    chrome.runtime.sendMessage(
      { action: "extract-metadata" },
      (response) => {
        if (chrome.runtime.lastError) {
          setStatus("error");
          setErrorMsg(
            chrome.runtime.lastError.message ||
              "Error de comunicación con la extensión."
          );
          return;
        }
        if (response?.success && response.data) {
          setMetadata(response.data);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(
            response?.error || "No se pudieron extraer los metadatos."
          );
        }
      }
    );
  }, []);

  // Re-generate citation whenever metadata or author mode changes
  const regenerateCitation = useCallback(() => {
    if (metadata) {
      const result = CitationGenerator.generate(metadata, authorMode);
      setCitation(result);
    }
  }, [metadata, authorMode]);

  useEffect(() => {
    regenerateCitation();
  }, [regenerateCitation]);

  // Handle author mode toggle
  const handleAuthorModeChange = (mode: AuthorDisplayMode) => {
    setAuthorMode(mode);
    chrome.storage.local.set({ authorMode: mode });
  };

  // Handle metadata edit save
  const handleSaveEdit = (updated: PageMetadata) => {
    setMetadata(updated);
    setActiveTab("citar");
  };

  return (
    <div className="flex flex-col min-h-[300px]">
      <Header />

      {status === "loading" && <LoadingSkeleton />}

      {status === "error" && <ErrorState message={errorMsg} />}

      {status === "success" && metadata && (
        <>
          <PageInfo title={metadata.title} sourceType={metadata.sourceType} />

          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 overflow-y-auto">
            {activeTab === "citar" && citation && (
              <CiteView
                citation={citation}
                authorMode={authorMode}
                onAuthorModeChange={handleAuthorModeChange}
              />
            )}

            {activeTab === "editar" && (
              <EditView metadata={metadata} onSave={handleSaveEdit} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="h-5 bg-ui-border rounded animate-pulse w-3/4" />
      <div className="h-3 bg-ui-border rounded animate-pulse w-1/3" />
      <div className="mt-6 space-y-3">
        <div className="h-4 bg-ui-border rounded animate-pulse" />
        <div className="h-4 bg-ui-border rounded animate-pulse w-5/6" />
        <div className="h-4 bg-ui-border rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[200px] text-center">
      <div className="w-12 h-12 rounded-full bg-accent-orange/15 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-accent-orange"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="font-brand font-bold text-charcoal text-sm mb-1">
        No se pudo generar la cita
      </p>
      <p className="text-xs text-charcoal/70 max-w-[280px]">{message}</p>
    </div>
  );
}
