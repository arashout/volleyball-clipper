import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;
let currentModelPath: string | null = null;
let isLoading = false;

async function createSession(modelPath: string): Promise<ort.InferenceSession> {
  ort.env.wasm.wasmPaths = '/volleyball-annotator/node_modules/onnxruntime-web/dist/';
  return ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all'
  });
}

export async function loadModel(modelPath: string): Promise<void> {
  if (session && currentModelPath === modelPath) return;
  if (isLoading) return;

  isLoading = true;
  try {
    session = await createSession(modelPath);
    currentModelPath = modelPath;
  } finally {
    isLoading = false;
  }
}

export async function runInference(
  inputTensor: Float32Array,
  inputSize: number = 640
): Promise<Float32Array> {
  if (!session || !currentModelPath) throw new Error('Model not loaded');

  const tensor = new ort.Tensor('float32', inputTensor, [1, 3, inputSize, inputSize]);
  const feeds = { images: tensor };

  try {
    const results = await session.run(feeds);
    const output = results.output0;
    return output.data as Float32Array;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Session')) {
      session = await createSession(currentModelPath);
      const results = await session.run(feeds);
      const output = results.output0;
      return output.data as Float32Array;
    }
    throw error;
  }
}
