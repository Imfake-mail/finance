import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useFinanceStore = create((set, get) => ({
  user: null,
  loading: true,
  transactions: [],
  categories: [],
  categoryGroups: [],
  income: [],
  budgets: [],

  setUser: (user) => set({ user }),
  
  initialize: async () => {
    set({ loading: true });
    
    // Check active session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user });
      await get().fetchData();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user });
        await get().fetchData();
      } else {
        set({ user: null, transactions: [], categories: [], categoryGroups: [], income: [], budgets: [] });
      }
    });

    set({ loading: false });
  },

  fetchData: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const [groupsRes, categoriesRes, transactionsRes, incomeRes, budgetsRes] = await Promise.all([
        supabase.from('category_groups').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('income').select('*').order('date_received', { ascending: false }),
        supabase.from('budgets').select('*')
      ]);

      set({
        categoryGroups: groupsRes.data || [],
        categories: categoriesRes.data || [],
        transactions: transactionsRes.data || [],
        income: incomeRes.data || [],
        budgets: budgetsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  },

  addTransaction: async (transaction) => {
    const { user, transactions } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      set({ transactions: [data, ...transactions] });
    }
  },

  deleteTransaction: async (id) => {
    const { transactions } = get();
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    
    if (!error) {
      set({ transactions: transactions.filter(t => t.id !== id) });
    }
  },
  
  addCategory: async (category) => {
    const { user, categories } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      set({ categories: [...categories, data] });
    }
  },
}));
