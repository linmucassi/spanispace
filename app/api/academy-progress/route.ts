// Marks a training lesson complete or incomplete for the signed-in user.
//
// Lesson content itself is static (data/academy.ts), but completion is
// per-user state, so it lives in academy_lesson_progress instead. courseSlug
// and lessonNumber are validated against the real course registry so this
// endpoint can never be used to write an arbitrary row.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCourse } from '@/data/courses';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const courseSlug = typeof body?.courseSlug === 'string' ? body.courseSlug : null;
  const lessonNumber = Number.isInteger(body?.lessonNumber) ? body.lessonNumber : null;
  const completed = body?.completed === true;

  if (!courseSlug || lessonNumber === null) {
    return NextResponse.json({ error: 'Missing courseSlug or lessonNumber.' }, { status: 400 });
  }

  const course = getCourse(courseSlug);
  const lesson = course?.lessons.find((l) => l.number === lessonNumber);
  if (!course || !lesson) {
    return NextResponse.json({ error: 'Unknown course or lesson.' }, { status: 404 });
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  if (completed) {
    const { error } = await supabase.from('academy_lesson_progress').upsert(
      {
        user_id: user.id,
        course_slug: courseSlug,
        lesson_number: lessonNumber,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_slug,lesson_number' }
    );
    if (error) {
      console.error('[academy-progress] upsert failed:', error.message);
      return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('academy_lesson_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('course_slug', courseSlug)
      .eq('lesson_number', lessonNumber);
    if (error) {
      console.error('[academy-progress] delete failed:', error.message);
      return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, completed });
}
