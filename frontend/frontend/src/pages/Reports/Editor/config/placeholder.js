export const editorPlaceholder = ({ node }) => {
  if (node.type.name === "heading") {
    return "Entrez le titre...";
  }

  return "Commencez à rédiger votre rapport scientifique...";
};