import { db } from "@/lib/drizzle/db";
import { spielVersions } from "@/lib/drizzle/schema";

type SpielSnapshot = {
  spielId: string;
  savedByUserId: string;
  title: string;
  contentHtml: string | null | undefined;
  contentJson: string | null | undefined;
  contentPlain: string | null | undefined;
  categoryId: string | null | undefined;
};

export async function snapshotSpiel(data: SpielSnapshot): Promise<void> {
  await db.insert(spielVersions).values({
    spielId: data.spielId,
    savedByUserId: data.savedByUserId,
    title: data.title,
    contentHtml: data.contentHtml ?? null,
    contentJson: data.contentJson ?? null,
    contentPlain: data.contentPlain ?? null,
    categoryId: data.categoryId ?? null,
  });
}
