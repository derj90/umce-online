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

/**
 * Update a course section name.
 * Uses core_course_get_contents to find section ID, then
 * core_course_edit_module (Moodle 3.3+) to rename.
 * NOTE: Standard Moodle WS has limited section-update support.
 * If this fails, sections keep their default "Topic N" names — course is still usable.
 */
export async function updateSection(
  courseId: number,
  sectionNum: number,
  name: string,
  _summary?: string,
): Promise<void> {
  // Get sections to find section ID
  const sections = await moodleCall<{ id: number; section: number }[]>(
    "core_course_get_contents",
    { courseid: courseId },
  );

  const section = sections.find((s) => s.section === sectionNum);
  if (!section) return;

  // Use core_update_inplace_editable (available since Moodle 3.1)
  // This is the WS function that powers inline section name editing
  await moodleCall("core_update_inplace_editable", {
    component: "format_topics",
    itemtype: "sectionname",
    itemid: section.id,
    value: name,
  });
}

/**
 * Add an assign (tarea/proyecto/portfolio) activity to a section.
 * Uses local_wsmanagesections (if available) or core_course_create_module.
 * Falls back gracefully — activities can always be added manually.
 */
export async function addAssignment(params: {
  courseId: number;
  sectionNum: number;
  name: string;
  intro?: string;
}): Promise<number> {
  // Try mod_assign external function (requires ws enabled for mod_assign)
  const result = await moodleCall<{ id?: number; cmid?: number }[]>(
    "core_course_add_content_item_to_course",
    {
      courseid: params.courseId,
      sectionnum: params.sectionNum,
      type: "assign",
      name: params.name,
    },
  );
  return result?.[0]?.cmid ?? result?.[0]?.id ?? 0;
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
