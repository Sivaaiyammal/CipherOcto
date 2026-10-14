import * as React from "react"

import { CipherOctoLogo } from "@/components/cipherocto-logo"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
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
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@cipherocto.com",
    avatar: "",
  },
  navMain: [
    { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
    { title: "Apps", url: "/apps", icon: <GripIcon /> },
    {
      title: "Remote Configuration",
      url: "/remote-config",
      icon: <SlidersHorizontalIcon />,
    },
    { title: "Subscriptions", url: "/subscriptions", icon: <TagIcon /> },
    { title: "Revenue & Finance", url: "/finance", icon: <BanknoteIcon /> },
    { title: "Analytics", url: "/analytics", icon: <ChartSplineIcon /> },
    { title: "Projects & Tasks", url: "/projects", icon: <ListChecksIcon /> },
    { title: "Team Management", url: "/team", icon: <UsersIcon /> },
    { title: "Releases", url: "/releases", icon: <RocketIcon /> },
    { title: "Integrations", url: "/integrations", icon: <NetworkIcon /> },
    { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeTitle, setActiveTitle] = React.useState("Dashboard")
  const { state, setOpen } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden px-2 pt-5 pb-4">
        <a
          href="/"
          title={collapsed ? "Expand sidebar" : undefined}
          onClick={(event) => {
            // When collapsed, the logo is the way back to the full sidebar
            if (collapsed) {
              event.preventDefault()
              setOpen(true)
            }
          }}
          className="flex items-center gap-3"
        >
          <CipherOctoLogo />
          <span className="text-[22px] leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-white transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            CipherOcto
          </span>
          <span className="ml-auto rounded-full bg-mint-border px-2.5 py-0.5 text-[11px] leading-4 font-bold tracking-[0.04em] text-mint transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            PRO
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          activeTitle={activeTitle}
          onSelect={setActiveTitle}
        />
      </SidebarContent>
      <SidebarFooter className="px-1">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
