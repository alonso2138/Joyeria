import { FilesetResolver, HandLandmarker, FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;

const getVision = async () => {
    return await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
};

export const initializeVision = async (type: 'hand' | 'face' | 'pose') => {
    const vision = await getVision();

    if (type === 'hand' && !handLandmarker) {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
    } else if (type === 'face' && !faceLandmarker) {
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO"
        });
    } else if (type === 'pose' && !poseLandmarker) {
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/1/pose_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO"
        });
    }
};

export const detectAndCrop = async (source: HTMLVideoElement | HTMLCanvasElement, category: string): Promise<{
    image: string,
    isCropped: boolean,
    orientation?: { pitch: number, yaw: number, roll: number, description: string }
} | null> => {
    const cat = category.toLowerCase();
    const isVideo = source instanceof HTMLVideoElement;

    // Hand categories
    if (['anillo', 'pulsera', 'reloj'].includes(cat)) {
        if (!handLandmarker) await initializeVision('hand');
        if (!handLandmarker) return null;

        const results = isVideo
            ? handLandmarker.detectForVideo(source, performance.now())
            : handLandmarker.detect(source);

        if (results.landmarks && results.landmarks.length > 0) {
            const orientation = calculateOrientation(results.landmarks[0]);
            const crop = cropFromLandmarks(source, results.landmarks[0], 0.15);
            return crop ? { ...crop, orientation } : null;
        }
    }
    // Head/Neck categories
    else if (['collar', 'pendiente'].includes(cat)) {
        if (!faceLandmarker) await initializeVision('face');
        if (!faceLandmarker) return null;

        const results = isVideo
            ? faceLandmarker.detectForVideo(source, performance.now())
            : faceLandmarker.detect(source);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];

            if (cat === 'pendiente') {
                // Focus on ears. Indices for ears:
                // Left side: 234, 127, 215 (lobe area)
                // Right side: 454, 356, 435 (lobe area)
                // We'll check which ear is more "visible" or just crop the face tighter
                const crop = cropFromLandmarks(source, landmarks, 0.1, 0.1);
                const orientation = calculateFaceOrientation(landmarks);
                return crop ? { ...crop, orientation } : null;
            }

            const crop = cropFromLandmarks(source, landmarks, 0.6, 0.2);
            return crop ? { ...crop } : null;
        }
    }
    // Body categories
    else if (['camiseta', 'camisa', 'bolso'].includes(cat)) {
        if (!poseLandmarker) await initializeVision('pose');
        if (!poseLandmarker) return null;

        const results = isVideo
            ? poseLandmarker.detectForVideo(source, performance.now())
            : poseLandmarker.detect(source);

        if (results.landmarks && results.landmarks.length > 0) {
            const crop = cropFromLandmarks(source, results.landmarks[0], 0.2); // Pose landmarks usually cover more area
            return crop ? { ...crop } : null;
        }
    }

    return null;
};

const calculateOrientation = (landmarks: any[]) => {
    // MediaPipe Hand Landmarks: 0: Wrist, 5: Index MCP, 17: Pinky MCP
    // Basic heuristics for orientation description
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    // Direction vector from wrist toward the knuckles (hand midline)
    const dx = indexMcp.x - wrist.x;
    const dy = indexMcp.y - wrist.y;
    const dz = indexMcp.z - wrist.z;

    // Angle in 2D plane
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI + 90; // Adjust so 0 is vertical

    // Yaw estimation (horizontal rotation) based on distance between knuckles
    const handWidthRaw = Math.sqrt(Math.pow(indexMcp.x - pinkyMcp.x, 2) + Math.pow(indexMcp.y - pinkyMcp.y, 2));
    // Normal hand width relative to its length (from wrist to index knuckle)
    const handLenRaw = Math.sqrt(Math.pow(indexMcp.x - wrist.x, 2) + Math.pow(indexMcp.y - wrist.y, 2));
    const ratio = handWidthRaw / handLenRaw;

    let yawDesc = "frontal";
    if (ratio < 0.45) yawDesc = pinkyMcp.x > indexMcp.x ? "rotated left (side profile)" : "rotated right (side profile)";

    let pitchDesc = dz > 0.05 ? "tilted towards camera" : (dz < -0.05 ? "tilted away from camera" : "flat");

    return {
        pitch: dz,
        yaw: ratio,
        roll: angleDeg,
        description: `Hand is ${yawDesc}, ${pitchDesc}, angled at ${Math.round(angleDeg)} degrees.`
    };
};

const calculateFaceOrientation = (landmarks: any[]) => {
    // MediaPipe Face Landmarks: 1: Nose tip, 33: Left eye outer, 263: Right eye outer
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Horizontal ratio to detect profile vs frontal
    const distL = Math.abs(nose.x - leftEye.x);
    const distR = Math.abs(nose.x - rightEye.x);

    let description = "frontal";
    if (distL < distR * 0.5) description = "looking right (left profile)";
    if (distR < distL * 0.5) description = "looking left (right profile)";

    return {
        pitch: nose.z,
        yaw: distL / distR,
        roll: 0,
        description: `Face is ${description}.`
    };
};

export const getFallbackCrop = (source: HTMLVideoElement | HTMLCanvasElement): { image: string, isCropped: boolean } => {
    // ... same as before
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { image: '', isCropped: false };
    const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    const cropW = sourceWidth * 0.6;
    const cropH = sourceHeight * 0.6;
    const cropX = (sourceWidth - cropW) / 2;
    const cropY = (sourceHeight - cropH) / 2;
    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return { image: canvas.toDataURL("image/jpeg", 0.9), isCropped: true };
};

const cropFromLandmarks = (source: HTMLVideoElement | HTMLCanvasElement, landmarks: any[], padding: number, extraBottomPadding: number = 0) => {
    // ... same as before
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    landmarks.forEach(lm => {
        if (lm.x < minX) minX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y > maxY) maxY = lm.y;
    });
    const width = maxX - minX;
    const height = maxY - minY;
    minX = Math.max(0, minX - (width * padding));
    minY = Math.max(0, minY - (height * padding));
    maxX = Math.min(1, maxX + (width * padding));
    maxY = Math.min(1, maxY + (height * (padding + extraBottomPadding)));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const widthVal = source instanceof HTMLVideoElement ? source.videoWidth : (source as HTMLCanvasElement).width;
    const heightVal = source instanceof HTMLVideoElement ? source.videoHeight : (source as HTMLCanvasElement).height;

    const cropX = minX * widthVal;
    const cropY = minY * heightVal;
    const cropW = (maxX - minX) * widthVal;
    const cropH = (maxY - minY) * heightVal;

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return { image: canvas.toDataURL("image/jpeg", 0.9), isCropped: true };
};
