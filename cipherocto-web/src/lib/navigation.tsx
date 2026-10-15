import type { Permission } from "@/lib/permissions"
import {
  BanknoteIcon,
  ChartSplineIcon,
  GripIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  NetworkIcon,
  RocketIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  /** Middle breadcrumb segment, e.g. CipherOcto › Platform › Apps & Portfolio */
  group?: string
  /** Page name in the breadcrumb when it differs from the menu label */
  pageTitle?: string
  /** Needed to see this item and open the page */
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboardIcon, permission: "dashboard:read" },
  {
    title: "Apps",
    url: "/apps",
    icon: GripIcon,
    group: "Platform",
    pageTitle: "Apps & Portfolio",
    permission: "apps:read",
  },
  {
    title: "Remote Configuration",
    url: "/remote-config",
    icon: SlidersHorizontalIcon,
    group: "Platform",
    permission: "config:read",
  },
  { title: "Subscriptions", url: "/subscriptions", icon: TagIcon, group: "Platform", pageTitle: "Subscriptions & In-App Purchases", permission: "subscriptions:read" },
  { title: "Billing Setup", url: "/billing", icon: KeyRoundIcon, group: "Platform", pageTitle: "Billing SDK Setup", permission: "apps:read" },
  { title: "Privacy Policies", url: "/policies", icon: ShieldCheckIcon, group: "Platform", pageTitle: "Privacy Policy Pages", permission: "apps:read" },
  { title: "Revenue & Finance", url: "/finance", icon: BanknoteIcon, group: "Business", pageTitle: "Revenue & Finance", permission: "finance:read" },
  { title: "Analytics", url: "/analytics", icon: ChartSplineIcon, group: "Business", pageTitle: "Analytics & Product Intelligence", permission: "analytics:read" },
  { title: "Projects & Tasks", url: "/projects", icon: ListChecksIcon, group: "Workspace", pageTitle: "Projects & Tasks", permission: "projects:read" },
  { title: "Team Management", url: "/team", icon: UsersIcon, group: "Workspace", pageTitle: "Team Management & Access Control", permission: "team:read" },
  { title: "Releases", url: "/releases", icon: RocketIcon, group: "Platform", pageTitle: "Releases & Deployments", permission: "releases:read" },
  { title: "Integrations", url: "/integrations", icon: NetworkIcon, group: "Platform", pageTitle: "Integrations & API Hub", permission: "integrations:read" },
  { title: "Settings", url: "/settings", icon: SettingsIcon, group: "Workspace", permission: "settings:manage" },
]

export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.url === "/") return pathname === "/"
  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname))
}
