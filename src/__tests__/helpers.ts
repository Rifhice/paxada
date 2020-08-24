import { buildFolderStructureFromPath, nameRoute } from "../helpers";

describe("buildFolderStructureFromPath", () => {
  test("Should ignore the ids", () => {
    expect(buildFolderStructureFromPath("/posts/:postId")).toEqual("Posts");
  });
  test("Should work even with the first character not being a /", () => {
    expect(buildFolderStructureFromPath("posts/:postId")).toEqual("Posts");
  });
  test("Nested paths", () => {
    expect(buildFolderStructureFromPath("posts/:postId/comments")).toEqual(
      "Posts/Comments"
    );
    expect(
      buildFolderStructureFromPath("posts/:postId/comments/:commentId")
    ).toEqual("Posts/Comments");
    expect(
      buildFolderStructureFromPath("posts/:postId/comments/:commentId/entities")
    ).toEqual("Posts/Comments/Entities");
    expect(
      buildFolderStructureFromPath(
        "posts/:postId/comments/:commentId/entities/:entity"
      )
    ).toEqual("Posts/Comments/Entities");
  });
  test("Should work even with two consecutive /", () => {
    expect(buildFolderStructureFromPath("posts//:postId")).toEqual("Posts");
    expect(
      buildFolderStructureFromPath("posts//:postId//Comments/:commentId")
    ).toEqual("Posts/Comments");
  });
});

describe("nameRoute", () => {
  test("Path with pair number of components should be name correctly in PascalCase", () => {
    expect(nameRoute("/posts/:postId", "GET")).toEqual("GetPost");
    expect(nameRoute("/posts", "GET")).toEqual("GetPosts");
    expect(nameRoute("/posts", "POST")).toEqual("CreatePost");
    expect(nameRoute("/posts/:postId", "DELETE")).toEqual("DeletePost");
    expect(nameRoute("/posts/:postId", "PUT")).toEqual("UpdatePost");
  });
  test("Nested path with pair number of components should be name correctly in PascalCase", () => {
    expect(nameRoute("/posts/:postId/Comments", "GET")).toEqual("GetComments");
    expect(nameRoute("/posts/:postId/Comments/:commentId", "GET")).toEqual(
      "GetComment"
    );
    expect(nameRoute("/posts/:postId/Comments", "POST")).toEqual(
      "CreateComment"
    );
    expect(nameRoute("/posts/:postId/Comments/:commentId", "DELETE")).toEqual(
      "DeleteComment"
    );
    expect(nameRoute("/posts/:postId/Comments/:commentId", "PUT")).toEqual(
      "UpdateComment"
    );
  });
});
