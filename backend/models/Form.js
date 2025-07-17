const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["text", "multiple-choice"],
    required: true,
  },
  options: [
    {
      type: String,
      trim: true,
    },
  ],
  required: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    required: true,
  },
});

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [questionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    publicUrl: {
      type: String,
      unique: true,
    },
    settings: {
      allowMultipleResponses: {
        type: Boolean,
        default: false,
      },
      requireEmail: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        enum: ["light", "dark", "blue", "green"],
        default: "light",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate public URL before saving
formSchema.pre("save", function (next) {
  if (!this.publicUrl) {
    this.publicUrl = `form-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
  next();
});

// Virtual for response count
formSchema.virtual("responseCount", {
  ref: "Response",
  localField: "_id",
  foreignField: "form",
  count: true,
});

// Ensure virtuals are included in JSON
formSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Form", formSchema);
