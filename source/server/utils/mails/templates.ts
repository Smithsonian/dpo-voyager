import config from "../config";


export type Mime = "text"|"html"
export type MailBody = Record<Mime|"subject", string>;

export const BOUNDARY = `=======${Buffer.from(config.brand.padStart(10,"0").slice(0,10)).toString("hex")}=======`


const styles = `<style>

  .btn {
    cursor: pointer;
    color: white !important;
    background-color: #0089bf;
    text-decoration: none;
    padding: 0.5rem 1rem;
    margin: 2rem 0.5rem;
    border-radius: 4px;
  }

</style>`


export interface RecoverAccountOptions{
  link:string;
  expires :Date;
}
export const recoverAccount = (p :RecoverAccountOptions) :MailBody =>({
  'subject': "Votre lien de connection",
  'html': `<!DOCTYPE html><html lang="fr">
  <head>
    ${styles}
  </head>
  <p>
    Bonjour,
  </p>
  <p>
    Nous venons de recevoir une demande de lien de connexion pour un compte lié à votre adresse.<br>
    Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
  </p>
  <p>
    Sinon, vous pouvez vous connecter en cliquant sur le bouton ci-dessous.
  </p>
  <p align="center">
    <a class="btn" href="${p.link}">Connectez-vous</a>
  </p>
  <p>
    Pour des raisons de sécurité, ce lien expirera le ${p.expires.toLocaleDateString("fr")} à ${p.expires.toLocaleTimeString("fr")}.
  </p>
  <p>
    Une fois connecté, n'oubliez pas de réinitialiser votre mot de passe!
  </p>
  <p> Pour rapporter toute erreur, vous pouvez nous contacter sur la <a href="https://github.com/Holusion/e-thesaurus">page du projet eThesaurus</a>
</html>`,

'text':`
  Bonjour,
  \tNous venons de recevoir une demande de lien de connexion pour un compte lié à votre adresse.
  Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

  Sinon, vous pouvez vous connecter en cliquant sur le lien ci-dessous.

  ${p.link}

  Pour des raisons de sécurité, ce lien expirera le ${p.expires.toLocaleDateString("fr")} à ${p.expires.toLocaleTimeString("fr")}.

  Une fois connecté, n'oubliez pas de réinitialiser votre mot de passe!

  Pour rapporter toute erreur, vous pouvez nous contacter sur la page du projet eThesaurus: https://github.com/Holusion/e-thesaurus
`.replace(/^ +/gm, ""),
})
