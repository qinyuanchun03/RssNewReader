import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "zh-CN": {
    translation: {
      "app": {
        "name": "N-Reader",
        "description": "AI 驱动的知识阅读平台"
      },
      "nav": {
        "home": "首页",
        "rss": "订阅源",
        "favorites": "收藏夹",
        "settings": "设置",
        "all_articles": "全部文章"
      },
      "rss": {
        "add_source": "添加订阅源",
        "feed_url": "订阅源地址",
        "category": "分类",
        "validating": "验证中...",
        "add": "添加",
        "cancel": "取消",
        "categories": "分类列表",
        "sources": "订阅源列表",
        "dialog_desc": "输入您想要订阅的 RSS 订阅源 URL。"
      },
      "article": {
        "no_articles": "暂无文章",
        "select_article": "选择一篇文章开始阅读",
        "summarize": "AI 总结",
        "summarizing": "正在总结...",
        "summary_ready": "总结已生成",
        "visit_source": "查看原文",
        "new": "新",
        "ai_summary": "AI 摘要",
        "original_text": "原生内容",
        "full_text": "智能全文",
        "extracting": "正在智能提取全文...",
        "extract_failed": "全文提取失败，显示原生内容",
        "loading": "正在加载..."
      },
      "appearance": {
        "title": "外观设置",
        "theme": "主题",
        "theme_light": "浅色",
        "theme_dark": "深色",
        "theme_system": "跟随系统",
        "primary_color": "主题色",
        "font_size": "字号",
        "reading_width": "阅读宽度",
        "font_family": "字体",
        "ai_settings_title": "AI 辅助功能",
        "enable_ai": "开启 AI 辅助",
        "enable_ai_desc": "启用 AI 智能总结和智能全文提取功能",
        "gemini_api_key": "Gemini API 密钥",
        "gemini_api_key_desc": "请输入您的 Gemini API Key。如果不启用或不填写，将执行本地普通抓取全文，不会调用任何 AI 接口。"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh-CN",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
