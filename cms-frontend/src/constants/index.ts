import { MdDashboard } from 'react-icons/md';
import { PiCowFill } from 'react-icons/pi';
import { PiMapPinAreaFill } from 'react-icons/pi';
import { LuFence } from 'react-icons/lu';
import { MdPeople } from 'react-icons/md';
import { IoMdSettings } from 'react-icons/io';
import { GrConfigure } from 'react-icons/gr';

import { MdAccountCircle } from 'react-icons/md';
import { IoIosNotifications } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';

export const menuLinks = [
  { label: 'Dashboard', href: '/dashboard', symbol: MdDashboard },
  { label: 'Livestock', href: '/livestock', symbol: PiCowFill },
  { label: 'Map', href: '/map', symbol: PiMapPinAreaFill },
  { label: 'GeoFence', href: '/geo-fence', symbol: LuFence },
  { label: 'Sensor settings', href: '/settings', symbol: IoMdSettings },
  { label: 'Configure receiver', href: '/configure', symbol: GrConfigure },
];

export const adminLinks = [
  { label: 'User Management', href: '/user-management', symbol: MdPeople },
];

export const accountLinks = [
  { label: 'Profile', href: '/profile', symbol: MdAccountCircle },
  { label: 'Alerts', href: '/alerts', symbol: IoIosNotifications },
  { label: 'Logout', href: '/logout', symbol: IoLogOut },
];
