import { createElement, type JSX } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
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

const Table = styled(
  "table",
  "w-full border-collapse text-left text-foreground [overflow-wrap:normal]"
);

const components: Components = {
  h1: styled("h1", `text-lg mt-4 mb-2 ${HEADING}`),
  h2: styled("h2", `text-base mt-4 mb-2 ${HEADING}`),
  h3: styled("h3", `text-sm mt-3 mb-1 ${HEADING}`),
  p: styled("p", `text-foreground leading-relaxed ${BLOCK}`),
  ul: styled(
    "ul",
    `list-disc ${LIST} [&.contains-task-list]:list-none [&.contains-task-list]:pl-0`
  ),
  ol: styled("ol", `list-decimal ${LIST}`),
  li: styled("li", "leading-relaxed"),
  a: styled("a", "text-primary underline underline-offset-2 hover:opacity-80", {
    target: "_blank",
    rel: "noopener noreferrer",
  }),
  code: styled("code", `rounded px-1 py-0.5 ${MONO}`),
  pre: styled(
    "pre",
    `rounded-md p-3 overflow-x-auto ${MONO} ${BLOCK} [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0`,
  ),
  table: function MarkdownTable(props) {
    return (
      <div className={`min-w-0 w-full max-w-full overflow-x-auto ${BLOCK}`}>
        <Table {...props} />
      </div>
    );
  },
  th: styled(
    "th",
    "border border-border bg-muted px-3 py-2 align-top font-semibold"
  ),
  td: styled(
    "td", 
    "border border-border px-3 py-2 align-top"
  ),
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
    <div className={cn("min-w-0 max-w-full text-sm [overflow-wrap:anywhere]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
