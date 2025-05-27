// Comment.ts
import mongoose, { Schema, model, Document } from "mongoose";

interface IComment extends Document {
  threadId: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  content: string;
  parentComment?: Schema.Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: {
    type: String,
    required: [true, "Comment content is required"],
    minlength: [1, "Content must be at least 1 character"],
    maxlength: [1000, "Content cannot exceed 1000 characters"],
  },
  parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  createdAt: { type: Date, default: Date.now },
});

const Comment = model<IComment>("Comment", commentSchema);

export default Comment;
