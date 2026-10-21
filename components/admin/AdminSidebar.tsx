'use client';

import {
  LayoutDashboard,
  Briefcase,
  FileText,
  GraduationCap,
  CalendarDays,
  Building,
  CalendarClock,
  School,
  ShieldCheck,
  Hammer,
  TriangleAlert,
  Mail,
  Users,
} from 'lucide-react';
import PortalSidebar, { type NavSection } from '@/components/portal/PortalSidebar';

const sections: NavSection[] = [
  {
    label: 'Overview',
    entries: [{ name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Listings',
    entries: [
      { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
      { name: 'Trainings', href: '/admin/trainings', icon: GraduationCap },
      { name: 'Events', href: '/admin/events', icon: CalendarDays },
      { name: 'Learnerships', href: '/admin/learnerships', icon: Building },
      { name: 'Late Uni Apps', href: '/admin/late-uni', icon: CalendarClock },
    ],
  },
  {
    label: 'People',
    entries: [
      { name: 'Applications', href: '/admin/applications', icon: FileText },
      { name: 'University Interest', href: '/admin/university-applications', icon: School },
      { name: 'Candidate Verification', href: '/admin/candidate-verification', icon: ShieldCheck },
      { name: 'Invites', href: '/admin/invites', icon: Mail },
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    label: 'PieceJobs',
    entries: [
      { name: 'PieceJobs Providers', href: '/admin/service-providers', icon: Hammer },
      { name: 'Contact Violations', href: '/admin/service-violations', icon: TriangleAlert },
    ],
  },
];

export default function AdminSidebar() {
  return <PortalSidebar portal="admin" label="Admin" homeHref="/admin/dashboard" sections={sections} />;
}
