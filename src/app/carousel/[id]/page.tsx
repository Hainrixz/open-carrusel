"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Grid3X3, Bookmark, BookmarkCheck, Maximize2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CarouselPreview } from "@/components/editor/CarouselPreview";
import { SlideFilmstrip } from "@/components/editor/SlideFilmstrip";
import { AspectRatioSelector } from "@/components/editor/AspectRatioSelector";
import { ExportButton } from "@/components/editor/ExportButton";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { SafeZoneOverlay } from "@/components/editor/SafeZoneOverlay";
import { FullscreenPreview } from "@/components/editor/FullscreenPreview";
import type { Carousel, AspectRatio } from "@/types/carousel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CarouselEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [claudeAvailable, setClaudeAvailable] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [saveTemplateState, setSaveTemplateState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Ref for focusing chat input when + button is clicked
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchCarousel = useCallback(async () => {
    try {
      const res = await fetch(`/api/carousels/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCarousel((prev) => {
          // If new slides were added during generation, jump to the latest slide
          if (prev && data.slides.length > prev.slides.length) {
            setActiveSlide(data.slides.length - 1);
          } else {
            setActiveSlide((prevIdx) =>
              data.slides.length === 0 ? 0 : Math.min(prevIdx, data.slides.length - 1)
            );
          }
          return data;
        });
      }
    } catch {
      // ignore network errors
    }
  }, [id]);

  // Initial data load
  useEffect(() => {
    const load = async () => {
      await fetchCarousel();
      try {
        const res = await fetch("/api/chat/check");
        const data: { available?: boolean } = await res.json();
        if (data.available === false) setClaudeAvailable(false);
      } catch {
        // assume available
      }
    };
    load();
  }, [fetchCarousel]);

  // Poll for carousel updates while AI is generating slides
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      fetchCarousel();
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating, fetchCarousel]);

  const handleAspectChange = async (ratio: AspectRatio) => {
    if (!carousel) return;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: ratio }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCarousel(updated);
    }
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!carousel) return;
    const slideIndex = carousel.slides.findIndex((s) => s.id === slideId);
    setConfirmState({
      open: true,
      title: `Delete slide ${slideIndex + 1}?`,
      description: "This action cannot be undone.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}/slides/${slideId}`, {
          method: "DELETE",
        });
        if (res.ok) await fetchCarousel();
      },
    });
  };

  const handleUndoSlide = async (slideId: string) => {
    const res = await fetch(`/api/carousels/${id}/slides/${slideId}/undo`, {
      method: "POST",
    });
    if (res.ok) await fetchCarousel();
  };

  const handleDeleteCarousel = useCallback(() => {
    if (!carousel) return;
    setConfirmState({
      open: true,
      title: `Delete "${carousel.name}"?`,
      description: "This will permanently delete the carousel and all its slides.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
        if (res.ok) router.push("/");
      },
    });
  }, [carousel, id, router]);

  const handleSaveTemplate = useCallback(async () => {
    if (!carousel || saveTemplateState === "saving") return;
    setSaveTemplateState("saving");
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: carousel.id }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setSaveTemplateState("saved");
    } catch {
      setSaveTemplateState("error");
    } finally {
      setTimeout(() => setSaveTemplateState("idle"), 2000);
    }
  }, [carousel, saveTemplateState]);

  const handleStreamStart = useCallback(() => {
    setIsGenerating(true);
  }, []);

  const handleStreamEnd = useCallback(() => {
    setIsGenerating(false);
    fetchCarousel();
  }, [fetchCarousel]);

  const handleReorderSlides = useCallback(
    async (slideIds: string[]) => {
      await fetch(`/api/carousels/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIds }),
      });
      await fetchCarousel();
    },
    [id, fetchCarousel]
  );

  const handleAddSlideRequest = useCallback(() => {
    setChatOpen(true);
    // Focus chat input after a tick (to let panel render)
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, []);

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Carousel not found</p>
        <p className="text-sm text-muted-foreground">
          This carousel may have been deleted.
        </p>
        <Link href="/" className="text-sm text-accent underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!carousel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={carousel.name}
        showBack
        editable
        onTitleChange={async (name) => {
          const res = await fetch(`/api/carousels/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (res.ok) {
            const updated = await res.json();
            setCarousel(updated);
          }
        }}
      />

      {/* Fullscreen preview */}
      <FullscreenPreview
        open={showFullscreen}
        onOpenChange={setShowFullscreen}
        slides={carousel.slides}
        aspectRatio={carousel.aspectRatio}
        activeIndex={activeSlide}
        onActiveChange={setActiveSlide}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      {/* Main editor area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Chat panel */}
        {chatOpen && (
          <div className="oc-fade w-80 border-r border-border shrink-0 flex flex-col bg-surface">
            <ChatPanel
              carouselId={id}
              claudeAvailable={claudeAvailable}
              referenceImages={carousel.referenceImages || []}
              onStreamStart={handleStreamStart}
              onStreamEnd={handleStreamEnd}
              chatInputRef={chatInputRef}
            />
          </div>
        )}

        {/* Right side: toolbar + preview */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Toolbar */}
          <div className="h-11 border-b border-border bg-surface flex items-center px-4 gap-3 shrink-0">
            <AspectRatioSelector
              value={carousel.aspectRatio}
              onChange={handleAspectChange}
            />
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullscreen(true)}
              className="text-muted-foreground"
              aria-label="Fullscreen preview"
              title="Fullscreen preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showSafeZones ? "outline" : "ghost"}
              size="sm"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={showSafeZones ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Toggle safe zones"
              title="Instagram safe zones"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={saveTemplateState === "saving"}
              className={
                saveTemplateState === "saved"
                  ? "text-accent"
                  : saveTemplateState === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
              aria-label="Save as template"
              title={
                saveTemplateState === "saved"
                  ? "Saved as template"
                  : saveTemplateState === "error"
                    ? "Failed to save — try again"
                    : "Save as template"
              }
            >
              {saveTemplateState === "saved" ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteCarousel}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete carousel"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:bg-muted"
            >
              {chatOpen ? "Hide Chat" : "Show Chat"}
            </button>
            <ExportButton
              carouselId={carousel.id}
              slideCount={carousel.slides.length}
            />
          </div>

          {/* Carousel preview */}
          <CarouselPreview
            slides={carousel.slides}
            aspectRatio={carousel.aspectRatio}
            activeIndex={activeSlide}
            onActiveChange={setActiveSlide}
            showSafeZones={showSafeZones}
          />

          {/* Caption panel */}
          <CaptionPanel
            caption={carousel.caption}
            hashtags={carousel.hashtags}
          />
        </div>
      </div>

      {/* Filmstrip */}
      <SlideFilmstrip
        slides={carousel.slides}
        aspectRatio={carousel.aspectRatio}
        activeIndex={activeSlide}
        onActiveChange={setActiveSlide}
        onDeleteSlide={handleDeleteSlide}
        onUndoSlide={handleUndoSlide}
        onAddSlideRequest={handleAddSlideRequest}
        onReorderSlides={handleReorderSlides}
        isGenerating={isGenerating}
      />
    </div>
  );
}
