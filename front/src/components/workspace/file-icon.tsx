import { FileText } from "lucide-react";

export default function FileIcon({
  fileName,
}: {
  fileName: string;
}) {
  if (fileName.endsWith(".html"))
    return <FileText className="h-4 w-4 text-primary" />;
  if (fileName.endsWith(".css") || fileName.endsWith(".ts"))
    return <FileText className="h-4 w-4 text-primary" />;
  if (fileName.endsWith(".js"))
    return <FileText className="h-4 w-4 text-warning" />;
  return <FileText className="h-4 w-4" />;
}
