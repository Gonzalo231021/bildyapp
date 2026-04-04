import mongoose from "mongoose";
import softDeletePlugin from "../utils/softDelete.plugin.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      // Comprobares que la contraseña tenga al menos 8 caracteres, una mayúscula, una minúscula y un número en ZOD, antes de que la contraseña se hashee
    },
    name: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    nif: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "guest"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationAttempts: {
      type: Number,
      select: false,
      default: 3,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ status: 1 });
userSchema.index({ company: 1 });
userSchema.index({ role: 1 });
//El de email no es necesario porque ya es único

userSchema.virtual("fullName").get(function () {
  return `${this.name ?? ""} ${this.lastName ?? ""}`.trim();
});

userSchema.plugin(softDeletePlugin);

userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
