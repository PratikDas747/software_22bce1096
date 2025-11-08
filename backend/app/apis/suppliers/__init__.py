from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.libs.firebase import get_collection

router = APIRouter()

class Supplier(BaseModel):
    id: str
    name: str
    location: str | None = None
    contact: str | None = None

class SuppliersResponse(BaseModel):
    suppliers: list[Supplier]

@router.get("/suppliers")
def get_suppliers() -> SuppliersResponse:
    """
    Get all seed suppliers from Firestore.
    """
    try:
        suppliers_ref = get_collection("suppliers")
        docs = suppliers_ref.stream()
        
        suppliers = []
        for doc in docs:
            data = doc.to_dict()
            suppliers.append(
                Supplier(
                    id=doc.id,
                    name=data.get("name", ""),
                    location=data.get("location"),
                    contact=data.get("contact"),
                )
            )
        
        # If no suppliers found, return empty list
        if not suppliers:
            print("No suppliers found in Firestore, returning empty list")
            suppliers = []
        
        return SuppliersResponse(suppliers=suppliers)
    except Exception as e:
        print(f"Error fetching suppliers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch suppliers: {str(e)}")

@router.post("/suppliers")
def add_supplier(supplier: Supplier) -> dict:
    """
    Add a new supplier to Firestore.
    """
    try:
        suppliers_ref = get_collection("suppliers")
        
        # Create supplier data without ID
        supplier_data = {
            "name": supplier.name,
            "location": supplier.location,
            "contact": supplier.contact,
        }
        
        # Add to Firestore
        doc_ref = suppliers_ref.add(supplier_data)
        
        return {"success": True, "id": doc_ref[1].id, "message": "Supplier added successfully"}
    except Exception as e:
        print(f"Error adding supplier: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add supplier: {str(e)}")
