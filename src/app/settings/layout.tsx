import { UnifiedNavbar } from '@/components/Navigation/unified-navbar'

export default function SettingsLayout({
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
