export const editorEvents = {

  onCreate({ editor }) {

    console.log("✅ Éditeur initialisé");

  },

  onUpdate({ editor }) {

    // Déclenché à chaque modification
    // Sauvegarde automatique
    // Compteur de mots
    // Historique
    // IA

  },

  onSelectionUpdate({ editor }) {

    // Déclenché lorsqu'un texte est sélectionné

  },

  onFocus({ editor }) {

    console.log("Éditeur actif");

  },

  onBlur({ editor }) {

    console.log("Éditeur inactif");

  },

  onDestroy() {

    console.log("Éditeur détruit");

  },

};