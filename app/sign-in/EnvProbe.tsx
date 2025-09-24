"use client";

export default function EnvProbe() {
  const mask = (v?: string) => (v ? v.slice(0,4) + "•••" : "undefined");
  
  console.log("[ENV PROBE] apiKey:", mask(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));
  console.log("[ENV PROBE] authDomain:", mask(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN));
  console.log("[ENV PROBE] projectId:", mask(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
  console.log("[ENV PROBE] storageBucket:", mask(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET));
  console.log("[ENV PROBE] senderId:", mask(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID));
  console.log("[ENV PROBE] appId:", mask(process.env.NEXT_PUBLIC_FIREBASE_APP_ID));
  
  return null;
}
