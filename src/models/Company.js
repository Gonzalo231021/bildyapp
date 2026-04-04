import mongoose from "mongoose";
import softDeletePlugin from "../utils/softDelete.plugin.js";

const companySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "La empresa debe tener un propietario"],
        },
        name: {
            type: String,
            trim: true,
            required: [true, "El nombre de la empresa es obligatorio"],
        },
        cif: {
            type: String,
            trim: true,
            required: [true, "El CIF de la empresa es obligatorio"],
            unique: true,
        },
        address: {
            street: { type: String, trim: true },
            number: { type: String, trim: true },
            postal: { type: String, trim: true },
            city: { type: String, trim: true },
            province: { type: String, trim: true },
        },
        logo: {
            type: String,
            trim: true,
        },
        isFreelance: {
            type: Boolean,
            default: false,
        },
        // createdAt y updatedAt se gestionan automáticamente con timestamps: true
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

companySchema.plugin(softDeletePlugin);

const Company = mongoose.model("Company", companySchema);

export default Company;

    