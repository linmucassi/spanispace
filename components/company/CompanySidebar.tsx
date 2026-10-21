'use client';

import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  UserPlus,
  Building2,
  Calendar,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Send,
} from 'lucide-react';
import PortalSidebar, { type NavSection } from '@/components/portal/PortalSidebar';

const sections: NavSection[] = [
  {
    label: 'Menu',
    entries: [
      { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/company/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Hiring',
    entries: [
      { name: 'My Jobs', href: '/company/jobs', icon: Briefcase },
      { name: 'Applications', href: '/company/applications', icon: FileText },
      { name: 'Find Candidates', href: '/company/candidates', icon: UserPlus },
      { name: 'Sent Invites', href: '/company/invites', icon: Send },
      { name: 'Messages', href: '/company/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Company',
    entries: [
      { name: 'My Events', href: '/company/events', icon: CalendarDays },
      { name: 'My Training', href: '/company/training', icon: GraduationCap },
      { name: 'Team', href: '/company/team', icon: Users },
      { name: 'Company Profile', href: '/company/profile', icon: Building2 },
    ],
  },
];

export default function CompanySidebar() {
  return <PortalSidebar portal="company" label="Company" homeHref="/company/dashboard" sections={sections} />;
}
