// ============================================================
// 1. CONFIGURATION : devise, prix et paiement
//    Modifie uniquement ce bloc pour changer les tarifs.
//    Les prix sont indicatifs : ajuste-les selon ton expérience.
//    lienPaiement : laisse '' si l'offre se paie par virement.
// ============================================================
const DEVISE = 'MAD';

const OFFRES = [
  {
    id: 'html-css',
    label: 'HTML / CSS',
    description: "Création de pages et mise en forme d'un site web.",
    prix: 2000,
    // LIEN DE TEST Stripe : à remplacer par le lien en mode live avant la mise en ligne
    lienPaiement: 'https://buy.stripe.com/test_cNi9AL39t34w0cL09K0Jq00',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    description: 'Boutons, formulaires et comportements interactifs.',
    prix: 1700,
    lienPaiement: '',
  },
  {
    id: 'python',
    label: 'Python',
    description: 'Scripts et automatisation de tâches.',
    prix: 2500,
    lienPaiement: '',
  },
  {
    id: 'autre',
    label: 'Autre',
    description: 'Projet sur mesure. Le prix est défini après analyse.',
    prix: null, // null = sur devis, pas de paiement en ligne
    lienPaiement: '',
  },
];

// Texte affiché pour le prix : "1 500 MAD" ou "Sur devis"
function formaterPrix(offre) {
  if (offre.prix === null) {
    return 'Sur devis';
  }
  return `${offre.prix.toLocaleString('fr-FR')} ${DEVISE}`;
}

// ============================================================
// 2. MACHINE À ÉCRIRE DANS L'ACCUEIL
// ============================================================
const PHRASES = [
  'Sites web, scripts et automatisations.',
  'Tu décris, je code, tu reçois.',
  'HTML, CSS, JavaScript et Python.',
];

function machineAEcrire() {
  const cible = document.getElementById('typed');

  // Si l'utilisateur préfère moins d'animations, on affiche une seule phrase
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cible.textContent = PHRASES[0];
    return;
  }

  let numero = 0;
  let lettres = 0;
  let effacement = false;

  function etape() {
    const phrase = PHRASES[numero];
    cible.textContent = phrase.slice(0, lettres);
    let delai = effacement ? 35 : 70;

    if (!effacement && lettres === phrase.length) {
      // Phrase complète : pause avant de l'effacer
      delai = 1800;
      effacement = true;
    } else if (effacement && lettres === 0) {
      // Phrase effacée : on passe à la suivante
      effacement = false;
      numero = (numero + 1) % PHRASES.length;
      delai = 400;
    } else {
      lettres += effacement ? -1 : 1;
    }

    setTimeout(etape, delai);
  }

  etape();
}

// ============================================================
// 3. CHOIX DU TYPE DE CODE (boutons créés à partir de OFFRES)
//    Le bouton cliqué est mis en surbrillance et son type et son
//    montant sont copiés dans les champs cachés envoyés à Formspree.
// ============================================================
const zoneTypes = document.getElementById('zone-types');
const champType = document.getElementById('type-de-code');
const champMontant = document.getElementById('montant');
const erreurType = document.getElementById('erreur-type');

let offreChoisie = null;

OFFRES.forEach((offre) => {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'type-btn';
  bouton.dataset.id = offre.id;
  bouton.setAttribute('aria-pressed', 'false');

  const nom = document.createElement('strong');
  nom.textContent = offre.label;

  const prix = document.createElement('small');
  prix.textContent = formaterPrix(offre);

  bouton.append(nom, prix);
  bouton.addEventListener('click', () => choisirType(offre));
  zoneTypes.appendChild(bouton);
});

function choisirType(offre) {
  offreChoisie = offre;

  zoneTypes.querySelectorAll('.type-btn').forEach((bouton) => {
    bouton.setAttribute('aria-pressed', String(bouton.dataset.id === offre.id));
  });

  champType.value = offre.label;
  champMontant.value = formaterPrix(offre);
  erreurType.hidden = true;
}

function reinitialiserTypes() {
  offreChoisie = null;

  zoneTypes.querySelectorAll('.type-btn').forEach((bouton) => {
    bouton.setAttribute('aria-pressed', 'false');
  });

  champType.value = '';
  champMontant.value = '';
}

// ============================================================
// 4. TARIFS (cartes créées à partir de OFFRES)
// ============================================================
const zoneTarifs = document.getElementById('zone-tarifs');

OFFRES.forEach((offre) => {
  const carte = document.createElement('article');
  carte.className = 'card pricing-card';

  const titre = document.createElement('h3');
  titre.textContent = offre.label;

  const description = document.createElement('p');
  description.textContent = offre.description;

  const prix = document.createElement('p');
  prix.className = 'price';
  prix.textContent = formaterPrix(offre);

  // Le lien ouvre la section de demande et sélectionne cette offre
  const bouton = document.createElement('a');
  bouton.href = '#demande';
  bouton.className = 'btn btn-small';
  bouton.textContent = 'Choisir';
  bouton.addEventListener('click', () => choisirType(offre));

  carte.append(titre, description, prix, bouton);
  zoneTarifs.appendChild(carte);
});

// ============================================================
// 5. ENVOI DES FORMULAIRES VERS FORMSPREE (sans recharger la page)
// ============================================================
function afficherStatut(element, message, type) {
  element.textContent = message;
  element.className = `form-status ${type}`;
}

// Fonction commune à tous les formulaires du site
async function envoyerFormulaire(formulaire, bouton, statut, messageSucces) {
  const texteInitial = bouton.textContent;
  bouton.disabled = true;
  bouton.textContent = 'Envoi en cours...';
  afficherStatut(statut, '', '');

  try {
    const reponse = await fetch(formulaire.action, {
      method: 'POST',
      body: new FormData(formulaire),
      headers: { Accept: 'application/json' },
    });

    if (reponse.ok) {
      afficherStatut(statut, messageSucces, 'success');
      formulaire.reset();
      return true;
    }

    // Formspree renvoie la liste des problèmes (champ manquant, email invalide...)
    const donnees = await reponse.json().catch(() => ({}));
    const message = donnees.errors
      ? donnees.errors.map((erreur) => erreur.message).join(' ')
      : 'Une erreur est survenue. Réessaie dans un instant.';
    afficherStatut(statut, message, 'error');
    return false;
  } catch (erreur) {
    afficherStatut(statut, 'Envoi impossible pour le moment. Vérifie ta connexion internet et réessaie.', 'error');
    return false;
  } finally {
    bouton.disabled = false;
    bouton.textContent = texteInitial;
  }
}

// ============================================================
// 6. PAIEMENT : affiché après l'envoi réussi de la demande
// ============================================================
const zonePaiement = document.getElementById('zone-paiement');
const textePaiement = document.getElementById('texte-paiement');
const lienPaiement = document.getElementById('lien-paiement');

function afficherPaiement(offre) {
  zonePaiement.hidden = false;

  if (offre.prix === null) {
    textePaiement.textContent = 'Ce projet demande un devis. Je te recontacte par email pour définir le montant.';
    lienPaiement.hidden = true;
  } else if (offre.lienPaiement) {
    textePaiement.textContent = `Pour lancer ton projet, règle ${formaterPrix(offre)} avec le bouton ci-dessous.`;
    lienPaiement.href = offre.lienPaiement;
    lienPaiement.hidden = false;
  } else {
    textePaiement.textContent = `Pour lancer ton projet, le montant est de ${formaterPrix(offre)}. ${INSTRUCTIONS_PAIEMENT}`;
    lienPaiement.hidden = true;
  }

  zonePaiement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Formulaire de demande de projet
const formulaire = document.getElementById('formulaire');
const boutonEnvoi = document.getElementById('bouton-envoi');
const statut = document.getElementById('statut');

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();

  // Le type de code est obligatoire : on le vérifie avant d'envoyer
  if (!offreChoisie) {
    erreurType.hidden = false;
    return;
  }

  const offre = offreChoisie;
  const envoye = await envoyerFormulaire(
    formulaire,
    boutonEnvoi,
    statut,
    'Merci ! Ta demande est bien envoyée. Je te réponds par email très bientôt.'
  );

  if (envoye) {
    reinitialiserTypes();
    afficherPaiement(offre);
  }
});

// ============================================================
// 7. FORMULAIRE DE SIGNALEMENT DE PROBLÈME DE LIVRAISON
// ============================================================
const formulaireLivraison = document.getElementById('formulaire-livraison');
const boutonLivraison = document.getElementById('bouton-livraison');
const statutLivraison = document.getElementById('statut-livraison');

formulaireLivraison.addEventListener('submit', (evenement) => {
  evenement.preventDefault();

  envoyerFormulaire(
    formulaireLivraison,
    boutonLivraison,
    statutLivraison,
    'Merci ! Ton signalement est bien envoyé. Nous revenons vers toi par email.'
  );
});

// ============================================================
// 8. INITIALISATION
// ============================================================
machineAEcrire();
document.getElementById('annee').textContent = new Date().getFullYear();
