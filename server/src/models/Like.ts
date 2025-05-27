import mongoose, { Schema, model, Document } from "mongoose";

// Định nghĩa interface cho Like
interface ILike extends Document {
  user: Schema.Types.ObjectId;
  threadId: Schema.Types.ObjectId;
  username: string;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  user: { type: Schema.Types.ObjectId, required: true },
  username: { type: String, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Like = mongoose.model<ILike>("Like", likeSchema);

export default Like;
