import { EmployeeNavbar } from '@/components/Navigation/employee-navbar'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <EmployeeNavbar />
      <main>{children}</main>
    </div>
  )
}
