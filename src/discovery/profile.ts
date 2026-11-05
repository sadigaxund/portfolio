export interface ProfileLink {
  label: string;
  href: string;
}

/** What a recruiter sees before making any choice. Every value here awaits the owner's approval. */
export const PROFILE = {
  role: "PLACEHOLDER role",
  summary: "PLACEHOLDER summary, one line on what the owner builds and where.",
  links: [
    { label: "Email", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
  ] satisfies ProfileLink[],
};
