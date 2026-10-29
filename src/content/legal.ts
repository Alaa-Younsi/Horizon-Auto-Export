import type { Lang } from "@/i18n/languages";

/**
 * Privacy policy + terms, per language. A sound GDPR baseline written for how
 * this site actually works (one inquiry form, no analytics, no tracking cookies,
 * language kept in the URL + localStorage). Have the client's lawyer review it
 * before launch — see the go-live checklist in README.md.
 *
 * {company}, {vat}, {email}, {address} are filled from site settings at render.
 */
export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
}

const UPDATED = "2026-10-29";

export const LEGAL: Record<Lang, { privacy: LegalDoc; terms: LegalDoc }> = {
  ro: {
    privacy: {
      title: "Politica de confidențialitate",
      updated: UPDATED,
      intro:
        "Această politică explică ce date personale colectează {company} prin acest site, de ce le folosim și ce drepturi aveți, conform Regulamentului (UE) 2016/679 (GDPR).",
      sections: [
        {
          heading: "1. Operatorul de date",
          body: [
            "Operatorul este {company}, CUI {vat}, cu sediul în {address}. Ne puteți contacta pentru orice întrebare privind datele personale la {email}.",
          ],
        },
        {
          heading: "2. Ce date colectăm",
          body: [
            "Prin formularul de cerere: numele, compania (opțional), adresa de e-mail, telefonul (opțional), țara (opțional), mesajul și, după caz, vehiculul pentru care ne contactați.",
            "Nu folosim instrumente de analiză, pixeli publicitari sau cookie-uri de urmărire. Limba aleasă este păstrată în adresa paginii și în memoria locală a browserului (localStorage), strict pentru funcționarea site-ului.",
          ],
        },
        {
          heading: "3. Scopul și temeiul prelucrării",
          body: [
            "Folosim datele exclusiv pentru a vă răspunde la cerere și pentru a pregăti o eventuală ofertă sau un contract (art. 6 alin. 1 lit. b GDPR — demersuri precontractuale), pe baza acordului pe care îl exprimați în formular (art. 6 alin. 1 lit. a).",
          ],
        },
        {
          heading: "4. Cât timp păstrăm datele",
          body: [
            "Cererile care nu se finalizează printr-un contract se păstrează cel mult 24 de luni, apoi se șterg. Datele legate de un contract se păstrează pe durata impusă de legislația fiscală și contabilă.",
          ],
        },
        {
          heading: "5. Cui transmitem datele",
          body: [
            "Nu vindem și nu închiriem datele. Ele sunt găzduite la furnizori care acționează ca persoane împuternicite, cu garanții contractuale: Supabase (bază de date, UE), Vercel (găzduirea site-ului) și, pentru notificările interne prin e-mail, Resend. Transferurile în afara SEE, dacă au loc, se fac pe baza clauzelor contractuale standard ale Comisiei Europene.",
          ],
        },
        {
          heading: "6. Drepturile dumneavoastră",
          body: [
            "Aveți dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a vă retrage oricând acordul, fără a afecta legalitatea prelucrării anterioare. Scrieți-ne la {email}.",
            "Aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), www.dataprotection.ro.",
          ],
        },
        {
          heading: "7. Securitate",
          body: [
            "Datele sunt transmise criptat (HTTPS) și accesibile doar personalului autorizat, cu acces limitat la secțiunile necesare fiecărei persoane.",
          ],
        },
      ],
    },
    terms: {
      title: "Termeni și condiții",
      updated: UPDATED,
      intro:
        "Acești termeni se aplică utilizării site-ului {company}. Prin folosirea site-ului, acceptați termenii de mai jos.",
      sections: [
        {
          heading: "1. Informații despre vehicule",
          body: [
            "Anunțurile au caracter informativ și nu constituie o ofertă fermă. Specificațiile, dotările, kilometrajul și prețurile pot conține erori și pot fi modificate fără notificare. Disponibilitatea unui vehicul se confirmă doar în scris.",
            "Pentru vehiculele avariate, descrierea daunelor este orientativă; recomandăm inspecția înainte de achiziție.",
          ],
        },
        {
          heading: "2. Clienți profesioniști",
          body: [
            "Serviciile noastre se adresează în principal persoanelor juridice (B2B). Condițiile comerciale, inclusiv prețul, TVA-ul, plata și livrarea, se stabilesc prin ofertă scrisă și contract.",
          ],
        },
        {
          heading: "3. Prețuri",
          body: [
            "Prețurile afișate sunt exprimate în moneda indicată. Mențiunea „TVA deductibil” se referă la regimul fiscal al vehiculului; regimul final se confirmă pe factură.",
          ],
        },
        {
          heading: "4. Proprietate intelectuală",
          body: [
            "Conținutul site-ului (texte, fotografii, logo) aparține {company} sau partenerilor săi. Mărcile auto afișate aparțin proprietarilor lor și sunt menționate doar pentru a indica mărcile comercializate.",
          ],
        },
        {
          heading: "5. Răspundere",
          body: [
            "Depunem toate eforturile pentru ca informațiile să fie corecte și actuale, dar nu putem garanta absența oricărei erori. Site-ul poate conține linkuri către site-uri terțe, pentru care nu răspundem.",
          ],
        },
        {
          heading: "6. Legea aplicabilă",
          body: [
            "Acești termeni sunt guvernați de legea română. Orice litigiu se soluționează pe cale amiabilă sau, în lipsa unei înțelegeri, de instanțele competente din București.",
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy policy",
      updated: UPDATED,
      intro:
        "This policy explains which personal data {company} collects through this website, why we use it and what your rights are under Regulation (EU) 2016/679 (GDPR).",
      sections: [
        {
          heading: "1. Data controller",
          body: [
            "The controller is {company}, VAT ID {vat}, registered in {address}. For any question about personal data, contact us at {email}.",
          ],
        },
        {
          heading: "2. What we collect",
          body: [
            "Through the inquiry form: your name, company (optional), e-mail address, phone (optional), country (optional), your message and, where relevant, the vehicle you are asking about.",
            "We use no analytics, no advertising pixels and no tracking cookies. Your chosen language is kept in the page address and in your browser's local storage, strictly so the site works.",
          ],
        },
        {
          heading: "3. Purpose and legal basis",
          body: [
            "We use the data only to answer your request and to prepare a possible offer or contract (Art. 6(1)(b) GDPR — pre-contractual steps), based on the consent you give in the form (Art. 6(1)(a)).",
          ],
        },
        {
          heading: "4. How long we keep it",
          body: [
            "Requests that do not lead to a contract are kept for at most 24 months and then deleted. Data linked to a contract is kept for the period required by tax and accounting law.",
          ],
        },
        {
          heading: "5. Who receives it",
          body: [
            "We never sell or rent your data. It is hosted by processors bound by contractual safeguards: Supabase (database, EU), Vercel (website hosting) and, for internal e-mail notifications, Resend. Any transfer outside the EEA relies on the European Commission's standard contractual clauses.",
          ],
        },
        {
          heading: "6. Your rights",
          body: [
            "You have the right of access, rectification, erasure, restriction, portability and objection, and you may withdraw your consent at any time without affecting earlier processing. Write to us at {email}.",
            "You may lodge a complaint with the Romanian data protection authority (ANSPDCP), www.dataprotection.ro, or with the authority of your EU country of residence.",
          ],
        },
        {
          heading: "7. Security",
          body: [
            "Data is transmitted encrypted (HTTPS) and is accessible only to authorised staff, each limited to the sections they need.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms and conditions",
      updated: UPDATED,
      intro:
        "These terms apply to the use of the {company} website. By using the site you accept them.",
      sections: [
        {
          heading: "1. Vehicle information",
          body: [
            "Listings are for information only and are not a binding offer. Specifications, equipment, mileage and prices may contain errors and may change without notice. A vehicle's availability is confirmed in writing only.",
            "For damaged vehicles the damage description is indicative; we recommend an inspection before purchase.",
          ],
        },
        {
          heading: "2. Professional customers",
          body: [
            "Our services are aimed mainly at businesses (B2B). Commercial terms — price, VAT, payment and delivery — are set out in a written offer and contract.",
          ],
        },
        {
          heading: "3. Prices",
          body: [
            'Prices are shown in the stated currency. "VAT deductible" refers to the vehicle\'s tax regime; the final regime is confirmed on the invoice.',
          ],
        },
        {
          heading: "4. Intellectual property",
          body: [
            "Site content (texts, photos, logo) belongs to {company} or its partners. Car makes shown are trademarks of their owners and appear only to indicate the makes we trade.",
          ],
        },
        {
          heading: "5. Liability",
          body: [
            "We make every effort to keep information accurate and up to date but cannot guarantee it is free of errors. The site may link to third-party sites, for which we are not responsible.",
          ],
        },
        {
          heading: "6. Governing law",
          body: [
            "These terms are governed by Romanian law. Disputes are settled amicably or, failing that, by the competent courts of Bucharest.",
          ],
        },
      ],
    },
  },
  fr: {
    privacy: {
      title: "Politique de confidentialité",
      updated: UPDATED,
      intro:
        "Cette politique explique quelles données personnelles {company} collecte via ce site, pourquoi nous les utilisons et quels sont vos droits au titre du Règlement (UE) 2016/679 (RGPD).",
      sections: [
        {
          heading: "1. Responsable du traitement",
          body: [
            "Le responsable est {company}, n° TVA {vat}, dont le siège est à {address}. Pour toute question relative à vos données, écrivez-nous à {email}.",
          ],
        },
        {
          heading: "2. Données collectées",
          body: [
            "Via le formulaire de demande : nom, société (facultatif), adresse e-mail, téléphone (facultatif), pays (facultatif), votre message et, le cas échéant, le véhicule concerné.",
            "Nous n'utilisons ni outil d'analyse, ni pixel publicitaire, ni cookie de suivi. La langue choisie est conservée dans l'adresse de la page et dans le stockage local du navigateur, uniquement pour le fonctionnement du site.",
          ],
        },
        {
          heading: "3. Finalité et base légale",
          body: [
            "Nous utilisons ces données uniquement pour répondre à votre demande et préparer une éventuelle offre ou un contrat (art. 6.1.b RGPD — mesures précontractuelles), sur la base du consentement donné dans le formulaire (art. 6.1.a).",
          ],
        },
        {
          heading: "4. Durée de conservation",
          body: [
            "Les demandes qui n'aboutissent pas à un contrat sont conservées 24 mois au plus, puis supprimées. Les données liées à un contrat sont conservées pendant la durée imposée par la législation fiscale et comptable.",
          ],
        },
        {
          heading: "5. Destinataires",
          body: [
            "Nous ne vendons ni ne louons vos données. Elles sont hébergées par des sous-traitants liés par des garanties contractuelles : Supabase (base de données, UE), Vercel (hébergement du site) et, pour les notifications internes par e-mail, Resend. Tout transfert hors EEE repose sur les clauses contractuelles types de la Commission européenne.",
          ],
        },
        {
          heading: "6. Vos droits",
          body: [
            "Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition, et pouvez retirer votre consentement à tout moment sans affecter les traitements antérieurs. Écrivez-nous à {email}.",
            "Vous pouvez introduire une réclamation auprès de l'autorité roumaine (ANSPDCP), www.dataprotection.ro, ou de l'autorité de votre pays de résidence dans l'UE (en France : la CNIL).",
          ],
        },
        {
          heading: "7. Sécurité",
          body: [
            "Les données sont transmises de façon chiffrée (HTTPS) et ne sont accessibles qu'au personnel autorisé, chacun limité aux sections nécessaires.",
          ],
        },
      ],
    },
    terms: {
      title: "Conditions générales",
      updated: UPDATED,
      intro:
        "Ces conditions s'appliquent à l'utilisation du site de {company}. En utilisant le site, vous les acceptez.",
      sections: [
        {
          heading: "1. Informations sur les véhicules",
          body: [
            "Les annonces sont fournies à titre informatif et ne constituent pas une offre ferme. Caractéristiques, équipements, kilométrage et prix peuvent comporter des erreurs et évoluer sans préavis. La disponibilité d'un véhicule n'est confirmée que par écrit.",
            "Pour les véhicules accidentés, la description des dommages est indicative ; nous recommandons une inspection avant l'achat.",
          ],
        },
        {
          heading: "2. Clientèle professionnelle",
          body: [
            "Nos services s'adressent principalement aux entreprises (B2B). Les conditions commerciales — prix, TVA, paiement et livraison — sont fixées par offre écrite et contrat.",
          ],
        },
        {
          heading: "3. Prix",
          body: [
            "Les prix sont exprimés dans la devise indiquée. La mention « TVA récupérable » se rapporte au régime fiscal du véhicule ; le régime définitif est confirmé sur la facture.",
          ],
        },
        {
          heading: "4. Propriété intellectuelle",
          body: [
            "Le contenu du site (textes, photos, logo) appartient à {company} ou à ses partenaires. Les marques automobiles affichées appartiennent à leurs titulaires et ne servent qu'à indiquer les marques commercialisées.",
          ],
        },
        {
          heading: "5. Responsabilité",
          body: [
            "Nous veillons à l'exactitude et à l'actualité des informations sans pouvoir garantir l'absence de toute erreur. Le site peut contenir des liens vers des sites tiers, dont nous ne sommes pas responsables.",
          ],
        },
        {
          heading: "6. Droit applicable",
          body: [
            "Ces conditions sont régies par le droit roumain. Tout litige est réglé à l'amiable ou, à défaut, par les tribunaux compétents de Bucarest.",
          ],
        },
      ],
    },
  },
};
