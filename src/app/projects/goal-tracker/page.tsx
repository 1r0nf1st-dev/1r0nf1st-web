import { redirect } from 'next/navigation';

/** Goal Tracker has been integrated into Notes. Redirect to Notes. */
export default function GoalTrackerRedirectPage(): never {
  redirect('/notes');
}
