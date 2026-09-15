import { createElement, type JSX } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

const BLOCK = "mb-3 last:mb-0";
const HEADING = "font-semibold text-foreground first:mt-0";
const LIST = `list-outside pl-5 space-y-1 text-foreground ${BLOCK}`;
const MONO = "font-mono text-xs text-foreground bg-muted";

function styled<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  base: string,
  defaults?: JSX.IntrinsicElements[T],
) {
  return function StyledMarkdownElement({
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    node,
    ...props
  }: JSX.IntrinsicElements[T] & { node?: unknown }) {
    return createElement(tag, {
      ...defaults,
      ...props,
      className: cn(base, className),
    });
  };
}

const components: Components = {
  h1: styled("h1", `text-lg mt-4 mb-2 ${HEADING}`),
  h2: styled("h2", `text-base mt-4 mb-2 ${HEADING}`),
  h3: styled("h3", `text-sm mt-3 mb-1 ${HEADING}`),
  p: styled("p", `text-foreground leading-relaxed ${BLOCK}`),
  ul: styled("ul", `list-disc ${LIST}`),
  ol: styled("ol", `list-decimal ${LIST}`),
  li: styled("li", "leading-relaxed"),
  a: styled("a", "text-primary underline underline-offset-2 hover:opacity-80", {
    target: "_blank",
    rel: "noopener noreferrer",
  }),
  code: styled("code", `rounded px-1 py-0.5 ${MONO}`),
  pre: styled("pre", `rounded-md p-3 overflow-x-auto ${MONO} ${BLOCK}`),
  blockquote: styled(
    "blockquote",
    `border-l-2 border-border pl-3 italic text-muted-foreground ${BLOCK}`,
  ),
  strong: styled("strong", "font-semibold text-foreground"),
  hr: styled("hr", "border-border my-4"),
};

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("text-sm", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
