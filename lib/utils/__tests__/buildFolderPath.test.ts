import { buildFolderPath } from "../buildFolderPath";

describe("buildFolderPath", () => {
  // Create a folder map for testing
  const folderMap = new Map([
    ["1", { name: "Folder1", parentId: null }],
    ["2", { name: "Folder2", parentId: "1" }],
    ["3", { name: "Folder3", parentId: "2" }],
    ["4", { name: "Folder4", parentId: "3" }],
    ["cycle", { name: "CycleFolder", parentId: "cycle" }], // Self-referencing
  ]);

  test("returns Root for null folderId", () => {
    expect(buildFolderPath(folderMap, null)).toBe("Root");
  });

  test("returns folder name for top-level folder", () => {
    expect(buildFolderPath(folderMap, "1")).toBe("Folder1");
  });

  test("builds nested folder paths", () => {
    expect(buildFolderPath(folderMap, "2")).toBe("Folder1 / Folder2");
    expect(buildFolderPath(folderMap, "3")).toBe("Folder1 / Folder2 / Folder3");
  });

  test("handles missing folders in hierarchy", () => {
    expect(buildFolderPath(folderMap, "missing")).toBe("Incomplete path: ");
  });

  test("detects cycles in folder hierarchy", () => {
    expect(buildFolderPath(folderMap, "cycle")).toBe(
      "Cycle detected: CycleFolder",
    );
  });
});
