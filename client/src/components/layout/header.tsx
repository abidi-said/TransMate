import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm z-10">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
              </svg>
              <h1 className="text-xl font-bold text-slate-800 ml-2">Transmate</h1>
            </div>
          </Link>
          <div className="hidden md:block">
            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">v1.0.0</Badge>
          </div>
        </div>

        {/* Search */}
        <div className={`${searchOpen ? 'flex' : 'hidden'} md:flex md:w-1/3`}>
          <div className="relative w-full">
            <Input 
              type="text" 
              className="pl-10"
              placeholder="Search translations, keys, projects..."
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1 md:space-x-3">
          <button 
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5 text-slate-600" />
          </button>
          
          <button className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-primary rounded-full text-xs text-white flex items-center justify-center">2</span>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.username}`} alt={user?.username} />
                <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : user?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden md:block ml-2 text-sm font-medium text-slate-700">{user?.fullName || user?.username}</span>
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings">Your Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">API Keys</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
