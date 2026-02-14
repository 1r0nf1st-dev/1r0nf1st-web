'use client';

import type { JSX } from 'react';
import { useRouter } from 'next/navigation';
import { RobotSplash } from '../components/RobotSplash';

export const ExperiencePage = (): JSX.Element => {
  const router = useRouter();
  return <RobotSplash onEnter={() => router.push('/')} />;
};
