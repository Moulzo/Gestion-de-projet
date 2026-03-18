import { SignUp } from '@clerk/nextjs'
import AuthWrapper from '@/app/components/AuthWrapper'

export default function Page() {
  return (
    <AuthWrapper>
      <SignUp />
    </AuthWrapper>
  )
}