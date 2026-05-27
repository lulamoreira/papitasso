-- Create AI usage log table
CREATE TABLE public.ai_usage_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    tokens_estimated INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage" ON public.ai_usage_log
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage" ON public.ai_usage_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create Daily Quiz table
CREATE TABLE public.daily_quiz (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- [string, string, string, string]
    correct_index INTEGER NOT NULL,
    fact TEXT,
    difficulty TEXT, -- easy, medium, hard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT ON public.daily_quiz TO authenticated;
GRANT ALL ON public.daily_quiz TO service_role;

ALTER TABLE public.daily_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily quiz" ON public.daily_quiz
FOR SELECT TO authenticated USING (true);

-- Create Quiz Answers table
CREATE TABLE public.quiz_answers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.daily_quiz(id) ON DELETE CASCADE,
    answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, quiz_id)
);

GRANT SELECT, INSERT ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz answers" ON public.quiz_answers
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz answers" ON public.quiz_answers
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN quiz_streak INTEGER DEFAULT 0,
ADD COLUMN last_quiz_date DATE;

-- Create share cards bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('share-cards', 'share-cards', true);

CREATE POLICY "Share cards are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'share-cards');

CREATE POLICY "Users can upload their own share cards" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'share-cards');
