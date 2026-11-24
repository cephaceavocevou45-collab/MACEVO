export default function AuthorBiography({
  photo,
  name,
  biography,
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        À propos de l'auteur
      </h2>

      <div className="flex gap-8">
        {photo && (
          <img
            src={photo}
            alt={name}
            className="w-32 h-32 rounded-full object-cover"
          />
        )}

        <div>
          <h3 className="text-xl font-semibold">
            {name}
          </h3>

          <p className="mt-4 text-justify">
            {biography}
          </p>
        </div>
      </div>
    </section>
  );
}