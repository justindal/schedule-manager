import { UnifiedNavbar } from '@/components/Navigation/unified-navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <UnifiedNavbar />
      <main>{children}</main>
    </div>
  )
}
