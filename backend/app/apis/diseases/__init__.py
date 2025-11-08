from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.libs.firebase import get_collection

router = APIRouter()

class Disease(BaseModel):
    id: str
    name: str
    description: str | None = None
    symptoms: str | None = None
    treatment: str | None = None
    affected_crops: list[str] | None = None

class DiseasesResponse(BaseModel):
    diseases: list[Disease]

@router.get("/diseases")
def get_diseases() -> DiseasesResponse:
    """
    Get all crop diseases from Firestore.
    """
    try:
        diseases_ref = get_collection("diseases")
        docs = diseases_ref.stream()
        
        diseases = []
        for doc in docs:
            data = doc.to_dict()
            diseases.append(
                Disease(
                    id=doc.id,
                    name=data.get("name", ""),
                    description=data.get("description"),
                    symptoms=data.get("symptoms"),
                    treatment=data.get("treatment"),
                    affected_crops=data.get("affected_crops"),
                )
            )
        
        # If no diseases found, return sample data
        if not diseases:
            print("No diseases found in Firestore, returning empty list")
            diseases = []
        
        return DiseasesResponse(diseases=diseases)
    except Exception as e:
        print(f"Error fetching diseases: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch diseases: {str(e)}")

@router.post("/diseases")
def add_disease(disease: Disease) -> dict:
    """
    Add a new disease to Firestore.
    """
    try:
        diseases_ref = get_collection("diseases")
        
        # Create disease data without ID
        disease_data = {
            "name": disease.name,
            "description": disease.description,
            "symptoms": disease.symptoms,
            "treatment": disease.treatment,
            "affected_crops": disease.affected_crops or [],
        }
        
        # Add to Firestore
        doc_ref = diseases_ref.add(disease_data)
        
        return {"success": True, "id": doc_ref[1].id, "message": "Disease added successfully"}
    except Exception as e:
        print(f"Error adding disease: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add disease: {str(e)}")
