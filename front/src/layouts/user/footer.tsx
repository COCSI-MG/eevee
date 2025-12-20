export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} eevee. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
