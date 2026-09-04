---
title: Learning Roadmap — Training and Post-Training Small & Large AI Models
tags: [llm, training, post-training, small-models, distillation, roadmap]
---

# Learning Roadmap: Training and Post-Training Small & Large AI Models

Practical learning and project roadmap for small and large model training, post-training, deployment, and use cases.

## Objective

The goal is to learn AI model development in the following order:

1. Train a small model from scratch
2. Post-train a small pretrained model
3. Deploy small models
4. Post-train larger models
5. Distill large-model capabilities back into smaller models

This progression matters because it teaches both the science of how models learn and the engineering required to make useful AI products.

## 0. Foundations

Before model training, become reasonably comfortable with:

- Python
- PyTorch
- Transformers
- Hugging Face
- Git/GitHub
- Linux/Bash
- JSON/JSONL
- APIs and cURL
- Basic GPU concepts
- Training/validation/test datasets

You do not need to master all of these before starting. Learn them while building.

## 1. Train a Small Model From Scratch

### Goal

Build a small transformer yourself and watch it learn language from raw data.

This is pretraining.

The model begins with random weights:

Random weights → data → next-token prediction → loss → gradient descent → useful language model

This is the best way to understand what an LLM actually is.

### Recommended First Dataset: TinyStories

TinyStories contains simple synthetic stories using relatively limited vocabulary and was specifically created to study very small language models.

Resource: [TinyStories dataset on Hugging Face](https://huggingface.co/datasets/roneneldan/TinyStories)

### Step 1 — Load the Dataset

Start with TinyStories.

Then later experiment with:

- Mathematical text
- Python/code datasets
- Conversations
- Domain-specific documents
- Mixed datasets

The dataset determines what the model has an opportunity to learn.

### Step 2 — Build or Train a Tokenizer

The tokenizer converts:

“The cat sat outside.”

into something similar to:

`[412, 931, 720, 1842, 13]`

Learn:

- Vocabulary size
- BPE/tokenization
- Special tokens
- Sequence length
- Token frequency

### Step 3 — Build a Tiny Transformer

Start around:

10M–100M parameters

Learn the pieces:

- Token embeddings
- Positional information
- Self-attention
- Attention heads
- MLP/feed-forward layers
- Layer normalization
- Residual connections
- Output projection

Do not worry about producing a competitive model.

The point is understanding what every component does.

### Step 4 — Pretrain It

The training task is essentially:

Given everything before this token, predict what comes next.

Example:

The dog ran into the ___

The model might initially predict nonsense.

After enough training, “garden” becomes much more probable.

Measure:

- Training loss
- Validation loss
- Tokens processed
- Learning rate
- Gradient norm
- Checkpoint performance

### Step 5 — Generate Text During Training

Do not only watch loss.

Periodically ask the model:

Once upon a time…

Compare generations at:

- Step 0
- Step 1,000
- Step 10,000
- Step 50,000
- Final checkpoint

Watching the generations improve makes the learning process intuitive.

### Step 6 — Evaluate

Evaluation should become a habit immediately.

Compare:

Checkpoint A vs B vs C

Look at:

- Validation loss
- Completion quality
- Repetition
- Coherence
- Memorization
- Task accuracy

A useful evaluation framework later is EleutherAI’s LM Evaluation Harness, which supports many standard language-model benchmarks and custom evaluations.

Resource: [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness)

### Best First Project

Build:

TinyStories → tokenizer → 20M–50M transformer → pretrain → evaluate → generate stories

Once that works, repeat the experiment with another dataset.

#### Experiment A — Stories

Teaches:

- Grammar
- Basic language
- Narrative structure

#### Experiment B — Mathematics

Teaches:

- Structured reasoning patterns
- Symbol manipulation
- Numerical relationships

#### Experiment C — Code

Teaches:

- Programming syntax
- Repeated structure
- Functions
- Logical relationships

Then compare how the same architecture behaves when trained on different data.

### A Useful Reference Implementation

Andrej Karpathy’s nanochat is particularly useful because it covers tokenization, pretraining, fine-tuning, evaluation, inference and chat in a relatively small experimental codebase.

Resource: [Karpathy nanochat](https://github.com/karpathy/nanochat)

Study it after building at least one very small implementation yourself.

## Why Small Models Matter

Small models are not merely cheaper versions of large models.

They enable entirely different products.

A sufficiently small model can potentially live inside the application itself.

Instead of:

Phone → Internet → Cloud GPU → Model → Internet → Phone

you can have:

Phone → Local model → Answer

That changes the product.

## Small-Model Use Cases

### 1. Offline AI Assistants

Imagine an AI assistant bundled directly with an app.

It could continue working:

- On airplanes
- Underground
- At sea
- In rural locations
- During internet outages
- In countries with unreliable connectivity

No cloud request is required.

### 2. Private AI

Local inference means sensitive information may not need to leave the device.

Possible applications include:

- Private diary analysis
- Document summarization
- Personal search
- Local email classification
- Meeting-note organization
- Personal knowledge bases
- Offline translation

Apple’s Core ML, for example, supports running models directly on-device and notes that local execution removes the requirement for a network connection while helping preserve privacy and responsiveness.

Resource: [Apple Core ML](https://developer.apple.com/documentation/coreml)

### 3. Health and Medical Applications

Small models could become particularly valuable where internet connectivity is poor.

For example, an app could contain a compact computer-vision model trained to examine photographs of skin lesions.

The workflow might be:

Camera → image model → risk estimate → recommendation to seek medical review

For example:

“This lesion contains characteristics that warrant professional examination.”

This should be treated as screening or decision support rather than an autonomous skin-cancer diagnosis.

Medical AI requires substantially higher standards for:

- Clinical validation
- Sensitivity and specificity
- Bias testing
- Dataset quality
- Failure analysis
- Human oversight
- Transparency
- Regulatory approval where applicable

The FDA already regulates AI-enabled medical devices and evaluates their safety and effectiveness for their intended use.

Resource: [FDA AI-Enabled Medical Devices](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices)

The important idea remains:

A small validated model could potentially bring useful screening capabilities to places where reliable cloud connectivity does not exist.

Similar possibilities include:

- Offline ECG anomaly detection
- Respiratory-sound screening
- Fall detection
- Image-quality checking before medical images are submitted
- Medication-label recognition
- Accessibility tools
- Basic health-data trend detection

High-stakes medical decisions should still involve appropriately qualified professionals.

### 4. Agriculture

A farmer could photograph a crop leaf.

A local vision model could identify:

- Possible plant disease
- Pest damage
- Nutrient deficiency
- Crop stress

No internet connection would necessarily be required.

This becomes particularly useful in remote agricultural environments.

### 5. Industrial Systems

Small models can run inside:

- Factories
- Vehicles
- Sensors
- Robotics systems
- Warehouses
- Drones

Examples:

Machine vibration → anomaly model → possible bearing failure

or:

Camera → vision model → manufacturing defect detected

Latency can be extremely low because data does not need to travel to a server.

### 6. Language and Translation

A small translation model could run entirely locally.

Useful for:

- Travelers
- Remote communities
- Emergency responders
- Military/field environments
- Privacy-sensitive conversations

### 7. Education

Imagine downloading an educational application once.

Inside it might be a small tutor specialized in:

- Grade-school mathematics
- English grammar
- Programming
- Science
- A particular curriculum

Students could use it without continuous internet access.

### 8. App Intelligence

Instead of every AI feature calling a server, applications could ship specialized models.

Examples:

- Autocomplete
- Search
- Classification
- Summarization
- OCR correction
- Voice commands
- Recommendation
- Intent detection
- Document extraction

Small models can therefore become another component of ordinary software.

## Deploying Small Models

Learning deployment should happen after your first training experiments.

Useful technologies include:

**llama.cpp** — Designed for efficient local LLM inference across many kinds of hardware and supports aggressive model quantization.

Resource: [llama.cpp](https://github.com/ggerganov/llama.cpp)

**ExecuTorch** — PyTorch’s edge inference system supports mobile phones, embedded hardware, laptops and other constrained devices.

Resource: [ExecuTorch](https://pytorch.org/executorch/)

**Apple Core ML** — Useful when targeting Apple hardware.

Resource: [Core ML documentation](https://developer.apple.com/documentation/coreml)

## 2. Post-Train a Small Model

Once you understand pretraining, stop training every model from zero.

Download a pretrained model instead.

Start around:

0.5B–3B parameters

The expensive language-learning stage has already happened.

Now teach it how you want it to behave.

### Pretraining vs Post-Training

Think of it as:

**Pretraining** — Learn language, concepts, patterns and representations.

**Post-training** — Learn how to answer users appropriately.

A useful simplified pipeline is:

Base model → SFT → preference optimization/RL → evaluation

### Step 1 — Pick a Base Model

Choose a relatively small pretrained model.

Initially, prioritize:

- Small parameter count
- Good documentation
- Hugging Face compatibility
- Permissive-enough licensing for your project
- Ability to run on your hardware

### Step 2 — Build an SFT Dataset

SFT means Supervised Fine-Tuning.

Create examples such as:

User:
Explain gravity to a 10-year-old.

Assistant:
Gravity is the force that pulls objects toward one another...

Thousands of high-quality examples can teach the model:

- Response style
- Formatting
- Domain terminology
- Tool usage
- Safety behavior
- Instruction following

### Step 3 — Perform SFT

Your pipeline becomes:

Pretrained model → instruction dataset → SFT → instruct model

Compare the original base model against the new model.

Do not simply assume the fine-tuned version is better.

### Step 4 — Learn LoRA

Instead of changing billions of weights, LoRA adds a relatively small number of trainable parameters.

Conceptually:

Frozen model + small trainable adapters

Advantages:

- Less GPU memory
- Smaller checkpoints
- Faster experimentation
- Multiple adapters for the same base model

### Step 5 — Learn Preference Tuning

After SFT, teach the model what responses are preferable.

Example:

Prompt:
Explain photosynthesis.

Response A:
Clear, correct explanation.

Response B:
Confusing and partially incorrect explanation.

Training data records:

A > B

One popular method is DPO — Direct Preference Optimization.

### Step 6 — Learn GRPO / Reinforcement Learning

For tasks where an answer can be scored automatically, reinforcement learning becomes especially interesting.

Mathematics example:

Problem → generate solution → check answer → reward correct solutions

Programming example:

Coding task → model writes program → run tests → reward passing code

This makes math and coding excellent environments for learning reinforcement-learning techniques.

Hugging Face TRL currently provides tooling for SFT, DPO, GRPO, reward modeling and other post-training approaches.

Resource: [Hugging Face TRL documentation](https://huggingface.co/docs/trl)

### Small-Model Post-Training Project

Take approximately a 0.5B–1.5B model.

Then:

1. Evaluate the untouched model.
2. Create 5,000–20,000 instruction examples.
3. Perform SFT.
4. Evaluate again.
5. Create preference data.
6. Perform DPO.
7. Evaluate again.
8. Optionally experiment with GRPO.
9. Quantize the resulting model.
10. Run it locally.

Your experiment should produce:

```text
BASE MODEL
    ↓
   SFT
    ↓
   DPO
    ↓
 GRPO/RL
    ↓
QUANTIZATION
    ↓
LOCAL APP
```

Keep results from every stage.

## 3. Post-Train Larger Models

Once small-model post-training makes sense, scale the same ideas upward.

Start around:

7B–14B

Later:

30B+

### The Concepts Stay the Same

You still have:

Base → SFT → preference optimization/RL → evaluation

The difference is engineering.

Large models introduce:

- Much greater VRAM requirements
- Multi-GPU training
- Distributed training
- Longer experiments
- More expensive mistakes
- More complicated checkpoint handling
- More demanding evaluation

This is why learning on small models first matters.

### Start Large-Model Training With LoRA / QLoRA

Do not begin by updating every parameter.

Start with LoRA, and then QLoRA.

QLoRA combines quantization of the base model with trainable low-rank adapters, significantly reducing memory requirements.

PyTorch’s torchtune provides workflows and recipes for fine-tuning, LoRA/QLoRA, evaluation, quantization and related tasks.

Resource: [torchtune documentation](https://pytorch.org/torchtune/)

### First Large-Model Project

Take a 7B–8B model.

Then:

1. Establish baseline evaluations.
2. Build a carefully curated dataset.
3. Quantize the base model if required.
4. Add LoRA adapters.
5. Perform supervised fine-tuning.
6. Evaluate.
7. Add preference training if useful.
8. Evaluate again.
9. Test domain-specific tasks.
10. Quantize for inference.
11. Deploy locally or behind an API.

Do not immediately jump into RL.

First become comfortable with SFT + LoRA/QLoRA.

### Why Post-Train Large Models?

Large models are useful where the task requires greater:

- Reasoning
- Language understanding
- Knowledge
- Coding ability
- Tool use
- Long-context processing
- Planning
- Generalization

Potential applications include:

- Coding assistants
- Research assistants
- Enterprise copilots
- Legal-document analysis
- Complex customer support
- Scientific assistants
- Agent systems
- Data analysis
- Advanced retrieval systems

These will often run on servers rather than directly inside ordinary phones.

### Large Models Can Also Teach Small Models

This is an especially important concept.

Suppose:

70B model = excellent performance

but:

1B model = cheap and deployable

Use the larger model as a teacher.

Generate:

- Explanations
- Synthetic data
- Demonstrations
- Preference labels
- Reasoning examples

Then train the smaller model using that information.

This is knowledge distillation.

Conceptually:

```text
Large Teacher Model
        ↓
Knowledge / Outputs
        ↓
Training Dataset
        ↓
Small Student Model
        ↓
Mobile / Edge Deployment
```

torchtune, for example, documents a workflow that distills an 8B teacher into a 1B student.

This becomes one of the most interesting areas to explore after learning both small and large model training.

## The Complete Mental Model

```text
                 DATA
                  │
                  ▼
             TOKENIZATION
                  │
                  ▼
        SMALL MODEL FROM SCRATCH
                  │
             PRETRAINING
                  │
                  ▼
             BASE MODEL
                  │
                  ▼
                 SFT
                  │
                  ▼
        PREFERENCE TRAINING
            DPO / GRPO / RL
                  │
                  ▼
             EVALUATION
                  │
                  ▼
            QUANTIZATION
                  │
                  ▼
             DEPLOYMENT
```

Then scale:

```text
Small models
    ↓
Understand the fundamentals
    ↓
Post-train small pretrained models
    ↓
Deploy models locally
    ↓
Post-train 7B+
    ↓
Distributed training
    ↓
Advanced RL
    ↓
Large teacher models
    ↓
Distillation
    ↓
Powerful small models
    ↓
Edge / mobile products
```

## Recommended Project Sequence

### Project 1 — Build an LLM

20M–50M model + TinyStories

Learn:

- Tokenization
- Transformers
- Training
- Loss
- Optimizers
- Checkpoints
- Generation

### Project 2 — Change the Dataset

Train another small model on mathematics or code.

Compare how learned behavior changes.

### Project 3 — Fine-Tune a Small Pretrained Model

Use a 0.5B–1.5B model.

Learn:

- Hugging Face
- SFT
- Instruction datasets
- Chat templates

### Project 4 — LoRA

Repeat Project 3 using adapters instead of full fine-tuning.

Learn:

- PEFT
- Adapter weights
- Memory efficiency

### Project 5 — Preference Training

Create prompt + chosen + rejected data.

Learn:

- DPO
- Preference datasets
- Alignment

### Project 6 — GRPO

Choose mathematics or code.

Create an automatically verifiable reward.

Learn:

- Sampling
- Rewards
- Policy improvement
- Reinforcement learning

### Project 7 — Ship the Model

Quantize your small model.

Run it with:

- llama.cpp
- ExecuTorch
- Core ML

Put it inside a simple desktop or mobile application.

This project is extremely important because it connects model research with product engineering.

### Project 8 — Fine-Tune a 7B/8B Model

Use QLoRA + a carefully curated dataset.

Learn:

- GPU memory management
- Quantization
- Larger checkpoints
- Better evaluation

### Project 9 — Distillation

Take a large teacher → small student.

Try to transfer useful behavior into something much cheaper to run.

## Tools Map

| Tool | Purpose |
| --- | --- |
| Python | Main programming language |
| PyTorch | Neural-network training |
| Hugging Face | Models, datasets and tooling |
| TinyStories | First pretraining dataset |
| nanochat | Study complete LLM pipeline |
| TRL | SFT, DPO, GRPO, reward training |
| torchtune | Fine-tuning/LoRA/QLoRA workflows |
| LM Evaluation Harness | Model evaluation |
| llama.cpp | Local LLM inference |
| ExecuTorch | Mobile/edge inference |
| Core ML | Apple on-device ML |
| Git/GitHub | Code/version control |
| Bash | Training automation |
| cURL | API testing |
| Kaggle | Datasets and GPU notebooks |

## The Most Important Habit

Do not think:

“I fine-tuned a model, therefore it improved.”

Think:

```text
MODEL A
   ↓
EVALUATE
   ↓
CHANGE ONE THING
   ↓
MODEL B
   ↓
EVALUATE
   ↓
COMPARE
```

Every training experiment should answer a question.

Examples:

- Does better data outperform more data?
- Does SFT improve instruction following?
- Does DPO improve response preference?
- Does GRPO improve mathematical accuracy?
- How much quality is lost when going from FP16 to 4-bit?
- Can a 1B student retain most of the useful behavior of an 8B teacher?

That experimental mindset is ultimately more valuable than simply knowing how to run a fine-tuning command.

## Final Direction

The learning path can be summarized in three phases:

### Phase 1 — Understand

Train small models from scratch.

Learn exactly how transformers acquire capabilities.

### Phase 2 — Adapt and Ship

Post-train small pretrained models and put them into applications.

Learn SFT, LoRA, DPO, GRPO, quantization and edge deployment.

### Phase 3 — Scale

Post-train larger models and use them as powerful systems or teachers for smaller models.

Learn QLoRA, distributed training, advanced post-training, evaluation and distillation.

The ultimate goal is not necessarily to build the biggest model.

It is to understand how much intelligence is actually required for a given task and how efficiently that intelligence can be trained, evaluated and delivered to the user.
