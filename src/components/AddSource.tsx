import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { RSSSource } from "@/src/types.ts";

interface AddSourceProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (source: RSSSource) => void;
}

export function AddSource({ isOpen, onClose, onAdd }: AddSourceProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    try {
      // Fetch source info from backend
      const response = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        const newSource: RSSSource = {
          id: crypto.randomUUID(),
          title: data.title || "Untitled Feed",
          url: url,
          category: category,
          description: data.description,
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        onAdd(newSource);
        setUrl("");
        setError(null);
        onClose();
      } else {
        setError(data.error || "Failed to add feed");
      }
    } catch (err) {
      console.error("Add source error:", err);
      setError("Failed to fetch RSS. Please verify the URL or try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("rss.add_source")}</DialogTitle>
            <DialogDescription>
              {t("rss.dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-2.5 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 leading-normal">
                ⚠️ {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="url">{t("rss.feed_url")}</Label>
              <Input
                id="url"
                placeholder="https://example.com/rss"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{t("rss.category")}</Label>
              <Input
                id="category"
                placeholder="e.g. Technology, News"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("rss.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("rss.validating") : t("rss.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
