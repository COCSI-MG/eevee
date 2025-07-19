import Layout from "@/components/user-layout/layout";

export default function ClassesLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Layout>
      { children }
    </Layout>
  )
}