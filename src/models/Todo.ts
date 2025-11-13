import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  id: number;
  username: string;
  description: string;
  targetDate: Date;
  done: boolean;
}

const TodoSchema: Schema = new Schema({
  id: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  targetDate: {
    type: Date,
    required: true
  },
  done: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

TodoSchema.index({ username: 1, id: 1 }, { unique: true });

export default mongoose.model<ITodo>('Todo', TodoSchema);
