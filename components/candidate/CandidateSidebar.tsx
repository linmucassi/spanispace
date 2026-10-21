'use client';

import {
  LayoutDashboard,
  User,
  FileText,
  BookOpen,
  Sparkles,
  MessageSquare,
  Zap,
  Mail,
  Calendar,
  Wrench,
  Search,
  Briefcase,
  Inbox,
} from 'lucide-react';
import PortalSidebar, { type NavSection } from '@/components/portal/PortalSidebar';

// Related pages share a collapsible group (Linda, 20 Oct 2026). A group opens
// by itself when you're on one of its pages. Order is Linda's; the section
// labels were added with the soft-UI redesign (21 Oct 2026).
const sections: NavSection[] = [
  {
    label: 'Menu',
    entries: [
      { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/candidate/calendar', icon: Calendar, isNew: true },
      { name: 'My Profile', href: '/candidate/profile', icon: User },
      // Studies, not job search, so it stays top-level (Linda, 20 Oct 2026).
      { name: 'Enrollments', href: '/candidate/enrollments', icon: BookOpen },
    ],
  },
  {
    label: 'Workspace',
    entries: [
      {
        group: 'Job search',
        icon: Briefcase,
        items: [
          { name: 'Applications', href: '/candidate/applications', icon: FileText },
          { name: 'Auto-Apply', href: '/candidate/auto-apply', icon: Zap, isNew: true },
          { name: 'AI CV Audit', href: '/candidate/cv-audit', icon: Sparkles, isNew: true },
        ],
      },
      {
        group: 'Inbox',
        icon: Inbox,
        items: [
          { name: 'Messages', href: '/candidate/messages', icon: MessageSquare },
          { name: 'Invitations', href: '/candidate/invites', icon: Mail, isNew: true },
        ],
      },
      {
        group: 'PieceJobs',
        icon: Wrench,
        items: [
          // Includes the provider inbox and enrolment.
          { name: 'My PieceJobs', href: '/candidate/piecejobs', icon: Wrench, isNew: true, exclude: ['/candidate/piecejobs/hire'] },
          { name: 'Hire for PieceJobs', href: '/candidate/piecejobs/hire', icon: Search, isNew: true },
        ],
      },
    ],
  },
];

export default function CandidateSidebar() {
  return <PortalSidebar portal="candidate" label="Candidate" homeHref="/candidate/dashboard" sections={sections} />;
}
