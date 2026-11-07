/** Direction of a branch at the fork: left, straight on, or right. */
export type Direction = -1 | 0 | 1;

/** A node with children is a subsection, and a node without is a leaf. Both may share a level. */
export interface NodeSpec {
  slug: string;
  label: string;
  children?: NodeSpec[];
}

export interface TreeSpec {
  label: string;
  left: NodeSpec;
  straight: NodeSpec;
  right: NodeSpec;
}

/** Every node of the site. A node's URL is its parent's URL plus its slug. */
export const TREE: TreeSpec = {
  label: "Sadig Akhund",
  left: {
    slug: "personal",
    label: "Personal",
    children: [
      {
        slug: "hobbies",
        label: "Hobbies",
        children: [
          { slug: "placeholder-leaf", label: "PLACEHOLDER leaf" },
          {
            slug: "placeholder-group",
            label: "PLACEHOLDER group",
            children: [{ slug: "placeholder-deep", label: "PLACEHOLDER deep leaf" }],
          },
        ],
      },
      { slug: "instagram", label: "Instagram" },
    ],
  },
  straight: {
    slug: "professional",
    label: "Professional",
    children: [
      { slug: "career", label: "Career" },
      { slug: "education", label: "Education" },
      { slug: "certifications", label: "Certifications" },
    ],
  },
  right: {
    slug: "projects-blog",
    label: "Projects and blog",
    children: [
      { slug: "projects", label: "Projects" },
      { slug: "blog", label: "Blog" },
    ],
  },
};
