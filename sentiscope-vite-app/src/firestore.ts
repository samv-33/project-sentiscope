import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

interface UserData {
    uid: string
    name: string,
    email: string,
    plan: string
}

const addUserData = async (userData: UserData): Promise<void> =>{
    try{
        const docRef = await addDoc(collection(db, "users"), userData);
        console.log("User successfully added with ID:", docRef.id);

    } catch(error) {
        console.error("Error adding new user:", error)
        throw new Error("Error adding user to Firestore.");
    }

};

export { addUserData };
export type { UserData };
