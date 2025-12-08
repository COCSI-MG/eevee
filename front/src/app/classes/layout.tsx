import Layout from '@/layouts/user/layout';

export default function ClassesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Layout>{children}</Layout>;
}
