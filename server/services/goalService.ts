import type { SupabaseClient } from '@supabase/supabase-js';

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  milestones?: GoalMilestone[];
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  target_date?: string;
  progress_percentage?: number;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  target_date?: string;
  progress_percentage?: number;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface CreateMilestoneInput {
  goal_id: string;
  title: string;
  description?: string;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export async function getGoalsByUserId(db: SupabaseClient, userId: string): Promise<Goal[]> {
  const { data, error } = await db
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return (data || []) as Goal[];
}

export async function getGoalById(
  db: SupabaseClient,
  goalId: string,
  userId: string,
): Promise<Goal | null> {
  const { data, error } = await db
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch goal: ${error.message}`);
  }

  return data as Goal;
}

export async function getGoalWithMilestones(
  db: SupabaseClient,
  goalId: string,
  userId: string,
): Promise<Goal | null> {
  const { data: goal, error: goalError } = await db
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (goalError) {
    if (goalError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch goal: ${goalError.message}`);
  }

  const { data: milestones, error: milestonesError } = await db
    .from('goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true });

  if (milestonesError) {
    throw new Error(`Failed to fetch milestones: ${milestonesError.message}`);
  }

  return {
    ...goal,
    milestones: (milestones || []) as GoalMilestone[],
  } as Goal;
}

export async function createGoal(
  db: SupabaseClient,
  userId: string,
  input: CreateGoalInput,
): Promise<Goal> {
  const { data, error } = await db
    .from('goals')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      target_date: input.target_date || null,
      progress_percentage: input.progress_percentage ?? 0,
      status: input.status || 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return data as Goal;
}

export async function updateGoal(
  db: SupabaseClient,
  goalId: string,
  userId: string,
  input: UpdateGoalInput,
): Promise<Goal> {
  // First verify the goal belongs to the user
  const existingGoal = await getGoalById(db, goalId, userId);
  if (!existingGoal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await db
    .from('goals')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return data as Goal;
}

export async function deleteGoal(
  db: SupabaseClient,
  goalId: string,
  userId: string,
): Promise<void> {
  // First verify the goal belongs to the user
  const existingGoal = await getGoalById(db, goalId, userId);
  if (!existingGoal) {
    throw new Error('Goal not found or access denied');
  }

  const { error } = await db.from('goals').delete().eq('id', goalId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}

export async function getMilestonesByGoalId(
  db: SupabaseClient,
  goalId: string,
  userId: string,
): Promise<GoalMilestone[]> {
  // Verify the goal belongs to the user
  const goal = await getGoalById(db, goalId, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await db
    .from('goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch milestones: ${error.message}`);
  }

  return (data || []) as GoalMilestone[];
}

export async function createMilestone(
  db: SupabaseClient,
  userId: string,
  input: CreateMilestoneInput,
): Promise<GoalMilestone> {
  // Verify the goal belongs to the user
  const goal = await getGoalById(db, input.goal_id, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await db
    .from('goal_milestones')
    .insert({
      goal_id: input.goal_id,
      title: input.title,
      description: input.description || null,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create milestone: ${error.message}`);
  }

  return data as GoalMilestone;
}

export async function updateMilestone(
  db: SupabaseClient,
  milestoneId: string,
  userId: string,
  input: UpdateMilestoneInput,
): Promise<GoalMilestone> {
  // First get the milestone to verify it belongs to a goal owned by the user
  const { data: milestone, error: fetchError } = await db
    .from('goal_milestones')
    .select('goal_id')
    .eq('id', milestoneId)
    .single();

  if (fetchError || !milestone) {
    throw new Error('Milestone not found');
  }

  const goal = await getGoalById(db, milestone.goal_id, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const updateData: Partial<GoalMilestone> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // If marking as completed, set completed_at
  if (input.completed === true) {
    updateData.completed_at = new Date().toISOString();
  } else if (input.completed === false) {
    updateData.completed_at = null;
  }

  const { data, error } = await db
    .from('goal_milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update milestone: ${error.message}`);
  }

  return data as GoalMilestone;
}

export async function deleteMilestone(
  db: SupabaseClient,
  milestoneId: string,
  userId: string,
): Promise<void> {
  // First get the milestone to verify it belongs to a goal owned by the user
  const { data: milestone, error: fetchError } = await db
    .from('goal_milestones')
    .select('goal_id')
    .eq('id', milestoneId)
    .single();

  if (fetchError || !milestone) {
    throw new Error('Milestone not found');
  }

  const goal = await getGoalById(db, milestone.goal_id, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { error } = await db.from('goal_milestones').delete().eq('id', milestoneId);

  if (error) {
    throw new Error(`Failed to delete milestone: ${error.message}`);
  }
}
