export default function PersonalInfoForm({
  formData,
  handleChange,
  errors,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Prénom */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Prénom
        </label>

        <input
          type="text"
          name="firstName"
          value={formData.firstName || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.firstName
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre prénom"
        />

        {errors.firstName && (
          <p className="mt-1 text-xs text-red-500">
            {errors.firstName}
          </p>
        )}
      </div>

      {/* Nom */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Nom
        </label>

        <input
          type="text"
          name="lastName"
          value={formData.lastName || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.lastName
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre nom"
        />

        {errors.lastName && (
          <p className="mt-1 text-xs text-red-500">
            {errors.lastName}
          </p>
        )}
      </div>

      {/* Nom d'utilisateur */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Nom d'utilisateur
        </label>

        <input
          type="text"
          name="username"
          value={formData.username || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.username
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre nom d'utilisateur"
        />

        {errors.username && (
          <p className="mt-1 text-xs text-red-500">
            {errors.username}
          </p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          E-mail
        </label>

        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.email
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre adresse e-mail"
        />

        {errors.email && (
          <p className="mt-1 text-xs text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Téléphone
        </label>

        <input
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.phone
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Ex. +229 01 XX XX XX XX"
        />

        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Université */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Université / Établissement
        </label>

        <input
          type="text"
          name="university"
          value={formData.university || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.university
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre université"
        />

        {errors.university && (
          <p className="mt-1 text-xs text-red-500">
            {errors.university}
          </p>
        )}
      </div>

      {/* Pays */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Pays
        </label>

        <input
          type="text"
          name="country"
          value={formData.country || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.country
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre pays"
        />

        {errors.country && (
          <p className="mt-1 text-xs text-red-500">
            {errors.country}
          </p>
        )}
      </div>

      {/* Ville */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Ville
        </label>

        <input
          type="text"
          name="city"
          value={formData.city || ""}
          onChange={handleChange}
          className={`w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs ${
            errors.city
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          placeholder="Votre ville"
        />

        {errors.city && (
          <p className="mt-1 text-xs text-red-500">
            {errors.city}
          </p>
        )}
      </div>

    </div>
  );
}