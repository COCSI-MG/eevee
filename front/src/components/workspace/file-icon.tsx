import { FileText } from "lucide-react";

export default function FileIcon({
  fileName,
}: {
  fileName: string;
}) {
  if (fileName.endsWith(".html"))
    return <FileText className="h-4 w-4 text-orange-400" />;
  if (fileName.endsWith(".css") || fileName.endsWith(".ts"))
    return <FileText className="h-4 w-4 text-blue-400" />;
  if (fileName.endsWith(".js"))
    return <FileText className="h-4 w-4 text-yellow-400" />;
  return <FileText className="h-4 w-4" />;
}
