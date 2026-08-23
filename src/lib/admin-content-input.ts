import type { ContentPostStatus, ContentPostType } from "@/generated/prisma-v29/client";
import { UnifiedAdminInputError } from "@/lib/unified-admin-api";

export type StructuredTextNode = { type: "text"; text: string };
export type StructuredBlockNode = {
  type: "paragraph" | "heading";
  attrs?: { level: 2 | 3 };
  content?: StructuredTextNode[];
};
export type StructuredContent = {
  schemaVersion: 1;
  type: "doc";
  content: StructuredBlockNode[];
};

export type DisciplineInput = {
  competitionId?: string | null;
  officialMediaId?: string | null;
  versionLabel?: string | null;
  scopeLabel?: string | null;
};

export type ContentPostInput = {
  type: ContentPostType;
  slug: string;
  title: string;
  summary: string;
  content: StructuredContent;
  status: ContentPostStatus;
  source?: string | null;
  coverMediaId?: string | null;
  pinned?: boolean;
  featured?: boolean;
  discipline?: DisciplineInput | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, label: string, maximum: number, required = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new UnifiedAdminInputError(`${label}不能为空。`);
  if (text.length > maximum) {
    throw new UnifiedAdminInputError(`${label}不能超过 ${maximum} 个字符。`);
  }
  return text || null;
}

function readEnum<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) {
    throw new UnifiedAdminInputError(`${label}不正确。`);
  }
  return value as T;
}

export function validateStructuredContent(value: unknown): StructuredContent {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      throw new UnifiedAdminInputError("正文必须是有效的结构化 JSON。");
    }
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || parsed.type !== "doc") {
    throw new UnifiedAdminInputError("正文 JSON envelope 不正确。");
  }
  if (!Array.isArray(parsed.content) || parsed.content.length > 1_000) {
    throw new UnifiedAdminInputError("正文节点数量不正确或超过限制。");
  }

  const content = parsed.content.map((candidate): StructuredBlockNode => {
    if (!isRecord(candidate) || (candidate.type !== "paragraph" && candidate.type !== "heading")) {
      throw new UnifiedAdminInputError("正文包含尚未允许的节点类型。");
    }
    const attrs = candidate.type === "heading"
      ? (() => {
          if (!isRecord(candidate.attrs) || (candidate.attrs.level !== 2 && candidate.attrs.level !== 3)) {
            throw new UnifiedAdminInputError("标题节点级别不正确。");
          }
          return { level: candidate.attrs.level } as const;
        })()
      : undefined;
    if (candidate.content !== undefined && !Array.isArray(candidate.content)) {
      throw new UnifiedAdminInputError("正文文本节点格式不正确。");
    }
    const inline = (candidate.content ?? []).map((textNode): StructuredTextNode => {
      if (!isRecord(textNode) || textNode.type !== "text" || typeof textNode.text !== "string") {
        throw new UnifiedAdminInputError("正文文本节点格式不正确。");
      }
      if (!textNode.text || textNode.text.length > 10_000) {
        throw new UnifiedAdminInputError("正文单个文本节点为空或过长。");
      }
      return { type: "text", text: textNode.text };
    });
    return { type: candidate.type, ...(attrs ? { attrs } : {}), ...(inline.length ? { content: inline } : {}) };
  });

  const normalized = { schemaVersion: 1, type: "doc", content } as const;
  if (JSON.stringify(normalized).length > 100_000) {
    throw new UnifiedAdminInputError("正文不能超过 100,000 个字符。");
  }
  return normalized;
}

function readDiscipline(value: unknown): DisciplineInput | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw new UnifiedAdminInputError("纪律处罚扩展格式不正确。");
  return {
    competitionId: readText(value.competitionId, "关联赛事", 64, false),
    officialMediaId: readText(value.officialMediaId, "正式 PDF", 64, false),
    versionLabel: readText(value.versionLabel, "版本标签", 80, false),
    scopeLabel: readText(value.scopeLabel, "适用范围", 160, false),
  };
}

export function readContentPostInput(value: unknown): ContentPostInput {
  if (!isRecord(value)) throw new UnifiedAdminInputError("内容格式不正确。");
  return {
    type: readEnum(value.type, ["NEWS", "ANNOUNCEMENT", "DISCIPLINE"] as const, "内容类型"),
    slug: readText(value.slug, "Slug", 120)!,
    title: readText(value.title, "标题", 160)!,
    summary: readText(value.summary, "摘要", 500)!,
    content: validateStructuredContent(value.content),
    status: readEnum(value.status, ["DRAFT", "PUBLISHED", "ARCHIVED"] as const, "发布状态"),
    source: readText(value.source, "来源", 120, false),
    coverMediaId: readText(value.coverMediaId, "封面媒体", 64, false),
    pinned: value.pinned === true,
    featured: value.featured === true,
    discipline: readDiscipline(value.discipline),
  };
}

export function createEmptyStructuredContent(text = ""): StructuredContent {
  return {
    schemaVersion: 1,
    type: "doc",
    content: [{ type: "paragraph", ...(text ? { content: [{ type: "text", text }] } : {}) }],
  };
}
