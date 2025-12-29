import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CalendarCheck,
  Sparkles,
  Users,
  Settings,
  LogOut,
  Plus,
  Wallet,
  PiggyBank,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Lançamentos", path: "/lancamentos", icon: FileText },
  { label: "Contas", path: "/contas", icon: CalendarCheck },
  { label: "Chat IA", path: "/chat-ia", icon: Sparkles },
  { label: "Pessoas", path: "/pessoas", icon: Users },
];

const financeNavItems = [
  { label: "Orçamentos", path: "/orcamentos", icon: Wallet },
  { label: "Metas de Economia", path: "/metas", icon: Target },
];

const configNavItems = [
  { label: "Configurações", path: "/config", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-pink group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
            <PiggyBank className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-xl font-bold text-foreground">
              CasalFin
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* New Transaction Button */}
        <div className="px-3 py-2">
          <Link to="/novo">
            <Button className="w-full gap-2 shadow-pink" size={collapsed ? "icon" : "default"}>
              <Plus className="w-4 h-4" />
              {!collapsed && "Novo Lançamento"}
            </Button>
          </Link>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3",
                        isActive(item.path) && "text-primary"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Finanças</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3",
                        isActive(item.path) && "text-primary"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Config Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3",
                        isActive(item.path) && "text-primary"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
