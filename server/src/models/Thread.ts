import mongoose, { Schema, model, Document } from "mongoose";

// Định nghĩa interface cho Comment
interface IComment extends Document {
  user: Schema.Types.ObjectId;
  content: string;
  threadId: Schema.Types.ObjectId;
  createdAt: Date;
}

// Định nghĩa interface cho Repost
interface IRepost extends Document {
  user: Schema.Types.ObjectId;
  threadId: Schema.Types.ObjectId;
  createdAt: Date;
}

// Định nghĩa interface cho Share
interface IShare extends Document {
  user: Schema.Types.ObjectId;
  threadId: Schema.Types.ObjectId;
  createdAt: Date;
}

// Định nghĩa interface cho Thread
interface IThread extends Document {
  _id: Schema.Types.ObjectId;
  content: string;
  hashtags?: string[];
  images: string[];
  videos: string[];
  poll?: {
    question: string;
    options: {
      option: string;
      votes: number;
    }[];
    expiresAt: Date;
  };
  visibility: "public" | "friends" | "only_me";
  author: Schema.Types.ObjectId;
  comments?: IComment[];
  reposts?: IRepost[];
  shares?: IShare;
  createdAt: Date;
  guessViews: number;
  userViews: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount: number;
  cloudinaryPublicIds: string[]; // Lưu nhiều public_id
}

const threadSchema = new Schema<IThread>({
  content: {
    type: String,
    required: [true, "thread content is required"],
    minlength: [1, "Content must be at least 1 character"],
    maxlength: [5000, "Content cannot exceed 5000 characters"],
  },
  hashtags: [String],
  images: [String],
  videos: [String],
  poll: {
    question: String,
    options: [
      {
        option: String,
        votes: { type: Number, default: 0 },
      },
    ],
    expiresAt: Date,
  },
  visibility: {
    type: String,
    enum: ["public", "friends", "only_me"],
    default: "public",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  guessViews: {
    type: Number,
    default: 0,
  },
  userViews: {
    type: Number,
    default: 0,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  repostsCount: {
    type: Number,
    default: 0,
  },
  sharesCount: {
    type: Number,
    default: 0,
  },
  cloudinaryPublicIds: [{ type: String }],
});

const commentSchema = new Schema<IComment>({
  threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const shareSchema = new Schema<IShare>({
  threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const repostSchema = new Schema<IRepost>({
  threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Thread = mongoose.model<IThread>("Thread", threadSchema);
const Comment = mongoose.model<IComment>("Comment", commentSchema);
const Share = mongoose.model<IShare>("Share", shareSchema);
const Repost = mongoose.model<IRepost>("Repost", repostSchema);

export default Thread;
