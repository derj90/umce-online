/**
 * Moodle course generator — orchestrates API calls to create a course
 * from a MoodleCoursePlan built by generator-utils.
 */

import {
  createCourse,
  updateSection,
  addAssignment,
  enrolUser,
  findUserByEmail,
} from "./client";
import type { MoodleCoursePlan } from "./generator-utils";

const ROLE_EDITING_TEACHER = 3;

export type GenerationResult = {
  courseId: number;
  courseUrl: string;
  sectionsCreated: number;
  activitiesCreated: number;
  teacherEnrolled: boolean;
};

/**
 * Execute the full course generation from a plan.
 * Creates the course, names sections, adds activities, and enrols the teacher.
 */
export async function generateMoodleCourse(
  plan: MoodleCoursePlan,
  docenteEmail: string,
): Promise<GenerationResult> {
  // 1. Create the course shell
  const courseId = await createCourse({
    fullname: plan.fullname,
    shortname: plan.shortname,
    categoryid: plan.categoryid,
    numsections: plan.numsections,
    summary: plan.summary,
  });

  const moodleUrl = process.env.MOODLE_VIRTUAL_URL ?? "https://virtual.umce.cl";

  // 2. Name each section after its núcleo
  for (const section of plan.sections) {
    try {
      await updateSection(
        courseId,
        section.sectionNum,
        section.name,
        section.summary,
      );
    } catch {
      // Section naming is best-effort — course still usable without it
    }
  }

  // 3. Add activities (evaluaciones) to their sections
  let activitiesCreated = 0;
  for (const activity of plan.activities) {
    try {
      if (activity.type === "assign") {
        await addAssignment({
          courseId,
          sectionNum: activity.sectionNum,
          name: activity.name,
          intro: `Ponderación: ${activity.weight}%`,
        });
        activitiesCreated++;
      }
      // quiz creation requires more complex setup — skip for now,
      // creates an assign placeholder instead
      if (activity.type === "quiz") {
        await addAssignment({
          courseId,
          sectionNum: activity.sectionNum,
          name: `[Prueba] ${activity.name}`,
          intro: `Ponderación: ${activity.weight}%. Tipo: prueba — configurar manualmente como Quiz.`,
        });
        activitiesCreated++;
      }
    } catch {
      // Activity creation is best-effort
    }
  }

  // 4. Enrol the docente as editing teacher
  let teacherEnrolled = false;
  try {
    const userId = await findUserByEmail(docenteEmail);
    if (userId) {
      await enrolUser({
        courseId,
        userId,
        roleId: ROLE_EDITING_TEACHER,
      });
      teacherEnrolled = true;
    }
  } catch {
    // Enrolment is best-effort
  }

  return {
    courseId,
    courseUrl: `${moodleUrl}/course/view.php?id=${courseId}`,
    sectionsCreated: plan.sections.length,
    activitiesCreated,
    teacherEnrolled,
  };
}
