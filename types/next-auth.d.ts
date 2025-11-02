import "next-auth"
import { UserRole } from "./models"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: UserRole
  }
}
