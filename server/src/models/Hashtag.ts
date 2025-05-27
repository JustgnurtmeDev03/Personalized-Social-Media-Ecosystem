import { Schema, model, Document } from "mongoose";

interface IHashtag extends Document {
  name: string;
  usageCount: number;
  threadsId: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

const hashtagSchema = new Schema<IHashtag>({
  name: {
    type: String,
    unique: true,
    trim: true,
    maxlength: [20, "Hashtag cannot exceed 20 characters"],
  },
  threadsId: [{ type: Schema.Types.ObjectId, ref: "threads" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Cập nhật trường updatedAt mỗi khi có thay đổi
hashtagSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Hashtag = model<IHashtag>("Hashtag", hashtagSchema);

export default Hashtag;
