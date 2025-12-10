import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function loadModel(modelPath: string): Promise<void> {
  if (session) return;

  ort.env.wasm.wasmPaths = '/volleyball-clipper/node_modules/onnxruntime-web/dist/';

  session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all'
  });
}

export async function runInference(
  inputTensor: Float32Array,
  inputSize: number = 640
): Promise<Float32Array> {
  if (!session) throw new Error('Model not loaded');

  const tensor = new ort.Tensor('float32', inputTensor, [1, 3, inputSize, inputSize]);

  const feeds = { images: tensor };
  const results = await session.run(feeds);

  const output = results.output0;
  return output.data as Float32Array;
}
