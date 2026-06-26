import { useSettings } from "@/src/context/SettingsContext.tsx";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Sun, Moon, Monitor, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const PRIMARY_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Gray", value: "#64748b" },
];

interface AppearanceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppearanceSettings({ isOpen, onClose }: AppearanceSettingsProps) {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("appearance.title")}</DialogTitle>
          <DialogDescription>
            定制您的阅读体验。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-2">
            <Label>{t("appearance.theme")}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.theme === "light" ? "default" : "outline"}
                className="flex-col gap-2 h-auto py-3"
                onClick={() => updateSettings({ theme: "light" })}
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs">{t("appearance.theme_light")}</span>
              </Button>
              <Button
                variant={settings.theme === "dark" ? "default" : "outline"}
                className="flex-col gap-2 h-auto py-3"
                onClick={() => updateSettings({ theme: "dark" })}
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs">{t("appearance.theme_dark")}</span>
              </Button>
              <Button
                variant={settings.theme === "system" ? "default" : "outline"}
                className="flex-col gap-2 h-auto py-3"
                onClick={() => updateSettings({ theme: "system" })}
              >
                <Monitor className="h-4 w-4" />
                <span className="text-xs">{t("appearance.theme_system")}</span>
              </Button>
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label>{t("appearance.primary_color")}</Label>
            <div className="flex flex-wrap gap-3">
              {PRIMARY_COLORS.map(color => (
                <button
                  key={color.value}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    settings.primaryColor === color.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => updateSettings({ primaryColor: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>{t("appearance.font_size")}</Label>
              <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
            </div>
            <Slider
              defaultValue={[settings.fontSize]}
              min={12}
              max={24}
              step={1}
              onValueChange={(vals) => updateSettings({ fontSize: vals[0] })}
            />
          </div>

          {/* Reading Width */}
          <div className="space-y-2">
            <Label>{t("appearance.reading_width")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["narrow", "normal", "wide", "full"] as const).map(width => (
                <Button
                  key={width}
                  variant={settings.readingWidth === width ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings({ readingWidth: width })}
                  className="capitalize text-xs"
                >
                  {width}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Settings Section */}
          <Separator />
          <div className="space-y-4 pt-1">
            <h3 className="text-sm font-medium tracking-tight text-foreground">{t("appearance.ai_settings_title")}</h3>
            
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="ai-toggle" className="text-sm font-medium">{t("appearance.enable_ai")}</Label>
                <p className="text-[11px] leading-normal text-muted-foreground">{t("appearance.enable_ai_desc")}</p>
              </div>
              <Switch
                id="ai-toggle"
                checked={settings.enableAi}
                onCheckedChange={(checked) => updateSettings({ enableAi: checked })}
              />
            </div>

            {settings.enableAi && (
              <div className="space-y-4 pt-1 transition-all duration-300">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">AI 模型提供商 / Provider</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      variant={settings.aiProvider === "gemini" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "gemini" })}
                      className="text-[10px] h-8 px-1"
                    >
                      Gemini
                    </Button>
                    <Button
                      variant={settings.aiProvider === "openai" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "openai" })}
                      className="text-[10px] h-8 px-1"
                    >
                      OpenAI
                    </Button>
                    <Button
                      variant={settings.aiProvider === "anthropic" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "anthropic" })}
                      className="text-[10px] h-8 px-1"
                    >
                      Anthropic
                    </Button>
                    <Button
                      variant={settings.aiProvider === "openrouter" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "openrouter" })}
                      className="text-[10px] h-8 px-1"
                    >
                      OpenRouter
                    </Button>
                    <Button
                      variant={settings.aiProvider === "zenmux" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "zenmux" })}
                      className="text-[10px] h-8 px-1"
                    >
                      Zenmux
                    </Button>
                    <Button
                      variant={settings.aiProvider === "custom" ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSettings({ aiProvider: "custom" })}
                      className="text-[10px] h-8 px-1"
                    >
                      自定义 / Custom
                    </Button>
                  </div>
                </div>

                {settings.aiProvider === "gemini" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="api-key" className="text-xs font-semibold">{t("appearance.gemini_api_key")}</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={settings.geminiApiKey || ""}
                        onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                        placeholder="AIzaSy..."
                        className="font-mono text-xs h-9"
                      />
                    </div>
                    
                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🔑 获取 Gemini API 密钥
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                        访问 Google AI Studio 创建您的专属 API 密钥，可享受免费或付费层级的高速访问。
                      </p>
                      <a
                        href="https://aistudio.google.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2 h-6 rounded border border-primary/20 transition-colors"
                      >
                        去申请 Gemini API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {settings.aiProvider === "openai" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="openai-key" className="text-xs font-semibold">OpenAI API 密钥 (API Key)</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        value={settings.openaiApiKey || ""}
                        onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                        placeholder="sk-..."
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="openai-model" className="text-xs font-semibold">模型名称 (Model)</Label>
                      <Input
                        id="openai-model"
                        type="text"
                        value={settings.openaiModel || ""}
                        onChange={(e) => updateSettings({ openaiModel: e.target.value })}
                        placeholder="gpt-4o-mini"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🔑 获取 OpenAI API 密钥
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                        登录 OpenAI 开发者平台，在 API keys 页面中创建您的密钥。需确保账户余额充足。
                      </p>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2 h-6 rounded border border-primary/20 transition-colors"
                      >
                        去申请 OpenAI API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {settings.aiProvider === "anthropic" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="anthropic-key" className="text-xs font-semibold">Anthropic API 密钥 (API Key)</Label>
                      <Input
                        id="anthropic-key"
                        type="password"
                        value={settings.anthropicApiKey || ""}
                        onChange={(e) => updateSettings({ anthropicApiKey: e.target.value })}
                        placeholder="sk-ant-..."
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="anthropic-model" className="text-xs font-semibold">模型名称 (Model)</Label>
                      <Input
                        id="anthropic-model"
                        type="text"
                        value={settings.anthropicModel || ""}
                        onChange={(e) => updateSettings({ anthropicModel: e.target.value })}
                        placeholder="claude-3-5-sonnet-latest"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🔑 获取 Anthropic API 密钥
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                        登录 Anthropic Console 开发者后台，创建或获取您的 Claude 专属 API 密钥。
                      </p>
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2 h-6 rounded border border-primary/20 transition-colors"
                      >
                        去申请 Anthropic API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {settings.aiProvider === "openrouter" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="openrouter-key" className="text-xs font-semibold">OpenRouter API 密钥 (API Key)</Label>
                      <Input
                        id="openrouter-key"
                        type="password"
                        value={settings.openrouterApiKey || ""}
                        onChange={(e) => updateSettings({ openrouterApiKey: e.target.value })}
                        placeholder="sk-or-..."
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="openrouter-model" className="text-xs font-semibold">模型名称 (Model)</Label>
                      <Input
                        id="openrouter-model"
                        type="text"
                        value={settings.openrouterModel || ""}
                        onChange={(e) => updateSettings({ openrouterModel: e.target.value })}
                        placeholder="google/gemini-2.5-flash"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🔑 获取 OpenRouter API 密钥
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                        OpenRouter 聚合了全球主流 AI 模型（如 DeepSeek、Gemini、Llama 等），创建密钥后即可一键调用。
                      </p>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2 h-6 rounded border border-primary/20 transition-colors"
                      >
                        去申请 OpenRouter API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {settings.aiProvider === "zenmux" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="zenmux-key" className="text-xs font-semibold">Zenmux API 密钥 (API Key)</Label>
                      <Input
                        id="zenmux-key"
                        type="password"
                        value={settings.zenmuxApiKey || ""}
                        onChange={(e) => updateSettings({ zenmuxApiKey: e.target.value })}
                        placeholder="zm-..."
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="zenmux-model" className="text-xs font-semibold">模型名称 (Model)</Label>
                      <Input
                        id="zenmux-model"
                        type="text"
                        value={settings.zenmuxModel || ""}
                        onChange={(e) => updateSettings({ zenmuxModel: e.target.value })}
                        placeholder="deepseek-chat"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🔑 获取 Zenmux API 密钥
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                        Zenmux 提供了高速、高性价比且稳定的 API 模型接入。登录 Zenmux 平台即可轻松创建 and 管理您的 API 密钥。
                      </p>
                      <a
                        href="https://zenmux.ai/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium bg-primary/5 hover:bg-primary/10 px-2 h-6 rounded border border-primary/20 transition-colors"
                      >
                        去申请 Zenmux API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {settings.aiProvider === "custom" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="custom-key" className="text-xs font-semibold">API 密钥 (API Key)</Label>
                      <Input
                        id="custom-key"
                        type="password"
                        value={settings.customApiKey || ""}
                        onChange={(e) => updateSettings({ customApiKey: e.target.value })}
                        placeholder="sk-..."
                        className="font-mono text-xs h-9"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="custom-base" className="text-xs font-semibold">自定义接口代理地址 (Base URL)</Label>
                      <Input
                        id="custom-base"
                        type="text"
                        value={settings.customBaseUrl || ""}
                        onChange={(e) => updateSettings({ customBaseUrl: e.target.value })}
                        placeholder="https://api.openai.com/v1"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="custom-model" className="text-xs font-semibold">模型名称 (Model)</Label>
                      <Input
                        id="custom-model"
                        type="text"
                        value={settings.customModel || ""}
                        onChange={(e) => updateSettings({ customModel: e.target.value })}
                        placeholder="gpt-4o-mini"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5 border border-dashed border-muted/80">
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1 text-foreground/90">
                        🌐 自定义 OpenAI 兼容接口
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        支持任意 OpenAI 格式兼容的自定义 API 代理。您可以在上方自由填写接口地址与对应的模型名称（例如 DeepSeek、Local LLM 或其他中转服务）。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
