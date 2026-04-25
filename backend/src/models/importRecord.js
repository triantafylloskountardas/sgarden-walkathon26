import mongoose from "mongoose";
import mongooseLeanDefaults from "mongoose-lean-defaults";

const { Schema } = mongoose;

const importRecordSchema = new Schema(
    {
        raw: { type: Schema.Types.Mixed, required: true },
        label: { type: String, default: null },
        category: { type: String, default: null },
        amount: { type: Number, default: null },
        date: { type: Date, default: null },
        email: { type: String, default: null },
        notes: { type: String, default: null },
        importedAt: { type: Date, default: () => new Date() },
        importedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    },
    { timestamps: true, toObject: { versionKey: false }, minimize: false },
);

importRecordSchema.plugin(mongooseLeanDefaults.default);

export default mongoose.model("importRecords", importRecordSchema);
