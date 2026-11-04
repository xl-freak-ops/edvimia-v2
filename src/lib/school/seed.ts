import { supabase } from "@/integrations/supabase/client";

/** Seed realistic demo academic structure + subjects + grading for a fresh school. */
export async function seedDemoSchoolData(schoolId: string) {
  // Sessions
  const { data: session } = await supabase
    .from("academic_sessions")
    .insert({ school_id: schoolId, name: "2025/2026", is_current: true, start_date: "2025-09-08", end_date: "2026-07-24" })
    .select()
    .maybeSingle();

  if (session) {
    await supabase.from("terms").insert([
      { school_id: schoolId, session_id: session.id, name: "First Term", is_current: true, start_date: "2025-09-08", end_date: "2025-12-12" },
      { school_id: schoolId, session_id: session.id, name: "Second Term", start_date: "2026-01-12", end_date: "2026-04-10" },
      { school_id: schoolId, session_id: session.id, name: "Third Term", start_date: "2026-04-27", end_date: "2026-07-24" },
    ]);
  }

  // Sections → Classes → Arms
  const sectionsSpec = [
    { name: "Primary", display_order: 1, classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
    { name: "JSS", display_order: 2, classes: ["JSS 1", "JSS 2", "JSS 3"] },
    { name: "SSS", display_order: 3, classes: ["SS 1", "SS 2", "SS 3"] },
  ];

  for (const sec of sectionsSpec) {
    const { data: section } = await supabase
      .from("sections")
      .insert({ school_id: schoolId, name: sec.name, display_order: sec.display_order })
      .select()
      .maybeSingle();
    if (!section) continue;
    for (let i = 0; i < sec.classes.length; i++) {
      const { data: cls } = await supabase
        .from("classes")
        .insert({ school_id: schoolId, section_id: section.id, name: sec.classes[i], display_order: i })
        .select()
        .maybeSingle();
      if (cls) {
        await supabase.from("class_arms").insert(["A", "B", "C"].map((n) => ({
          school_id: schoolId, class_id: cls.id, name: n,
        })));
      }
    }
  }

  // Subjects
  await supabase.from("subjects").insert([
    { school_id: schoolId, name: "Mathematics", code: "MTH", department: "Sciences", category: "core" },
    { school_id: schoolId, name: "English Language", code: "ENG", department: "Languages", category: "core" },
    { school_id: schoolId, name: "Basic Science", code: "BSC", department: "Sciences", category: "core" },
    { school_id: schoolId, name: "Civic Education", code: "CIV", department: "Humanities", category: "core" },
    { school_id: schoolId, name: "Computer Studies", code: "CMP", department: "ICT", category: "core" },
    { school_id: schoolId, name: "Agricultural Science", code: "AGR", department: "Sciences", category: "elective" },
    { school_id: schoolId, name: "Fine Art", code: "ART", department: "Arts", category: "elective" },
    { school_id: schoolId, name: "Home Economics", code: "HEC", department: "Vocational", category: "practical" },
  ]);

  // Grade scale (WAEC)
  await supabase.from("grade_scales").insert([
    { school_id: schoolId, grade: "A1", min_score: 75, max_score: 100, remark: "Excellent", display_order: 1 },
    { school_id: schoolId, grade: "B2", min_score: 70, max_score: 74.99, remark: "Very Good", display_order: 2 },
    { school_id: schoolId, grade: "B3", min_score: 65, max_score: 69.99, remark: "Good", display_order: 3 },
    { school_id: schoolId, grade: "C4", min_score: 60, max_score: 64.99, remark: "Credit", display_order: 4 },
    { school_id: schoolId, grade: "C5", min_score: 55, max_score: 59.99, remark: "Credit", display_order: 5 },
    { school_id: schoolId, grade: "C6", min_score: 50, max_score: 54.99, remark: "Credit", display_order: 6 },
    { school_id: schoolId, grade: "D7", min_score: 45, max_score: 49.99, remark: "Pass", display_order: 7 },
    { school_id: schoolId, grade: "E8", min_score: 40, max_score: 44.99, remark: "Pass", display_order: 8 },
    { school_id: schoolId, grade: "F9", min_score: 0, max_score: 39.99, remark: "Fail", display_order: 9 },
  ]);

  await supabase.from("school_settings").upsert({
    school_id: schoolId,
    attendance: { mark_by: "day", late_threshold_minutes: 15, auto_notify_parents: false },
    results: { ca_total: 40, exam_total: 60, show_position: true },
    promotion: { pass_mark: 50, max_failed_subjects: 2, auto_promote: false },
  });
}