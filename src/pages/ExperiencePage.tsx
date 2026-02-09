import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { RobotSplash } from '../components/RobotSplash';

export const ExperiencePage = (): JSX.Element => {
  const navigate = useNavigate();
  return <RobotSplash onEnter={() => navigate('/')} />;
};
