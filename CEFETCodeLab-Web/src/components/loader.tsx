import { Circle } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-full">
      <svg
        className="animate-spin h-8 w-8 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <Circle className="h-8 w-8 text-gray-500" />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
