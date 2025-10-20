import Layout from "@/layouts/user/layout";

export default function AssignmentAttemptsPageLayout({
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