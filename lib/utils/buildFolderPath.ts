/**
 * Builds the full folder path for a given folder ID using a folder map.
 * Handles null parent references and prevents infinite loops from cyclic references.
 *
 * @param {Map<string, { name: string; parentId: string | null }>} folderMap - Map of folder IDs to folder data
 * @param {string | null} folderId - The ID of the folder to build the path for
 * @returns {string} The full folder path as a string
 */
export const buildFolderPath = (
  folderMap: Map<string, { name: string; parentId: string | null }>,
  folderId: string | null,
): string => {
  if (!folderId) return "Root";

  const path: string[] = [];
  let currentId: string | null = folderId;
  const visitedIds = new Set<string>();

  while (currentId) {
    // Prevent infinite loops from cyclic references
    if (visitedIds.has(currentId)) {
      return `Cycle detected: ${path.join(" / ")}`;
    }
    visitedIds.add(currentId);

    const folder = folderMap.get(currentId);
    if (!folder) {
      return `Incomplete path: ${path.join(" / ")}`;
    }

    path.unshift(folder.name);
    currentId = folder.parentId;
  }

  return path.length > 0 ? path.join(" / ") : "Root";
};
