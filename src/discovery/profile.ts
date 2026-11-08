import profileData from "../../content/profile.yaml";
import { asList, asRecord, asString } from "../tree/check";

export interface ProfileLink {
  label: string;
  href: string;
}

const FILE = "content/profile.yaml";

function parseProfile(data: unknown) {
  const record = asRecord(FILE, "(root)", data, ["role", "summary", "links"]);
  const links = asList(FILE, "links", record.links).map((entry, index): ProfileLink => {
    const link = asRecord(FILE, `links[${index}]`, entry, ["label", "href"]);
    return {
      label: asString(FILE, `links[${index}].label`, link.label),
      href: asString(FILE, `links[${index}].href`, link.href),
    };
  });
  return { role: asString(FILE, "role", record.role), summary: asString(FILE, "summary", record.summary), links };
}

/** What a recruiter sees before making any choice, read from `content/profile.yaml`. */
export const PROFILE = parseProfile(profileData);
