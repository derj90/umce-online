/**
 * Moodle Web Services API client for virtual.umce.cl
 * Uses REST protocol with wstoken authentication.
 */

export type MoodleError = {
  exception: string;
  errorcode: string;
  message: string;
};

function isMoodleError(data: unknown): data is MoodleError {
  return (
    typeof data === "object" &&
    data !== null &&
    "exception" in data &&
    "errorcode" in data
  );
}

function getMoodleConfig() {
  const url = process.env.MOODLE_VIRTUAL_URL;
  const token = process.env.MOODLE_VIRTUAL_TOKEN;
  if (!url || !token) {
    throw new Error(
      "MOODLE_VIRTUAL_URL and MOODLE_VIRTUAL_TOKEN must be set in environment variables.",
    );
  }
  return { url, token };
}

/** Call a Moodle Web Service function via REST. */
export async function moodleCall<T>(
  wsfunction: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const { url, token } = getMoodleConfig();

  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
  });

  for (const [key, value] of Object.entries(params)) {
    body.append(key, String(value));
  }

  const response = await fetch(`${url}/webservice/rest/server.php`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Moodle HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (isMoodleError(data)) {
    throw new Error(`Moodle API error [${data.errorcode}]: ${data.message}`);
  }

  return data as T;
}

// ─── Typed Moodle API calls ──────────────────────────────────────────────────

export type MoodleCourse = {
  id: number;
  shortname: string;
  fullname: string;
  categoryid: number;
};

export type MoodleModule = {
  cmid: number;
};

/** Create a course and return its ID. */
export async function createCourse(params: {
  fullname: string;
  shortname: string;
  categoryid: number;
  numsections: number;
  summary?: string;
}): Promise<number> {
  const courses = await moodleCall<MoodleCourse[]>(
    "core_course_create_courses",
    {
      "courses[0][fullname]": params.fullname,
      "courses[0][shortname]": params.shortname,
      "courses[0][categoryid]": params.categoryid,
      "courses[0][numsections]": params.numsections,
      "courses[0][summary]": params.summary ?? "",
      "courses[0][format]": "topics",
    },
  );
  return courses[0].id;
}

/** Update a course section name. */
export async function updateSection(
  courseId: number,
  sectionNum: number,
  name: string,
  summary: string,
): Promise<void> {
  // First get sections to find section ID
  const sections = await moodleCall<{ id: number; section: number }[]>(
    "core_course_get_contents",
    { courseid: courseId },
  );

  const section = sections.find((s) => s.section === sectionNum);
  if (!section) return;

  await moodleCall("core_course_edit_section", {
    id: section.id,
    action: "setsectionname",
    value: name,
  });
}

/** Add an assign (tarea/proyecto/portfolio) activity to a section. */
export async function addAssignment(params: {
  courseId: number;
  sectionNum: number;
  name: string;
  intro?: string;
}): Promise<number> {
  const result = await moodleCall<{ cmid: number }[]>(
    "mod_assign_add_instance" as string,
    {
      "assignments[0][courseid]": params.courseId,
      "assignments[0][name]": params.name,
      "assignments[0][intro]": params.intro ?? "",
      "assignments[0][section]": params.sectionNum,
      "assignments[0][introformat]": 1,
    },
  );
  // Fallback: use core_course_add_module if assign endpoint not available
  return result?.[0]?.cmid ?? 0;
}

/** Enrol a user in a course with a given role. */
export async function enrolUser(params: {
  courseId: number;
  userId: number;
  roleId: number; // 3=editingteacher, 5=student
}): Promise<void> {
  await moodleCall("enrol_manual_enrol_users", {
    "enrolments[0][roleid]": params.roleId,
    "enrolments[0][userid]": params.userId,
    "enrolments[0][courseid]": params.courseId,
  });
}

/** Look up a Moodle user by email. Returns userId or null. */
export async function findUserByEmail(
  email: string,
): Promise<number | null> {
  const result = await moodleCall<{ users: { id: number }[] }>(
    "core_user_get_users",
    {
      "criteria[0][key]": "email",
      "criteria[0][value]": email,
    },
  );
  return result.users?.[0]?.id ?? null;
}
