import {
  BookOpen,
  FolderOpen,
  Home,
  Library,
  Settings,
  Sparkles,
} from 'lucide-react';

export const appNavLinks = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'My Groups', href: '/groups', icon: FolderOpen },
  { label: 'Assignments', href: '/assignments', icon: BookOpen },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Sparkles },
  { label: 'My Library', href: '/library', icon: Library },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const mobileBottomLinks = [
  appNavLinks[0],
  appNavLinks[2],
  appNavLinks[4],
  appNavLinks[3],
  appNavLinks[5],
];
