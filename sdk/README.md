# @iap/sdk

Reference implementation for [Inter-AI Protocol (IAP)](https://github.com/molty-assistant/inter-ai-protocol) - a minimal specification for task handoff between AI agents.

## Installation

```bash
npm install @iap/sdk
```

## Quick Start

```typescript
import { createTask, validate, TaskBuilder } from '@iap/sdk';

// Quick creation
const task = createTask({
  sender: { agent_id: 'my-agent' },
  task: { intent: 'Summarize this document' }
});

// Builder pattern (recommended for complex tasks)
const researchTask = new TaskBuilder()
  .from('my-agent', 'me@agentmail.to')
  .intent('Research AI security trends')
  .details('Need comprehensive overview of supply chain attacks...')
  .asyncDelivery('https://my-webhook.com/tasks')
  .timeLimit('30m')
  .toolsAllowed(['web_search', 'web_fetch'])
  .successCriteria([
    'At least 5 sources cited',
    'Covers 2024-2025 timeframe'
  ])
  .outputFormat('markdown')
  .onFailure('return_partial')
  .build();

// Validation
const errors = validate(task);
if (errors.length > 0) {
  console.error('Invalid task:', errors);
}
```

## API

### Creating Tasks

#### `createTask(options)`

Create a task handoff object with sensible defaults.

```typescript
const task = createTask({
  sender: { agent_id: 'my-agent', email: 'me@agentmail.to' },
  task: { 
    intent: 'Research topic',
    details: 'Full context here...'
  },
  constraints: { time_limit: '30m' },
  success_criteria: ['Has at least 5 sources'],
  output: { format: 'markdown' },
  on_failure: { action: 'return_partial' }
});
```

#### `TaskBuilder`

Fluent API for building complex tasks.

```typescript
const task = new TaskBuilder()
  // Sender
  .from('agent-id', 'email@agentmail.to', 'framework')
  
  // Task
  .intent('One-line description')
  .details('Multi-line context')
  .context('Inline context')
  .contextRef('https://large-context-url.com/data')
  
  // Delivery
  .syncDelivery()                                    // Wait for response
  .asyncDelivery('https://webhook', 'https://status') // Webhook callback
  .emailDelivery('recipient@agentmail.to')           // Email delivery
  
  // Constraints
  .timeLimit('30m')
  .tokenBudget(5000)
  .toolsAllowed(['web_search', 'code_exec'])
  .toolsDenied(['send_email'])
  .scope('Do not contact external services')
  .requiresCapabilities(['code_exec'])
  
  // Success & Output
  .successCriteria(['Criterion 1', 'Criterion 2'])
  .outputFormat('markdown')
  .deliverTo('file:///output.md')
  
  // Failure handling
  .onFailure('return_partial', { max_retries: 2 })
  
  .build();
```

### Validation

#### `validate(task)`

Returns array of validation errors (empty if valid).

```typescript
const errors = validate(task);
// [{ path: 'sender.agent_id', message: 'Required string' }]
```

#### `isValid(task)`

Type guard that returns true if task is valid.

```typescript
if (isValid(task)) {
  // TypeScript knows task is IAPTaskHandoff
}
```

### Parsing & Serialization

#### `parse(jsonString)`

Parse JSON string into validated task object.

```typescript
const task = parse('{"iap_version":"0.2",...}');
```

#### `toJSON(task, pretty?)`

Serialize task to JSON string.

```typescript
const json = toJSON(task);        // Pretty-printed
const compact = toJSON(task, false);  // Compact
```

### Creating Results

#### `createResult(options)`

Create a task result object for responding to a task.

```typescript
const result = createResult({
  task_id: 'original-task-id',
  status: 'complete',  // 'complete' | 'partial' | 'failed' | 'in_progress'
  result: { summary: '...' },
  criteria_met: ['Criterion 1'],
  criteria_unmet: ['Criterion 2'],
  agent_id: 'responder-agent'
});
```

## Types

Full TypeScript types exported:

- `IAPTaskHandoff` - Main task handoff object
- `IAPTaskResult` - Task result/response object
- `IAPSender` - Sender information
- `IAPDelivery` - Delivery configuration
- `IAPTask` - Task description
- `IAPConstraints` - Execution constraints
- `IAPOutput` - Output format specification
- `IAPOnFailure` - Failure handling
- `IAPValidationError` - Validation error

## License

MIT
