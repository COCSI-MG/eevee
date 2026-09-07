export function Footer() {
  return (
    <footer className="mt-auto border-t border-sidebar-border bg-sidebar">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} eevee. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
