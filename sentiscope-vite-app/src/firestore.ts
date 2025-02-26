import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

interface UserData {
    name: string,
    email: string,
    plan: string
}

const addUserData = async (userData: UserData): Promise<void> =>{
    try{
        await addDoc(collection(db, "users"), userData);
        console.log("User successfully added");

    } catch(error) {
        console.error("Error addinguser:", error);
    }

};

export { addUserData };