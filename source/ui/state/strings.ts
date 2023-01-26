
export type LocalizedString = {
  "fr" :string, 
  "en" :string,
  "fr_plural" ?:string,
  "en_plural" ?:string,
};
export type Language = keyof LocalizedString;

export type I18nDict = {
  [key:string]: I18nDict|LocalizedString;
}

export default {
  ui:{
    users:{
      "fr": "Utilisateurs",
      "en": "Users"
    },
    upload:{
      "fr": "Créer une scène",
      "en": "Upload a scene"
    },
    username:{
      "fr": "nom",
      "en": "username"
    },
    filename:{
      fr:"fichier",
      fr_plural: "fichiers",
      en:"filename",
      en_plural: "filenames,"
    },
    rights: {
      "fr": "droits",
      "en": "rights"
    },
    mtime: {
      fr: "dernière modification",
      en: "modification time"
    },
    author: {
      fr: "auteur{plural=s}",
      en: "author{plural=s}"
    }
  },
  info:{
    noData:{
      fr:"Aucune donnée trouvée pour {item}",
      en:"No data available for {item}"
    },
    etAl:{
      fr:"{item} et {count} autre",
      fr_plural:"{item} et {count} autres",
      en:"{item} and {count} other",
      en_plural:"{item} and {count} others",
    }
  },
  errors:{
    '404':{
      fr: "Non trouvé",
      en: "Not found"
    },
    '404_text':{
      fr:"Pas de route correspondant à {route}",
      en:"No route matching {route}"
    }
  }
}