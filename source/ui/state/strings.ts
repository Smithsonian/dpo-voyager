
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
    users: {
      "fr": "Utilisateurs",
      "en": "Users"
    },
    upload: {
      "fr": "Créer une scène",
      "en": "Upload a scene"
    },
    username: {
      "fr": "Nom d'utilisateur",
      "en": "Username"
    },
    password: {
      "fr": "Mot de passe",
      "en": "Password"
    },
    passwordConfirm: {
      "fr": "Confirmer le mot de passe",
      "en": "PasswordConfirm"
    },
    changePassword: {
      "fr": "Changer le mot de passe",
      "en": "Change password"
    },
    login: {
      "fr": "Connexion",
      "en": "Login"
    },
    logout: {
      "fr": "Se déconnecter",
      "en": "Logout"
    },
    filename: {
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
    },
    history: {
      fr: "Historique",
      en: "History"
    },
    access: {
      fr: "Accès",
      en: "Access"
    },
    add: {
      fr: "Ajouter",
      en: "Add"
    },
    none: {
      fr: "aucun",
      en: "none"
    },
    read: {
      fr: "lecture",
      en: "read"
    },
    write: {
      fr: "écriture",
      en: "write"
    },
    admin: {
      fr: "admin",
      en: "admin"
    },
    administration: {
      fr: "Administration",
      en: "Administration"
    },
    reportBug: {
      fr: "Signaler un bug",
      en: "Report a bug"
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
    },
    lead:{
      fr: "eCorpus est un modèle de base de données d'objets 3D développé par holusion et utilisant un éditeur et visualisateur enrichi issu du projet DPO-Voyager du smithsonian institute",
      en: "eCorpus is a database of 3D objects developped by holusion using and extending an open-source viewer made by the Smithsonian Institute"
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