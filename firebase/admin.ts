import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdmin() {
    const apps = getApps();

    if (!apps.length) {
        let initialized = false;
        if (
            process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY
        ) {
            try {
                const rawKey = process.env.FIREBASE_PRIVATE_KEY;
                const formattedKey = rawKey
                    .replace(/\\\+/g, "+")
                    .replace(/\\n/g, "\n");

                initializeApp({
                    credential: cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: formattedKey,
                    }),
                });
                initialized = true;
            } catch (err) {
                console.warn("[Firebase Admin] Certificate init warning:", err);
            }
        }

        if (!initialized) {
            // Build-time / static page collection fallback
            initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
            });
        }
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
    };
}

export const { auth, db } = getFirebaseAdmin();
