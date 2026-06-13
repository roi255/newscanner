/* examCategoriesSource.ts — Phase 4: the exam-category list moved into the DB.
 *
 * Three-tier, mirroring institutionsSource: live → cached → bundled. On success
 * it hydrates examTypes.ts (which the Session form + label lookups read), so the
 * rest of the app is unchanged. Never throws. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExamCategory, fetchExamCategories, isDirectoryConfigured } from "../api/osim/directory";
import { hydrateExamCategories } from "../api/osim/examTypes";

const CACHE_KEY = "exam_categories_v1";

/** Resolve exam categories: live → cached → bundled, and hydrate examTypes. */
export async function loadExamCategories(): Promise<void> {
  if (isDirectoryConfigured()) {
    try {
      const cats = await fetchExamCategories();
      if (cats.length) {
        hydrateExamCategories(cats);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cats)).catch(() => {});
        return;
      }
    } catch {
      /* fall through to cache/bundle */
    }
  }
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cats = JSON.parse(raw) as ExamCategory[];
      if (Array.isArray(cats) && cats.length) hydrateExamCategories(cats);
    }
  } catch {
    /* bundled defaults stay active */
  }
}
