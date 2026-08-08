"use client"

import { AuthForm } from "../_components/auth/AuthForm"
import { AuthHeader } from "../_components/auth/AuthHeader"

export default function Page() {

  return (
    <>
      <AuthHeader />
      <AuthForm
        mode="login"
      />
    </>
  )
}