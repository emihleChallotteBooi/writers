import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

 export async function uploadAuthorPosts(authorKey) {

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".md";

    fileInput.onchange = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const markdown = await file.text();

        await addDoc(collection(db, "posts"), {
            authorKey,
            filename: file.name,
            markdown,
            createdAt: serverTimestamp()
        });

        console.log("Upload complete");
    };

    fileInput.click();
}