import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
// Model persistence path (Cloud Run writable /tmp)
const MODEL_DIR = "/tmp/rainbow_model";
const MODEL_PATH = `file://${path.join(MODEL_DIR, "model.json")}`;
// Lazy TensorFlow.js load
let tf = null;
let agent = null;

async function loadTF() {
  if (!tf) {
    console.log("Loading TensorFlow.js...");
    tf = await import("@tensorflow/tfjs-node");
    console.log("TensorFlow.js loaded");
  }
  return tf;
}

class RainbowAgent {
  constructor() {
    this.stateSize = 12;
    this.actionSize = 5; // 0-1: high priority buy, 2: medium, 3-4: skip/no trade
    this.atoms = 51;
    this.vMin = -100;
    this.vMax = 300;
    this.nStep = 3;
    this.gamma = 0.99;
    this.batchSize = 8; // Further reduced for quicker learning
    this.targetUpdateFreq = 50; // More frequent
    this.learningSteps = 0;
    this.memory = []; // Now { ..., priority: number }
    this.episodeBuffer = new Map();
    this.policyNet = null;
    this.targetNet = null;
    this.support = null;
    this.priorityAlpha = 0.6; // For prioritized replay
    this.priorityEpsilon = 0.01;
  }

  async init() {
    if (this.policyNet) return;
    const tf = await loadTF();
    class NoisyLinear extends tf.layers.Layer {
      constructor(units) {
        super({});
        this.units = units;
      }
      build(inputShape) {
        const inputDim = inputShape[inputShape.length - 1];
        const initStd = 0.5 / Math.sqrt(inputDim);
        this.muW = this.addWeight("muW", [inputDim, this.units], "float32", tf.initializers.randomNormal({ stddev: initStd }));
        this.sigmaW = this.addWeight("sigmaW", [inputDim, this.units], "float32", tf.initializers.constant(0.017));
        this.muB = this.addWeight("muB", [this.units], "float32", tf.initializers.constant(0));
        this.sigmaB = this.addWeight("sigmaB", [this.units], "float32", tf.initializers.constant(0.017));
      }
      f(x) {
        return tf.mul(tf.sign(x), tf.sqrt(tf.abs(x)));
      }
      call(inputs) {
        const epsilonI = this.f(tf.randomNormal([inputs.shape[inputs.shape.length - 1]]));
        const epsilonJ = this.f(tf.randomNormal([this.units]));
        const wNoise = tf.outerProduct(epsilonI, epsilonJ);
        const bNoise = epsilonJ;
        const w = tf.add(this.muW.read(), tf.mul(this.sigmaW.read(), wNoise));
        const b = tf.add(this.muB.read(), tf.mul(this.sigmaB.read(), bNoise));
        return tf.add(tf.matMul(inputs, w), b);
      }
      computeOutputShape(inputShape) {
        return [inputShape[0], this.units];
      }
      static className = "NoisyLinear";
    }
    tf.serialization.registerClass(NoisyLinear);
    this.support = tf.linspace(this.vMin, this.vMax, this.atoms);
    const input = tf.input({ shape: [this.stateSize] });
    let x = new NoisyLinear(512).apply(input);
    x = tf.layers.reLU().apply(x);
    x = new NoisyLinear(512).apply(x);
    x = tf.layers.reLU().apply(x);
    const value = new NoisyLinear(this.atoms).apply(x);
    const advantage = new NoisyLinear(this.actionSize * this.atoms).apply(x);
    const advantageReshaped = tf.layers.reshape({ targetShape: [this.actionSize, this.atoms] }).apply(advantage);
    const meanAdv = tf.mean(advantageReshaped, 1, true);
    const output = tf.add(value.expandDims(1), tf.sub(advantageReshaped, meanAdv));
    const model = tf.model({ inputs: input, outputs: output });
    model.compile({
      optimizer: tf.train.adam(0.00025), // Slightly higher LR for quicker learning
      loss: "categoricalCrossentropy"
    });
    this.policyNet = model;
    try {
      if (fs.existsSync(MODEL_DIR)) {
        this.policyNet = await tf.loadLayersModel(MODEL_PATH);
        console.log("Loaded saved Rainbow model from disk");
      }
    } catch (err) {
      console.log("No saved model found or failed to load - starting fresh");
    }
    const json = this.policyNet.toJSON();
    this.targetNet = await tf.models.modelFromJSON(json);
    this.targetNet.setWeights(this.policyNet.getWeights());
    console.log("Rainbow DQN Agent initialized and ready");
  }

  async act(state) {
    await this.init();
    const stateTensor = tf.tensor2d([state]);
    const dist = this.policyNet.predict(stateTensor, { batchSize: 1 });
    const qValues = dist.mul(this.support).sum(2);
    const action = qValues.argMax(1).dataSync()[0];
    tf.dispose([stateTensor, dist, qValues]);
    return action;
  }

  rememberTransition(symbol, state, action, reward, nextState, done) {
    const transition = { symbol, state, action, reward, nextState, done, priority: Math.pow(Math.abs(reward) + this.priorityEpsilon, this.priorityAlpha) };
    if (!this.episodeBuffer.has(symbol)) this.episodeBuffer.set(symbol, []);
    const buffer = this.episodeBuffer.get(symbol);
    buffer.push(transition);
    if (done || buffer.length >= this.nStep) {
      let nStepReward = 0;
      let gammaPower = 1;
      for (let i = buffer.length - this.nStep; i < buffer.length; i++) {
        if (i >= 0) {
          nStepReward += gammaPower * buffer[i].reward;
          gammaPower *= this.gamma;
        }
      }
      if (!done) nStepReward += gammaPower * buffer[buffer.length - 1].reward;
      const nStepTrans = {
        state: buffer[0].state,
        action: buffer[0].action,
        reward: nStepReward,
        nextState: buffer[buffer.length - 1].nextState,
        done,
        priority: Math.pow(Math.abs(nStepReward) + this.priorityEpsilon, this.priorityAlpha)
      };
      this.memory.push(nStepTrans);
      if (buffer.length > this.nStep) buffer.shift();
    }
    if (this.memory.length > 20000) this.memory.shift();
  }

  async replay() {
    if (!this.policyNet || this.memory.length < this.batchSize) return;
    // Prioritized sampling
    const priorities = this.memory.map(t => t.priority);
    const totalPriority = priorities.reduce((a, b) => a + b, 0);
    const probs = priorities.map(p => p / totalPriority);
    const batchIndices = [];
    for (let b = 0; b < this.batchSize; b++) {
      let rand = Math.random();
      let idx = 0;
      while (rand > 0 && idx < this.memory.length) {
        rand -= probs[idx];
        idx++;
      }
      batchIndices.push(Math.min(idx, this.memory.length - 1));
    }
    const batch = batchIndices.map(i => this.memory[i]);
    const states = tf.tensor2d(batch.map(t => t.state));
    const nextStates = tf.tensor2d(batch.map(t => t.nextState));
    const policyDist = this.policyNet.predict(states);
    const targetNextDist = this.targetNet.predict(nextStates);
    const nextQ = targetNextDist.mul(this.support).sum(2);
    const bestActions = nextQ.argMax(1);
    const targets = policyDist.arraySync();
    const bestNextArray = bestActions.dataSync();
    batch.forEach((t, i) => {
      let targetReward = t.reward;
      if (!t.done) {
        const nextMaxQ = nextQ.arraySync()[i][bestNextArray[i]];
        targetReward += Math.pow(this.gamma, this.nStep) * nextMaxQ;
      }
      targets[i][t.action] = targetReward;
    });
    await this.policyNet.fit(states, tf.tensor3d(targets), {
      batchSize: this.batchSize,
      epochs: 1,
      verbose: 0
    });
    tf.dispose([states, nextStates, policyDist, targetNextDist, nextQ, bestActions]);
    this.learningSteps++;
    if (this.learningSteps % this.targetUpdateFreq === 0) {
      this.targetNet.setWeights(this.policyNet.getWeights());
      console.log(`Target network updated at step ${this.learningSteps}`);
    }
    if (this.learningSteps % 50 === 0) {
      try {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        await this.policyNet.save(MODEL_PATH);
        console.log(`Model saved at step ${this.learningSteps}`);
      } catch (err) {
        console.log("Failed to save model:", err.message);
      }
    }
  }
}

async function getAgent() {
  if (!agent) {
    agent = new RainbowAgent();
    await agent.init();
  }
  return agent;
}

app.get("/health", (_, res) => res.send("OK"));

app.get("/", async (req, res) => {
  try {
    const a = await getAgent();
    res.json({
      status: "Rainbow DQN ML Service Live",
      steps: a.learningSteps,
      memorySize: a.memory.length,
      modelReady: !!a.policyNet,
      saved: fs.existsSync(MODEL_DIR)
    });
  } catch (err) {
    res.status(503).json({ status: "Initializing..." });
  }
});

app.post("/observe", async (req, res) => {
  try {
    const { symbol, state } = req.body;
    if (!Array.isArray(state) || state.length !== 12) {
      return res.status(400).json({ error: "Invalid state: must be array of 12 numbers" });
    }
    const a = await getAgent();
    const action = await a.act(state);
    const priority = action <= 1;
    res.json({ success: true, action, priority, symbol });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/outcome", async (req, res) => {
  try {
    const { symbol, reward, lastState, lastAction, done = true } = req.body;
    if (typeof reward !== "number" || !Array.isArray(lastState) || lastState.length !== 12) {
      return res.status(400).json({ error: "Invalid reward or state" });
    }
    const a = await getAgent();
    const nextState = new Array(12).fill(0.5);
    a.rememberTransition(symbol || "unknown", lastState, lastAction ?? 0, reward, nextState, done);
    // Optimized: Always 3 replays, +2 extra if negative reward (learn more from losses/traps)
    await a.replay();
    await a.replay();
    await a.replay();
    if (reward < 0) {
      await a.replay();
      await a.replay();
    }
    res.json({ success: true, learned: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Rainbow DQN ML Service LIVE on port ${PORT}`);
  await getAgent();
});
