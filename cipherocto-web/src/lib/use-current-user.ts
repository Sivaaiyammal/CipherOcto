import { useAuth } from "@/data/auth-context"

/** The signed-in person, shaped for display. Falls back to a neutral label while signed out. */
export function useCurrentUser() {
  const { user } = useAuth()
  const name = user?.name ?? "Signed out"
  return {
    name,
    firstName: name.split(" ")[0] ?? name,
    email: user?.email ?? "",
    role: user?.role.label ?? "",
    avatar: "",
  }
}
