// Matches the clinics.slug check constraint in the DB: lowercase, hyphen-
// separated, no leading/trailing/doubled hyphens.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
