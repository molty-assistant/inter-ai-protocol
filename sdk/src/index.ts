/**
 * Inter-AI Protocol SDK v0.1.0
 * Reference implementation for task handoff between AI agents
 * 
 * @example
 * ```typescript
 * import { createTask, validate, TaskBuilder } from '@iap/sdk';
 * 
 * // Quick creation
 * const task = createTask({
 *   sender: { agent_id: 'my-agent' },
 *   task: { intent: 'Summarize this document' }
 * });
 * 
 * // Builder pattern
 * const task = new TaskBuilder()
 *   .from('my-agent', 'me@agentmail.to')
 *   .intent('Research AI security trends')
 *   .details('Need comprehensive overview...')
 *   .asyncDelivery('https://my-webhook.com')
 *   .timeLimit('30m')
 *   .successCriteria(['At least 5 sources', 'Covers 2024-2025'])
 *   .build();
 * 
 * // Validation
 * const errors = validate(task);
 * ```
 */

export * from './types.js';

import type {
  IAPTaskHandoff,
  IAPTaskResult,
  IAPValidationError,
  IAPSender,
  IAPTask,
  IAPDelivery,
  IAPConstraints,
  IAPOutput,
  IAPOnFailure,
} from './types.js';

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validate an IAP Task Handoff object
 * @returns Array of validation errors (empty if valid)
 */
export function validate(task: unknown): IAPValidationError[] {
  const errors: IAPValidationError[] = [];
  
  if (!task || typeof task !== 'object') {
    errors.push({ path: '', message: 'Task must be an object' });
    return errors;
  }
  
  const t = task as Record<string, unknown>;
  
  // Required: iap_version
  if (t.iap_version !== '0.2') {
    errors.push({ path: 'iap_version', message: 'Must be "0.2"' });
  }
  
  // Required: task_id
  if (typeof t.task_id !== 'string' || !t.task_id) {
    errors.push({ path: 'task_id', message: 'Required string' });
  }
  
  // Required: sender
  if (!t.sender || typeof t.sender !== 'object') {
    errors.push({ path: 'sender', message: 'Required object' });
  } else {
    const sender = t.sender as Record<string, unknown>;
    if (typeof sender.agent_id !== 'string' || !sender.agent_id) {
      errors.push({ path: 'sender.agent_id', message: 'Required string' });
    }
  }
  
  // Required: task
  if (!t.task || typeof t.task !== 'object') {
    errors.push({ path: 'task', message: 'Required object' });
  } else {
    const task = t.task as Record<string, unknown>;
    if (typeof task.intent !== 'string' || !task.intent) {
      errors.push({ path: 'task.intent', message: 'Required string' });
    }
  }
  
  // Optional: delivery
  if (t.delivery !== undefined) {
    if (typeof t.delivery !== 'object') {
      errors.push({ path: 'delivery', message: 'Must be an object' });
    } else {
      const delivery = t.delivery as Record<string, unknown>;
      const validMethods = ['sync', 'async', 'email'];
      if (!validMethods.includes(delivery.method as string)) {
        errors.push({ path: 'delivery.method', message: 'Must be "sync", "async", or "email"' });
      }
      if (delivery.method === 'async' && !delivery.webhook) {
        errors.push({ path: 'delivery.webhook', message: 'Required for async delivery' });
      }
      if (delivery.method === 'email' && !delivery.email) {
        errors.push({ path: 'delivery.email', message: 'Required for email delivery' });
      }
    }
  }
  
  // Optional: output
  if (t.output !== undefined) {
    if (typeof t.output !== 'object') {
      errors.push({ path: 'output', message: 'Must be an object' });
    } else {
      const output = t.output as Record<string, unknown>;
      const validFormats = ['markdown', 'json', 'yaml', 'code', 'freeform'];
      if (!validFormats.includes(output.format as string)) {
        errors.push({ path: 'output.format', message: 'Must be markdown, json, yaml, code, or freeform' });
      }
    }
  }
  
  // Optional: on_failure
  if (t.on_failure !== undefined) {
    if (typeof t.on_failure !== 'object') {
      errors.push({ path: 'on_failure', message: 'Must be an object' });
    } else {
      const onFailure = t.on_failure as Record<string, unknown>;
      const validActions = ['return_partial', 'retry', 'escalate', 'abort'];
      if (!validActions.includes(onFailure.action as string)) {
        errors.push({ path: 'on_failure.action', message: 'Must be return_partial, retry, escalate, or abort' });
      }
    }
  }
  
  return errors;
}

/**
 * Check if a task handoff object is valid
 */
export function isValid(task: unknown): task is IAPTaskHandoff {
  return validate(task).length === 0;
}

/**
 * Create a task handoff object with defaults
 */
export function createTask(options: {
  task_id?: string;
  sender: IAPSender;
  delivery?: IAPDelivery;
  task: IAPTask;
  constraints?: IAPConstraints;
  success_criteria?: string[];
  output?: IAPOutput;
  on_failure?: IAPOnFailure;
}): IAPTaskHandoff {
  return {
    iap_version: '0.2',
    task_id: options.task_id ?? generateTaskId(),
    sender: options.sender,
    delivery: options.delivery,
    task: options.task,
    constraints: options.constraints,
    success_criteria: options.success_criteria,
    output: options.output,
    on_failure: options.on_failure,
  };
}

/**
 * Create a task result object
 */
export function createResult(options: {
  task_id: string;
  status: IAPTaskResult['status'];
  result?: unknown;
  error?: string;
  criteria_met?: string[];
  criteria_unmet?: string[];
  agent_id?: string;
}): IAPTaskResult {
  return {
    task_id: options.task_id,
    status: options.status,
    result: options.result,
    error: options.error,
    criteria_met: options.criteria_met,
    criteria_unmet: options.criteria_unmet,
    metadata: {
      completed_at: new Date().toISOString(),
      agent_id: options.agent_id,
    },
  };
}

/**
 * Builder pattern for creating task handoff objects
 */
export class TaskBuilder {
  private _taskId?: string;
  private _sender?: IAPSender;
  private _delivery?: IAPDelivery;
  private _task?: IAPTask;
  private _constraints?: IAPConstraints;
  private _successCriteria?: string[];
  private _output?: IAPOutput;
  private _onFailure?: IAPOnFailure;

  /** Set the task ID (auto-generated if not set) */
  taskId(id: string): this {
    this._taskId = id;
    return this;
  }

  /** Set the sender */
  from(agentId: string, email?: string, framework?: string): this {
    this._sender = { agent_id: agentId, email, framework };
    return this;
  }

  /** Set the sender object directly */
  sender(sender: IAPSender): this {
    this._sender = sender;
    return this;
  }

  /** Set the task intent (one-line description) */
  intent(intent: string): this {
    this._task = { ...this._task, intent } as IAPTask;
    return this;
  }

  /** Set the task details (multi-line context) */
  details(details: string): this {
    this._task = { ...this._task, details } as IAPTask;
    return this;
  }

  /** Set inline context */
  context(context: string): this {
    this._task = { ...this._task, context } as IAPTask;
    return this;
  }

  /** Set context reference (URL or file) */
  contextRef(ref: string): this {
    this._task = { ...this._task, context_ref: ref } as IAPTask;
    return this;
  }

  /** Set task object directly */
  task(task: IAPTask): this {
    this._task = task;
    return this;
  }

  /** Set synchronous delivery (default) */
  syncDelivery(): this {
    this._delivery = { method: 'sync' };
    return this;
  }

  /** Set async webhook delivery */
  asyncDelivery(webhook: string, statusEndpoint?: string): this {
    this._delivery = { method: 'async', webhook, status_endpoint: statusEndpoint };
    return this;
  }

  /** Set email delivery */
  emailDelivery(email: string): this {
    this._delivery = { method: 'email', email };
    return this;
  }

  /** Set delivery object directly */
  delivery(delivery: IAPDelivery): this {
    this._delivery = delivery;
    return this;
  }

  /** Set time limit constraint */
  timeLimit(limit: string): this {
    this._constraints = { ...this._constraints, time_limit: limit };
    return this;
  }

  /** Set token budget constraint */
  tokenBudget(budget: number): this {
    this._constraints = { ...this._constraints, token_budget: budget };
    return this;
  }

  /** Set allowed tools */
  toolsAllowed(tools: string[]): this {
    this._constraints = { ...this._constraints, tools_allowed: tools };
    return this;
  }

  /** Set denied tools */
  toolsDenied(tools: string[]): this {
    this._constraints = { ...this._constraints, tools_denied: tools };
    return this;
  }

  /** Set scope constraint */
  scope(scope: string): this {
    this._constraints = { ...this._constraints, scope };
    return this;
  }

  /** Set required capabilities */
  requiresCapabilities(caps: string[]): this {
    this._constraints = { ...this._constraints, requires_capabilities: caps };
    return this;
  }

  /** Set constraints object directly */
  constraints(constraints: IAPConstraints): this {
    this._constraints = constraints;
    return this;
  }

  /** Set success criteria */
  successCriteria(criteria: string[]): this {
    this._successCriteria = criteria;
    return this;
  }

  /** Add a success criterion */
  addCriterion(criterion: string): this {
    this._successCriteria = [...(this._successCriteria ?? []), criterion];
    return this;
  }

  /** Set output format */
  outputFormat(format: IAPOutput['format'], schema?: string): this {
    this._output = { format, schema };
    return this;
  }

  /** Set output delivery location */
  deliverTo(location: string): this {
    this._output = { ...this._output, deliver_to: location } as IAPOutput;
    return this;
  }

  /** Set output object directly */
  output(output: IAPOutput): this {
    this._output = output;
    return this;
  }

  /** Set on_failure action */
  onFailure(action: IAPOnFailure['action'], options?: { max_retries?: number; escalate_to?: string }): this {
    this._onFailure = { action, ...options };
    return this;
  }

  /** Build the task handoff object */
  build(): IAPTaskHandoff {
    if (!this._sender) {
      throw new Error('Sender is required - call from() or sender()');
    }
    if (!this._task?.intent) {
      throw new Error('Task intent is required - call intent() or task()');
    }
    
    return createTask({
      task_id: this._taskId,
      sender: this._sender,
      delivery: this._delivery,
      task: this._task,
      constraints: this._constraints,
      success_criteria: this._successCriteria,
      output: this._output,
      on_failure: this._onFailure,
    });
  }
}

/**
 * Parse a JSON or YAML string into a task handoff object
 * Validates the result and throws if invalid
 */
export function parse(input: string): IAPTaskHandoff {
  let parsed: unknown;
  
  // Try JSON first
  try {
    parsed = JSON.parse(input);
  } catch {
    // Basic YAML-like parsing (for simple cases)
    // Full YAML would need a dependency - keep it minimal
    throw new Error('Only JSON format is supported in this version. For YAML, use a YAML parser first.');
  }
  
  const errors = validate(parsed);
  if (errors.length > 0) {
    const messages = errors.map(e => `${e.path}: ${e.message}`).join(', ');
    throw new Error(`Invalid IAP task: ${messages}`);
  }
  
  return parsed as IAPTaskHandoff;
}

/**
 * Serialize a task handoff object to JSON
 */
export function toJSON(task: IAPTaskHandoff, pretty = true): string {
  return JSON.stringify(task, null, pretty ? 2 : undefined);
}
