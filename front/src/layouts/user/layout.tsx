import { Footer } from "./footer"
import { Header } from "./header"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({
  children
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{ children }</main>
      <Footer />
    </div>
  )
}