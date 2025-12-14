import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';

let model = null;

export const loadModel = async () => {
    try {
        console.log("Loading MobileNet model...");
        model = await mobilenet.load();
        console.log("Model loaded successfully.");
        return true;
    } catch (error) {
        console.error("Failed to load model:", error);
        return false;
    }
};

export const identifyImage = async (imageElement) => {
    if (!model) {
        const success = await loadModel();
        if (!success) return "I can't see right now.";
    }

    try {
        const predictions = await model.classify(imageElement);
        if (predictions && predictions.length > 0) {
            // Return the top prediction
            return predictions[0].className;
        } else {
            return "I'm not sure what that is.";
        }
    } catch (error) {
        console.error("Prediction error:", error);
        return "I had trouble identifying that.";
    }
};
