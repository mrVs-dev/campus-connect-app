// This file is a bit of a workaround to make sure that the client-side
// Firebase auth object is available in other client-side components.
// We are re-exporting it from the firebase-client.ts file.
// This is necessary to avoid "Text content does not match server-rendered HTML"
// errors.
import { auth } from './firebase-client';
export { auth };
