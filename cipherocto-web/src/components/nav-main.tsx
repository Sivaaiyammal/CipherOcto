import { Link, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { isNavItemActive, type NavItem } from "@/lib/navigation"

export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup className="px-1">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1.5">
          {items.map((item) => {
            const isActive = isNavItemActive(item, pathname)
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip={item.title}
                  isActive={isActive}
                  className="gap-3 rounded-[10px] px-3.5 text-[15px] font-semibold text-sidebar-foreground/85 [&_svg]:size-5! data-[active=true]:bg-sidebar-primary! data-[active=true]:text-sidebar-primary-foreground!"
                >
                  <Link to={item.url} aria-current={isActive ? "page" : undefined}>
                    <Icon />
                    <span className="whitespace-nowrap transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                      {item.title}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="ml-auto size-1.5 shrink-0 rounded-full bg-mint-border transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0"
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
