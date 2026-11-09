from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="sozaku code API")

# Les prix sont définis ici, sur le serveur.
# Le navigateur ne peut pas les modifier.
OFFRES = {
    "html-css": {"label": "HTML / CSS", "prix": 2000},
    "javascript": {"label": "JavaScript", "prix": 1700},
    "python": {"label": "Python", "prix": 2500},
}

# Autorise le site à appeler ce serveur.
# Remplace l'adresse par celle de ton site une fois en ligne.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Commande(BaseModel):
    offre_id: str
    email: str


@app.get("/api/offres")
def lister_offres():
    return [
        {"id": id_, "label": offre["label"], "prix": offre["prix"]}
        for id_, offre in OFFRES.items()
    ]


@app.post("/api/commande")
def creer_commande(commande: Commande):
    offre = OFFRES.get(commande.offre_id)
    if offre is None:
        raise HTTPException(status_code=400, detail="Offre inconnue")

    # C'est ici que viendra l'appel à CMI,
    # avec le montant recalculé à partir de la liste ci-dessus.
    return {
        "offre": offre["label"],
        "montant": offre["prix"],
        "statut": "en_attente",
    }
