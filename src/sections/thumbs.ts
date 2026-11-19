/** The built URL of a node's `thumb` in the image map, or a thrown error naming the missing file so the build fails. */
export function thumbUrl(thumb: string, images: Record<string, string>): string {
  const url = images[`/content/${thumb}`];
  if (url === undefined) throw new Error(`content/site.yaml: thumb "content/${thumb}" does not exist`);
  return url;
}
