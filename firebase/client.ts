// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyDHRtapVvxfDlFBuuhJk-2wIvQshjjf7VU",
    authDomain: "prepwise-933c3.firebaseapp.com",
    projectId: "prepwise-933c3",
    storageBucket: "prepwise-933c3.appspot.com",
    messagingSenderId: "251292335061",
    appId: "1:251292335061:web:616b84207e1bfa06db1b5c",
    measurementId: "G-GWNEEDPME7"
};


// Initialize Firebase
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
