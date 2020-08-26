"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
exports.route = {
    simplified: true,
    method: "get",
    path: "/posts/:postId",
    summary: "Retrieve one post",
    description: "zefijz",
    tag: "Posts",
    pathVariables: {
        postId: {
            type: "string",
            description: "f",
            example: "fze",
            required: true,
        },
    },
    queryVariables: {
        mini: {
            type: "boolean",
            description: "d",
            example: true,
            required: false,
        },
    },
    responses: {
        200: {
            description: "f",
            response: {
                content: {
                    type: "string",
                    description: "f",
                    example: "fze",
                    required: true,
                },
                author: {
                    type: "string",
                    description: "f",
                    example: "fze",
                    required: true,
                },
            },
        },
    },
};
