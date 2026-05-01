-- Supabase SQL Schema for Finance Tracker PWA

-- Create Custom Types
CREATE TYPE category_group_type AS ENUM ('Needs', 'Wants', 'Savings');

-- 1. Category Groups Table
CREATE TABLE public.category_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name category_group_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    group_id UUID REFERENCES public.category_groups(id) ON DELETE CASCADE NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Transactions Table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Income Table
CREATE TABLE public.income (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date_received DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Budgets Table
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- Format: 'YYYY-MM'
    category_group_id UUID REFERENCES public.category_groups(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, month, category_group_id)
);

-- Enable Row Level Security
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only read/insert/update/delete their own data

-- category_groups policies
CREATE POLICY "Users can view own category groups" ON public.category_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category groups" ON public.category_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own category groups" ON public.category_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own category groups" ON public.category_groups FOR DELETE USING (auth.uid() = user_id);

-- categories policies
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- income policies
CREATE POLICY "Users can view own income" ON public.income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON public.income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON public.income FOR DELETE USING (auth.uid() = user_id);

-- budgets policies
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Create a function to initialize default categories for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    needs_id UUID;
    wants_id UUID;
    savings_id UUID;
BEGIN
    -- Create default category groups
    INSERT INTO public.category_groups (user_id, name) VALUES (new.id, 'Needs') RETURNING id INTO needs_id;
    INSERT INTO public.category_groups (user_id, name) VALUES (new.id, 'Wants') RETURNING id INTO wants_id;
    INSERT INTO public.category_groups (user_id, name) VALUES (new.id, 'Savings') RETURNING id INTO savings_id;

    -- Create default Needs categories
    INSERT INTO public.categories (user_id, group_id, name, is_default) VALUES
        (new.id, needs_id, 'Food & Groceries', true),
        (new.id, needs_id, 'Transport', true),
        (new.id, needs_id, 'Rent', true),
        (new.id, needs_id, 'Utilities/Bills', true),
        (new.id, needs_id, 'Healthcare', true);

    -- Create default Wants categories
    INSERT INTO public.categories (user_id, group_id, name, is_default) VALUES
        (new.id, wants_id, 'Dining Out', true),
        (new.id, wants_id, 'Shopping', true),
        (new.id, wants_id, 'Entertainment', true),
        (new.id, wants_id, 'Subscriptions', true),
        (new.id, wants_id, 'Travel', true);

    -- Create default Savings categories
    INSERT INTO public.categories (user_id, group_id, name, is_default) VALUES
        (new.id, savings_id, 'Investments', true),
        (new.id, savings_id, 'Emergency Fund', true),
        (new.id, savings_id, 'Retirement', true);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
