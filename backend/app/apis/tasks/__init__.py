from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.libs.firebase import get_firestore_client
import datetime

router = APIRouter()

class Task(BaseModel):
    id: str
    title: str
    scheduled_time: str
    completed: bool = False
    created_at: str

class TaskCreate(BaseModel):
    title: str
    scheduled_time: str

class TasksResponse(BaseModel):
    tasks: list[Task]

class TaskResponse(BaseModel):
    task: Task

@router.get("/tasks")
def get_tasks() -> TasksResponse:
    """Get all tasks from Firebase Firestore"""
    try:
        db = get_firestore_client()
        tasks_ref = db.collection('tasks')
        docs = tasks_ref.order_by('created_at', direction='DESCENDING').stream()
        
        tasks = []
        for doc in docs:
            data = doc.to_dict()
            tasks.append(Task(
                id=doc.id,
                title=data.get('title', ''),
                scheduled_time=data.get('scheduled_time', ''),
                completed=data.get('completed', False),
                created_at=data.get('created_at', '')
            ))
        
        return TasksResponse(tasks=tasks)
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return TasksResponse(tasks=[])

@router.post("/tasks")
def add_task(task: TaskCreate) -> TaskResponse:
    """Add a new task to Firebase Firestore"""
    try:
        db = get_firestore_client()
        tasks_ref = db.collection('tasks')
        
        # Create task data
        task_data = {
            'title': task.title,
            'scheduled_time': task.scheduled_time,
            'completed': False,
            'created_at': datetime.datetime.now().isoformat()
        }
        
        # Add to Firestore
        doc_ref = tasks_ref.add(task_data)
        doc_id = doc_ref[1].id
        
        # Return the created task
        created_task = Task(
            id=doc_id,
            title=task_data['title'],
            scheduled_time=task_data['scheduled_time'],
            completed=task_data['completed'],
            created_at=task_data['created_at']
        )
        
        return TaskResponse(task=created_task)
    except Exception as e:
        print(f"Error adding task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tasks/{task_id}")
def delete_task(task_id: str) -> dict:
    """Delete a task from Firebase Firestore"""
    try:
        db = get_firestore_client()
        db.collection('tasks').document(task_id).delete()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        print(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/tasks/{task_id}/toggle")
def toggle_task(task_id: str) -> TaskResponse:
    """Toggle task completion status"""
    try:
        db = get_firestore_client()
        task_ref = db.collection('tasks').document(task_id)
        task_doc = task_ref.get()
        
        if not task_doc.exists:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task_data = task_doc.to_dict()
        new_completed = not task_data.get('completed', False)
        
        # Update in Firestore
        task_ref.update({'completed': new_completed})
        
        # Return updated task
        updated_task = Task(
            id=task_id,
            title=task_data['title'],
            scheduled_time=task_data['scheduled_time'],
            completed=new_completed,
            created_at=task_data['created_at']
        )
        
        return TaskResponse(task=updated_task)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling task: {e}")
        raise HTTPException(status_code=500, detail=str(e))
