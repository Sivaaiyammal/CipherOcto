import {
  BanknoteIcon,
  ChartSplineIcon,
  GripIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
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
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboardIcon },
  {
    title: "Apps",
    url: "/apps",
    icon: GripIcon,
    group: "Platform",
    pageTitle: "Apps & Portfolio",
  },
  {
    title: "Remote Configuration",
    url: "/remote-config",
    icon: SlidersHorizontalIcon,
    group: "Platform",
  },
  { title: "Subscriptions", url: "/subscriptions", icon: TagIcon, group: "Platform", pageTitle: "Subscriptions & In-App Purchases" },
  { title: "Revenue & Finance", url: "/finance", icon: BanknoteIcon, group: "Business", pageTitle: "Revenue & Finance" },
  { title: "Analytics", url: "/analytics", icon: ChartSplineIcon, group: "Business", pageTitle: "Analytics & Product Intelligence" },
  { title: "Projects & Tasks", url: "/projects", icon: ListChecksIcon, group: "Workspace", pageTitle: "Projects & Tasks" },
  { title: "Team Management", url: "/team", icon: UsersIcon, group: "Workspace", pageTitle: "Team Management & Access Control" },
  { title: "Releases", url: "/releases", icon: RocketIcon, group: "Platform", pageTitle: "Releases & Deployments" },
  { title: "Integrations", url: "/integrations", icon: NetworkIcon, group: "Platform" },
  { title: "Settings", url: "/settings", icon: SettingsIcon, group: "Workspace" },
]

export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.url === "/") return pathname === "/"
  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname))
}
