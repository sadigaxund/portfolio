/** Direction of a branch at the fork: left, straight on, or right. */
export type Direction = -1 | 0 | 1;

export interface LeafSpec {
  slug: string;
  label: string;
}

export interface BranchSpec extends LeafSpec {
  leaves: LeafSpec[];
}

export interface TreeSpec {
  label: string;
  left: BranchSpec;
  straight: BranchSpec;
  right: BranchSpec;
}

/** Every node of the site. A node's URL is its parent's URL plus its slug. */
export const TREE: TreeSpec = {
  label: "Start",
  left: {
    slug: "personal",
    label: "Personal",
    leaves: [
      { slug: "hobbies", label: "Hobbies" },
      { slug: "instagram", label: "Instagram" },
    ],
  },
  straight: {
    slug: "professional",
    label: "Professional",
    leaves: [
      { slug: "career", label: "Career" },
      { slug: "education", label: "Education" },
      { slug: "certifications", label: "Certifications" },
    ],
  },
  right: {
    slug: "projects-blog",
    label: "Projects and blog",
    leaves: [
      { slug: "projects", label: "Projects" },
      { slug: "blog", label: "Blog" },
    ],
  },
};
