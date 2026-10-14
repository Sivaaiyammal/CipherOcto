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
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = isNavItemActive(item, pathname)
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.title}>
                {/* 15px side padding keeps the 18px icon centred in the 64px collapsed rail */}
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="h-9 gap-2 rounded-lg px-[15px] text-[13px] font-semibold tracking-[0.01em] text-sidebar-foreground transition-colors hover:bg-neutral-strong hover:text-foreground [&_svg]:size-[18px]! data-[active=true]:bg-sidebar-primary! data-[active=true]:text-sidebar-primary-foreground! data-[active=true]:shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                >
                  <Link to={item.url} aria-current={isActive ? "page" : undefined}>
                    <Icon />
                    <span className="flex-1 whitespace-nowrap transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                      {item.title}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-mint-border transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0"
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
