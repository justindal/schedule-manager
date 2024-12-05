import { Navbar } from '@/components/Navigation/navbar'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}