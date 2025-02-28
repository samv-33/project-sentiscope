from firestore_config import db

class User:
    def __init__(self, name, email, plan):
        self.name = name
        self.email = email
        self.plan = plan


    def add_user(self):
        user_ref, doc_id = db.collection("users").add({
            "name": self.name,
            "email": self.email,
            "plan": self.plan
        })
        return user_ref
    
    
    


