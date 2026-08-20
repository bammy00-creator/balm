// DESIGN.md section 4, rule 5: score colour follows one scale everywhere -
// 70+ is leaf, 40-69 is cocoa, below 40 is berry. Never a chart colour that
// isn't this scale.
export function scoreColorClass(score: number): string {
  if (score >= 70) return "text-leaf";
  if (score >= 40) return "text-cocoa";
  return "text-berry";
}
