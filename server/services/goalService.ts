import { supabase } from '../db/supabase.js';

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

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return (data || []) as Goal[];
}

export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
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

export async function getGoalWithMilestones(goalId: string, userId: string): Promise<Goal | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data: goal, error: goalError } = await supabase
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

  const { data: milestones, error: milestonesError } = await supabase
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

export async function createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
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
  goalId: string,
  userId: string,
  input: UpdateGoalInput,
): Promise<Goal> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // First verify the goal belongs to the user
  const existingGoal = await getGoalById(goalId, userId);
  if (!existingGoal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await supabase
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

export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // First verify the goal belongs to the user
  const existingGoal = await getGoalById(goalId, userId);
  if (!existingGoal) {
    throw new Error('Goal not found or access denied');
  }

  const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}

export async function getMilestonesByGoalId(goalId: string, userId: string): Promise<GoalMilestone[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the goal belongs to the user
  const goal = await getGoalById(goalId, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await supabase
    .from('goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch milestones: ${error.message}`);
  }

  return (data || []) as GoalMilestone[];
}

export async function createMilestone(userId: string, input: CreateMilestoneInput): Promise<GoalMilestone> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the goal belongs to the user
  const goal = await getGoalById(input.goal_id, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { data, error } = await supabase
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
  milestoneId: string,
  userId: string,
  input: UpdateMilestoneInput,
): Promise<GoalMilestone> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // First get the milestone to verify it belongs to a goal owned by the user
  const { data: milestone, error: fetchError } = await supabase
    .from('goal_milestones')
    .select('goal_id')
    .eq('id', milestoneId)
    .single();

  if (fetchError || !milestone) {
    throw new Error('Milestone not found');
  }

  const goal = await getGoalById(milestone.goal_id, userId);
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

  const { data, error } = await supabase
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

export async function deleteMilestone(milestoneId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // First get the milestone to verify it belongs to a goal owned by the user
  const { data: milestone, error: fetchError } = await supabase
    .from('goal_milestones')
    .select('goal_id')
    .eq('id', milestoneId)
    .single();

  if (fetchError || !milestone) {
    throw new Error('Milestone not found');
  }

  const goal = await getGoalById(milestone.goal_id, userId);
  if (!goal) {
    throw new Error('Goal not found or access denied');
  }

  const { error } = await supabase.from('goal_milestones').delete().eq('id', milestoneId);

  if (error) {
    throw new Error(`Failed to delete milestone: ${error.message}`);
  }
}
