import mongoose, { Schema, model, Document } from "mongoose";

interface ICommentLike extends Document {
  user: Schema.Types.ObjectId;
  commentId: Schema.Types.ObjectId;
  username: string;
  createdAt: Date;
}

const commentLikeSchema = new Schema<ICommentLike>({
  commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  user: { type: Schema.Types.ObjectId, required: true },
  username: { type: String, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommentLike = mongoose.model<ICommentLike>(
  "CommentLike",
  commentLikeSchema
);

export default CommentLike;
