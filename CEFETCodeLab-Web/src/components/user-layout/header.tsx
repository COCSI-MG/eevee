import Link from "next/link"
import { Code2 } from "lucide-react"
import { Route } from "@/app/routes"

export function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href='/classes' className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
            <Code2 className="h-8 w-8" />
            <span className="text-2xl font-bold">EEVEE</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href={`/${Route.Classes}`} className="text-slate-300 hover:text-white transition-colors">
              Classes
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
