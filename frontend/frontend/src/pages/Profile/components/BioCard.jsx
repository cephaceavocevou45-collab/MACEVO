export default function BioCard({
  formData,
  setFormData,
  errors,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          À propos de vous
        </label>

        <textarea
          id="bio"
          name="bio"
          rows={5}
          maxLength={2000}
          value={formData.bio || ""}
          onChange={(event) =>
            setFormData((previous) => ({
              ...previous,
              bio: event.target.value,
            }))
          }
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition resize-none ${
            errors?.bio
              ? "border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          }`}
          placeholder="Présentez-vous en quelques lignes..."
        />

        <div className="flex justify-between mt-2">
          {errors?.bio ? (
            <p className="text-xs text-red-600">
              {errors.bio}
            </p>
          ) : (
            <span />
          )}

          <span className="text-xs text-slate-400">
            {(formData.bio || "").length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}