export interface ProfileLink {
  label: string;
  href: string;
}

/** What a recruiter sees before making any choice. Facts come from the owner's DevOps resume. */
export const PROFILE = {
  role: "DevOps engineer. Baku, Azerbaijan.",
  summary:
    "I run Linux servers and delivery pipelines behind data platforms. 3+ years, including a government data platform on RHEL and the CI/CD and Terraform setup for a product team.",
  links: [
    { label: "Resume", href: "https://resume.sakhund.cc" },
    { label: "Email", href: "mailto:sadigaxund@hotmail.com" },
    { label: "GitHub", href: "https://github.com/sadigaxund" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/sakhund" },
  ] satisfies ProfileLink[],
};
