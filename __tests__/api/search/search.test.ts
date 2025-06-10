import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";
import { verifyJWT } from "@/lib/auth/serverAuth";

// Mock dependencies
jest.mock("@/lib/auth/serverAuth");
jest.mock("@/lib/logger", () => ({
  apiLogger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(), // Added error method
    })),
  },
  logError: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logPerformance: jest.fn(),
}));

// Mock buildFolderPath utility
jest.mock("@/lib/utils/buildFolderPath", () => ({
  buildFolderPath: jest.fn(),
}));

const mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;

// Get the mocked prisma
const mockPrisma = jest.mocked(require("@/lib/db").default);

// Import and get the mocked buildFolderPath
import { buildFolderPath } from "@/lib/utils/buildFolderPath";
const mockBuildFolderPath = buildFolderPath as jest.MockedFunction<
  typeof buildFolderPath
>;

// Helper function to create requests with headers
const mockRequest = (url: string) => {
  const headers = new Headers();
  headers.set("x-request-id", "test-request-id");
  headers.set("user-agent", "jest-test-runner");
  headers.set("x-forwarded-for", "127.0.0.1");
  return new NextRequest(url, { headers });
};

describe("/api/search", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.error to avoid noise in tests
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("GET /api/search", () => {
    it("should return 401 when unauthorized", async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: "Invalid token",
      });

      const request = mockRequest("http://localhost/api/search?query=test");
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 when query is missing", async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: "user-1",
        email: "test@example.com",
      });

      const request = mockRequest("http://localhost/api/search");
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("should search folders and notes successfully", async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: "user-1",
        email: "test@example.com",
      });

      const mockFolders = [
        {
          id: "folder-1",
          name: "Test Folder",
          parentId: null,
          parent: null,
          _count: { children: 2, notes: 3 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockNotes = [
        {
          id: "note-1",
          title: "Test Note",
          contentMarkdown: "This is a test note content",
          folderId: "folder-1",
          folder: { id: "folder-1", name: "Test Folder" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue(mockNotes);

      // Mock the folder lookup for path building
      mockPrisma.folder.findUnique.mockImplementation((args: any) => {
        if (args.where.id === "folder-1") {
          return Promise.resolve({
            id: "folder-1",
            name: "Test Folder",
            parentId: null,
          });
        }
        return Promise.resolve(null);
      });

      const request = mockRequest("http://localhost/api/search?query=test");

      // Configure buildFolderPath mock
      mockBuildFolderPath.mockImplementation((map, id) => {
        if (!id) return "Root";
        if (id === "folder-1") return "Root";
        return `Path for ${id}`;
      });

      const response = await GET(request);

      if (response.status !== 200) {
        const errorData = await response.json();
        console.log("Error response:", errorData);
      }

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(2);
      expect(responseData.query).toBe("test");
      expect(responseData.totalResults).toBe(2);

      // Check folder result
      const folderResult = responseData.results.find(
        (r: any) => r.type === "folder",
      );
      expect(folderResult).toBeDefined();
      expect(folderResult.name).toBe("Test Folder");
      expect(folderResult.path).toBe("Root");

      // Check note result
      const noteResult = responseData.results.find(
        (r: any) => r.type === "note",
      );
      expect(noteResult).toBeDefined();
      expect(noteResult.title).toBe("Test Note");
      expect(noteResult.path).toBe("Root");
    });

    it("should build folder paths correctly", async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: "user-1",
        email: "test@example.com",
      });

      const mockFolders = [
        {
          id: "folder-2",
          name: "Child Folder",
          parentId: "folder-1",
          parent: { id: "folder-1", name: "Parent Folder" },
          _count: { children: 0, notes: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockNotes: any[] = [];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue(mockNotes);

      // Mock the path building
      mockPrisma.folder.findUnique.mockImplementation((args: any) => {
        if (args.where.id === "folder-1") {
          return Promise.resolve({
            id: "folder-1",
            name: "Parent Folder",
            parentId: null,
          });
        }
        return Promise.resolve(null);
      });

      const request = mockRequest("http://localhost/api/search?query=child");

      // Configure buildFolderPath mock
      mockBuildFolderPath.mockImplementation((map, id) => {
        if (!id) return "Root";
        if (id === "folder-1") return "Parent Folder";
        return `Path for ${id}`;
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(1);

      const folderResult = responseData.results[0];
      expect(folderResult.path).toBe("Parent Folder");
    });

    it("should handle sorting by name", async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: "user-1",
        email: "test@example.com",
      });

      const mockFolders = [
        {
          id: "folder-1",
          name: "Z Folder",
          parentId: null,
          parent: null,
          _count: { children: 0, notes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "folder-2",
          name: "A Folder",
          parentId: null,
          parent: null,
          _count: { children: 0, notes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue([]);
      mockPrisma.folder.findUnique.mockResolvedValue(null);

      const request = mockRequest(
        "http://localhost/api/search?query=folder&sortBy=name&sortOrder=asc",
      );
      const response = await GET(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(2);
      expect(responseData.results[0].name).toBe("A Folder");
      expect(responseData.results[1].name).toBe("Z Folder");
    });
  });
});
